// import MongoId from '@helpers/object-id-validator.helper'
const _ = require('lodash')
const {
  handleResponse,
  handleError,
} = require('../../common/middlewares/requestHandlers.js')
const Paginator = require('../../helpers/pagination.helper')
const Message = require('../../models/message')
const Conversation = require('../../models/conversation')

async function GetAllMessage(req, res) {
  const { user: __user } = req
  const { conversationId: _conversation } = req.params
  const {
    // q,
    // group,
    itemsPerPage,
    startIndex,
  } = req.query

  // Check if the provided object ids are invalid
  // const objectIdFields = _.pickBy({ _conversation }, _.identity)
  // if (Object.keys(objectIdFields).length) {
  //   const { hasInvalid, invalid: invalidMongoIds } = await MongoId.Validate({
  //     ...objectIdFields,
  //   })
  //   if (hasInvalid) {
  //     return res.invalidMongoId({
  //       error: invalidMongoIds,
  //     })
  //   }
  // }

  // Fetch the conversation by id and user participation
  const conversation = await Conversation.findOne({
    _id: _conversation,
    'participants._user': __user._id,
  })

  if (!conversation) {
    // All Done
    return handleResponse({
      statusCode: 422,
      msg: 'Invalid MongoId',
      res,
    });
  }

  // Create the fetch query
  const query = {
    _conversation: _conversation,
  }

  const result = await Paginator.Paginate({
    model: Message,
    query,
    startIndex: +startIndex,
    itemsPerPage: +itemsPerPage,
  })

  // Mark messages as read for that user
  const { items } = result
  const messageIds = items.map((e) => e._id.toString())
  await _MarkMessagesRead(messageIds, __user._id.toString())

  // All Done
  return handleResponse({
    statusCode: 200,
    msg: 'Conversation messages fetch successful.',
    res,
    data: result
  });
}

// Implementation to Mark Messages read!
async function _MarkMessagesRead(messageIds, userId) {
  // Fetch the effected messages that will effect the seen count
  const messages = await Message.find({
    _id: { $in: messageIds },
    _messagedBy: { $ne: userId },
    _readBy: { $ne: userId },
  })

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index]

    // Push the current user in the seen array
    await Message.updateOne(
      {
        _id: message._id,
        _readBy: { $ne: userId },
      },
      {
        $push: { _readBy: userId },
      }
    )

    const conversation = await Conversation.getById(
      message._conversation
    )
    const { participants } = conversation.toJSON()

    // Update the unseen count for other users of the same conversation
    for (
      let participantsIndex = 0;
      participantsIndex < participants.length;
      participantsIndex++
    ) {
      const participant = participants[participantsIndex]
      if (participant._user.toString() === userId.toString()) {
        participant.unseenCount =
          participant.unseenCount - 1 <= 0 ? 0 : participant.unseenCount - 1
      }
    }

    conversation.participants = participants
    await conversation.save()
  }
}


module.exports = GetAllMessage