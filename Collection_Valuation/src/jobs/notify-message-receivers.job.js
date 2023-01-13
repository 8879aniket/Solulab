const Conversation = require('../models/conversation')
const Message = require('../models/message')

// import MongoId from '@helpers/object-id-validator.helper'
const FCMHelper = require('../helpers/fcm.helper')

async function _GetConversationParticipantsFCMTokens(options) {
  // Note: This function will not verify any data.
  // Note: It is expected, that the caller function will take care of the validations

  const { _conversation, _messagedBy } = options

  // Fetch Conversation data
  const conversation = await Conversation.getById(
    _conversation
  ).populate([
    {
      path: 'participants._user',
      select: 'fcmToken',
    },
  ])

  // Exclude FCM Token of the Sender
  const { participants } = conversation.toJSON()
  const FCMTokens = participants
    .map((e) => {
      if (e._user._id.toString() != _messagedBy && e._user.fcmToken) {
        return {
          _user: e._user._id.toString(),
          fcmToken: e._user.fcmToken,
        }
      }
    })
    .filter((e) => e !== undefined)

  return FCMTokens
}

const NotifyMessageReceiversJobRunner = {
  Notify: async (options) => {
    const { _message } = options

    // Check if the provided object ids are invalid
    // const { hasInvalid } = await MongoId.Validate({
    //   _message,
    // })
    // Abort if user not found
    // if (hasInvalid) {
    //   return {
    //     message: 'Message not found.',
    //   }
    // }

    // Find the message
    const message = await Message.getById(_message)

    if (!message) {
      return
    }

    const { _messagedBy, _conversation } = message.toJSON()

    // Fetch FCM token except the sender
    const FCMTokens = await _GetConversationParticipantsFCMTokens({
      _conversation,
      _messagedBy,
    })

    for (let i = 0; i < FCMTokens.length; i++) {
      const FCMToken = FCMTokens[i]

      // Send FCM TOKEN
      FCMHelper.SendToToken(options, FCMToken.fcmToken)
    }
  }
}

async function JobNotifyMessageReceivers(data, job, done) {
  const JobRunnerInstance = NotifyMessageReceiversJobRunner
  await JobRunnerInstance.Notify(data)
  await job.remove()
  return done()
}

module.exports = JobNotifyMessageReceivers
