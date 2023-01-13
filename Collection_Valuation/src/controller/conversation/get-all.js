// import MongoId from '@helpers/object-id-validator.helper'
const _ = require('lodash')
const {
  handleResponse,
  handleError,
} = require('../../common/middlewares/requestHandlers.js')
const Paginator = require('../../helpers/pagination.helper')

const Conversation = require('../../models/conversation')


async function GetAllTeams(req, res) {
  const { user: __user } = req
  const { q, group, itemsPerPage, startIndex } = req.query

  // Create the fetch query
  const query = {
    'participants._user': __user._id,
  }

  if (group !== undefined) {
    query['participantsCount'] = group ? { $gt: 2 } : { $eq: 2 }
  }

  const result = await Paginator.Paginate({
    model: Conversation,
    q: q ? q.toString() : null,
    query,
    projection: {
      name: 1,
      'participants._user': 1,
      'participants.unseenCount': 1,
      participantsCount: 1,
      _lastMessage: 1,
    },
    populate: [
      {
        path: 'participants._user',
        select: 'firstName middleName lastName profilePic',
      },
      {
        path: '_lastMessage',
      },
    ],
    startIndex: +startIndex,
    itemsPerPage: +itemsPerPage,
  })

  // All Done
  return handleResponse({ 
    statusCode: 200,
    msg: 'Conversations fetch successful.',
    res, 
    data: result 
  });
}


module.exports = GetAllTeams