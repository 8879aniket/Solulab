// const MongoId = require('@helpers/object-id-validator.helper')

const _ = require('lodash')
const {
  handleResponse,
  handleError,
} = require('../../common/middlewares/requestHandlers.js');
const Conversation = require('../../models/conversation')
const Message = require('../../models/message')
const AgendaHelper = require('../../helpers/agenda.helper')

async function CreateMessage(req, res) {

  const { user: __user } = req
  const { conversationId: _conversation } = req.params
  const { message: messageString } = req.body

  if (!__user.isVIPMemeber) {
    return handleError({
      res,
      statusCode: 402,
      err: 'Subscription not taken.'
    })
  }

  // // Check if the provided object ids are invalid
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
    return handleError({
      res,
      statusCode: 422,
      err: 'Invalid Mongo Id.'
    });
  }

  // Build the Message
  const message = new Message({
    _conversation: conversation._id,
    message: messageString,
    _messagedBy: __user._id,
    _createdBy: __user._id,
  })

  // Save Data
  await message.save()

  // Save Last Message information in conversation
  conversation._lastMessage = message._id
  await conversation.save()

  const { participants } = conversation.toJSON()
  // Update the unseen count for other users of the same conversation
  for (
    let participantsIndex = 0;
    participantsIndex < participants.length;
    participantsIndex++
  ) {
    const participant = participants[participantsIndex]
    if (participant._user.toString() !== __user._id.toString()) {
      participant.unseenCount += 1
    }
  }
  conversation.participants = participants

  // Save Data
  await conversation.save()

  // FCM Push Notification
  const messageJSON = message.toJSON()
  const conversationJSON = conversation.toJSON()
  await AgendaHelper.Get().schedule(Date.now(), 'NOTIFY_MESSAGE_RECEIVERS', {
    _message: messageJSON._id,
    notification: {
      title: 'NEW MESSAGE',
      body: JSON.stringify({
        message: messageJSON,
        conversation: conversationJSON,
      }),
    },
    data: {
      title: 'NEW MESSAGE',
      body: JSON.stringify({
        message: messageJSON,
        conversation: conversationJSON,
      }),
    },
  })

  // All Done
  return handleResponse({
    msg: 'Conversation message create successful.',
    statusCode: 201,
    res,
    data: message
  });
}

module.exports = CreateMessage