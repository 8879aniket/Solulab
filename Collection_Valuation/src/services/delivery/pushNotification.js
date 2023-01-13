const FCMHelper = require('../../helpers/fcm.helper')

module.exports = async ({ deliveryInfo: { push }, metadata }) => {
    const {
        title = 'Notification From Collection Valuation'
    } = metadata

    const options = {
        title,
        notification: {
            title: title,
            body: JSON.stringify(metadata),
        },
        data: {
            title,
            body: JSON.stringify(metadata),
        },
    }


    // Send FCM TOKEN
    if (push) {
        await FCMHelper.SendToToken(options, push)
    }
}





// const FCM = require('fcm-node');
// const { firebaseServerKey } = require('../../config/config');
// const logger = require('../../common/middlewares/logger');

// const fcm = new FCM(firebaseServerKey);
// const { get } = require('../../dbServices/v1/user');
// const { fetchUser, updateBadge } = require('../firebase_functions');

// module.exports = async ({ deliveryInfo: { push }, metadata }) => {
//   try {
//     const {
//       title, description, userId, notificationType, sendPush, feedId, firstName, lastName, soshId, activityId, _id, profilePic, name, entryId, withdrawalId, senderWalletId, senderFirstName, senderLastName, senderUserType, amount, senderProfilePic, entryName, payerType, beneficiaryType, activityName, activityType, requestId, senderUniqueName, fromUserId,
//     } = metadata;
//     logger.info(`metadata ${metadata}`);
//     let badge = '';
//     let abadgeUp = 0;
//     if (push && push !== '' && sendPush === 'true') {
//       let message;
//       const user = await get(push, 'fcmToken');
//       const fbUser = await fetchUser(user._id);
//       setTimeout(() => {
//         if (fbUser !== undefined) {
//           let fbadge = fbUser.badge;
//           let abadge = fbUser.appBadge;
//           if (fbadge === 'NaN' || fbadge === undefined || fbadge === 'undefined') {
//             fbadge = 0;
//           }
//           if (abadge === 'NaN' || abadge === undefined || abadge === 'undefined') {
//             abadge = 0;
//           }
//           badge = parseInt(fbadge, 10) + parseInt(abadge, 10) + 1;
//           abadgeUp = parseInt(abadge, 10) + 1;
//           badge = badge.toString();
//         }

//         if (user.deviceType === 'ios') {
//           message = {
//             to: push,
//             notification: {
//               title,
//               body: description,
//               badge,
//               sound: 'default',
//             },
//             data: {
//               title,
//               body: description,
//               userId: userId.toString(),
//               fromUserId: fromUserId.toString(),
//               notificationType,
//               firstName: firstName === undefined ? '' : firstName,
//               lastName: lastName === undefined ? '' : lastName,
//               feedId: feedId === undefined ? '' : feedId.toString(),
//               soshId: soshId === undefined ? '' : soshId.toString(),
//               activityId: activityId === undefined ? '' : activityId.toString(),
//               _id: _id.toString(),
//               profilePic: profilePic === undefined ? '' : profilePic,
//               name: name === undefined ? '' : name,
//               entryId: entryId === undefined ? '' : entryId.toString(),
//               withdrawalId: withdrawalId === undefined ? '' : withdrawalId.toString(),
//               senderWalletId: senderWalletId === undefined ? '' : senderWalletId,
//               senderFirstName: senderFirstName === undefined ? '' : senderFirstName,
//               senderLastName: senderLastName === undefined ? '' : senderLastName,
//               senderUserType: senderUserType === undefined ? '' : senderUserType,
//               senderUniqueName: senderUniqueName === undefined ? '' : senderUniqueName,
//               amount: amount === undefined ? '' : amount,
//               senderProfilePic: senderProfilePic === undefined ? '' : senderProfilePic,
//               entryName: entryName === undefined ? '' : entryName,
//               activityName: activityName === undefined ? '' : activityName,
//               payerType: payerType === undefined ? '' : payerType,
//               beneficiaryType: beneficiaryType === undefined ? '' : beneficiaryType,
//               activityType: activityType === undefined ? '' : activityType,
//               requestId: requestId === undefined ? '' : requestId,
//             },
//           };
//         } else {
//           message = {
//             to: push,
//             data: {
//               title,
//               message: description,
//               userId: userId.toString(),
//               fromUserId: fromUserId.toString(),
//               notificationType,
//               firstName: firstName === undefined ? '' : firstName,
//               lastName: lastName === undefined ? '' : lastName,
//               feedId: feedId === undefined ? '' : feedId.toString(),
//               soshId: soshId === undefined ? '' : soshId.toString(),
//               activityId: activityId === undefined ? '' : activityId.toString(),
//               _id: _id.toString(),
//               profilePic: profilePic === undefined ? '' : profilePic,
//               name: name === undefined ? '' : name,
//               entryId: entryId === undefined ? '' : entryId.toString(),
//               withdrawalId: withdrawalId === undefined ? '' : withdrawalId.toString(),
//               senderWalletId: senderWalletId === undefined ? '' : senderWalletId,
//               senderFirstName: senderFirstName === undefined ? '' : senderFirstName,
//               senderLastName: senderLastName === undefined ? '' : senderLastName,
//               senderUserType: senderUserType === undefined ? '' : senderUserType,
//               senderUniqueName: senderUniqueName === undefined ? '' : senderUniqueName,
//               amount: amount === undefined ? '' : amount,
//               senderProfilePic: senderProfilePic === undefined ? '' : senderProfilePic,
//               entryName: entryName === undefined ? '' : entryName,
//               activityName: activityName === undefined ? '' : activityName,
//               payerType: payerType === undefined ? '' : payerType,
//               beneficiaryType: beneficiaryType === undefined ? '' : beneficiaryType,
//               activityType: activityType === undefined ? '' : activityType,
//               requestId: requestId === undefined ? '' : requestId,
//               badge,
//             },
//           };
//         }

//         fcm.send(message, (err, response) => {
//           if (err) {
//             logger.info(`message ${message}`);
//             logger.error(`Something has gone wrong: ${err}`);
//           } else {
//             updateBadge(user._id, abadgeUp);
//             logger.info(`message ${message}`);
//             logger.info(`Successfully sent with response: ${response}`);
//           }
//         });
//       }, 2000);
//     }
//   } catch (error) {
//     throw error;
//   }
// };
