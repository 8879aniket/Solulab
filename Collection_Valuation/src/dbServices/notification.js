const { ObjectId } = require('mongoose').Types;

const _ = require('lodash')
const Paginator = require('../helpers/pagination.helper')
const Model = require('../models/notificationModel');
const Notification = Model

const {
  notificationSettings: { deliveryModesForNotificationTypes },
  emailSettings,
} = require('../config/config');

module.exports.save = async ({
  notificationType,
  metadata,
  userId: from,
  to = 'admin',
  deliveryInfo,
  deliveryModes = deliveryModesForNotificationTypes[notificationType.toString()],
}) => {
  try {
    const notification = {
      from: from || emailSettings.from,
      to,
      deliveryModes,
      metadata,
      notificationType,
      deliveryInfo: to === 'admin' ? { email: emailSettings.admin.email } : deliveryInfo,
    };
    await new Model(notification).save();
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports.saveMany = async (data) => {
  try {
    await Model.insertMany(data);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports.getAll = async (userId, skip, limit, keyword) => {
  try {
    let matchCondition = {
      $match: {},
    };

    if (keyword && keyword.length >= 0) {
      keyword = keyword.replace(/[^a-zA-Z0-9 ]/gi, '');
      // eslint-disable-next-line security/detect-non-literal-regexp
      const re = new RegExp(`${keyword}`, 'i');
      matchCondition = {
        $match: {
          $or: [
            {
              description: { $regex: re },
            },
            {
              body: { $regex: re },
            },
          ],
        },
      };
    }

    let result = await Model.aggregate([
      {
        $unwind: '$deliveryModes',
      },
      {
        $match: {
          to: ObjectId(userId),
          deliveryModes: 'push',
        },
      },
      {
        $addFields: {
          'metadata.userId': '$metadata._id',
          'metadata.isRead': '$isRead',
          'metadata._id': '$_id',
          'metadata.isSuperAdmin': '$isSuperAdmin',
          'metadata.isDeleted': '$isDeleted',
          'metadata.created': '$created',
          'metadata.fromUserId': { $toObjectId: '$metadata.fromUserId' },
          'metadata.amount': { $toDouble: '$metadata.amount' },
        },
      },
      {
        $replaceRoot: { newRoot: '$metadata' },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$fromUserId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] },
              },
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
                profilePic: 1,
                _id: 0,
              },
            },
          ],
          as: 'userData',
        },
      },
      {
        $lookup: {
          from: 'activities',
          let: { userId: '$fromUserId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] },
              },
            },
            {
              $project: {
                name: 1,
                coverPic: 1,
                type: 1,
                _id: 0,
              },
            },
          ],
          as: 'activityData',
        },
      },
      {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$activityData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          profilePic: { $ifNull: ['$userData.profilePic', '$activityData.coverPic'] },
          firstName: '$userData.firstName',
          lastName: '$userData.lastName',
          activityName: '$activityData.name',
          amount: {
            $cond: [
              {
                $eq: ['$amount', null],
              },
              '$$REMOVE',
              '$amount',
            ],
          },
        },
      },
      {
        $project: {
          title: 0,
          subject: 0,
          sendPush: 0,
          activityData: 0,
          userData: 0,
          attachmentContent: 0,
          attachmentFilename: 0,
        },
      },
      matchCondition,
      {
        $sort: {
          created: -1,
        },
      },
      {
        $facet: {
          list: [{ $skip: skip }, { $limit: limit }],
          totalRecords: [{ $count: 'count' }],
          unreadCount: [{ $match: { isRead: false } }, { $count: 'count' }],
        },
      },
      {
        $addFields: {
          totalRecords: '$totalRecords.count',
          unreadCount: '$unreadCount.count',
        },
      },
      {
        $unwind: {
          path: '$totalRecords',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$unreadCount',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (result[0].list.length > 0) {
      [result] = result;
      return result;
    }
    return {};
  } catch (error) {
    throw error;
  }
};

module.exports.GetAll = async (options) => {
  try {
    const { _user, search, startIndex, itemsPerPage } = options

    const matchObj = {
      to: _user
    };

    if (search) {
      matchObj.$or = [
        {
          'metadata.body': { $regex: search, $options: 'i' },
        },
      ];
    }


    const projection = {}
    const sort = { created: -1 }


    const result = await Paginator.Paginate({
      model: Notification,
      query: _.omitBy(matchObj, _.isNil),
      projection: projection,
      sort,
      startIndex: +startIndex,
      itemsPerPage: +itemsPerPage,
    })

    const fetchedNotificationIds = await Promise.all(result.items.map(e => e._id))

    // Auto mark notifications as read
    await Notification.updateMany(
      {
        _id: { $in: fetchedNotificationIds },
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    )

    return result;
  } catch (error) {
    throw error;
  }
};


module.exports.readNotification = async (id) => {
  try {
    await Model.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports.unreadCount = async (userId) => {
  try {
    let result = await Model.aggregate([
      {
        $unwind: '$deliveryModes',
      },
      {
        $match: {
          isRead: false,
          to: ObjectId(userId),
          deliveryModes: 'push',
        },
      },
      {
        $facet: {
          count: [
            {
              $count: 'count',
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$count',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          count: {
            $cond: {
              if: {
                $gte: ['$count.count', 0],
              },
              then: '$count.count',
              else: 0,
            },
          },
        },
      },
    ]);
    [result] = result;
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports.superAdminNotifications = async () => {
  try {
    let result = await Model.aggregate([
      {
        $unwind: '$deliveryModes',
      },
      {
        $match: {
          isSuperAdmin: true,
          deliveryModes: 'push',
          $or: [
            {
              'metadata.reportType': 'sosh',
            },
            {
              'metadata.reportType': 'soshMember',
            },
            {
              'metadata.reportType': 'soshActivity',
            },
            {
              'metadata.reportType': 'user',
            },
          ],
        },
      },
      {
        $addFields: {
          'metadata.userId': '$metadata._id',
          'metadata.isRead': '$isRead',
          'metadata._id': '$_id',
          'metadata.isSuperAdmin': '$isSuperAdmin',
          'metadata.isDeleted': '$isDeleted',
          'metadata.created': '$created',
          'metadata.fromUserId': { $toObjectId: '$metadata.userId' },
        },
      },
      {
        $replaceRoot: { newRoot: '$metadata' },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$fromUserId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] },
              },
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
                profilePic: 1,
                _id: 0,
              },
            },
          ],
          as: 'userData',
        },
      },
      {
        $lookup: {
          from: 'activities',
          let: { userId: '$fromUserId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] },
              },
            },
            {
              $project: {
                name: 1,
                coverPic: 1,
                type: 1,
                _id: 0,
              },
            },
          ],
          as: 'activityData',
        },
      },
      {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$activityData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          profilePic: { $ifNull: ['$userData.profilePic', '$activityData.coverPic'] },
          senderProfilePic: { $ifNull: ['$userData.profilePic', '$activityData.coverPic'] },
          firstName: '$userData.firstName',
          lastName: '$userData.lastName',
          activityName: '$activityData.name',
        },
      },
      {
        $project: {
          title: 0,
          subject: 0,
          sendPush: 0,
          activityData: 0,
          userData: 0,
          attachmentContent: 0,
          attachmentFilename: 0,
        },
      },
      {
        $sort: {
          created: -1,
        },
      },
      {
        $facet: {
          sosh: [
            {
              $match: {
                $or: [
                  {
                    reportType: 'sosh',
                  },
                  {
                    reportType: 'soshMember',
                  },
                ],
              },
            },
          ],
          activity: [
            {
              $match: {
                reportType: 'soshActivity',
              },
            },
          ],
          user: [
            {
              $match: {
                reportType: 'user',
              },
            },
          ],
        },
      },
    ]);
    [result] = result;
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports.superAdminUnreadCount = async () => {
  try {
    let result = await Model.aggregate([
      {
        $unwind: '$deliveryModes',
      },
      {
        $match: {
          isRead: false,
          deliveryModes: 'push',
          isSuperAdmin: true,
        },
      },
      {
        $facet: {
          count: [
            {
              $count: 'count',
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$count',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          count: {
            $cond: {
              if: {
                $gte: ['$count.count', 0],
              },
              then: '$count.count',
              else: 0,
            },
          },
        },
      },
    ]);
    [result] = result;
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports.superAdminReadNotification = async () => {
  try {
    await Model.updateMany(
      {
        isSuperAdmin: true,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );
    return true;
  } catch (error) {
    throw error;
  }
};
