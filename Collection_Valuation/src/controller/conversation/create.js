// import MongoId from '@helpers/object-id-validator.helper'
const _ = require('lodash')
const {
  handleResponse,
  handleError,
} = require('../../common/middlewares/requestHandlers.js');
const User = require('../../models/userModel')
const Conversation = require('../../models/conversation')
const Message = require('../../models/message')

const AgendaHelper = require('../../helpers/agenda.helper')

async function CreateConversation(req, res) {

  const { user: __user } = req
  const { message: messageString, _participants } = req.body

  // Check if the provided object ids are invalid
  // const objectIdFields = _.pickBy(
  //   {
  //     '_user|participants': _participants,
  //   },
  //   _.identity
  // )
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

  // TODO: Create a hash to identify each conversations w.r.t Participants

  // Generate the set of users, who are intended to receive messages, include the sender by default
  const uniqueParticipantsIds = _.uniq([
    ..._participants,
    __user._id.toString(),
  ])

  // Throw error if only one participant id given
  if (uniqueParticipantsIds.length < 2) {
    return handleError({
      res,
      statusCode: 400,
      err: 'At lease 2 participants are required to start a conversation.',
      // result = 0,
      // data = {}
    });
  }

  // Fetch the meta data available for the recipient users
  const participants = []
  for (let index = 0; index < uniqueParticipantsIds.length; index++) {
    const element = uniqueParticipantsIds[index].toString()

    const participant = await User.getById(element, {
      _id: 1,
      firstName: 1,
      middleName: 1,
      lastName: 1,
    })
    if (!participant) {
      return handleError({
        res,
        statusCode: 422,
        err: 'Invalid MongoId',
        // result = 0,
        // data = {}
      });
    }

    // Push it to the valid recipients array
    participants.push({
      _user: participant._id,
      firstName: participant.firstName,
      middleName: participant.middleName,
      lastName: participant.lastName,
      unseenCount: participant._id.toString() === __user._id.toString() ? 0 : 1,
    })
  }

  // Throw error if participant ids are greater than max allowed or less than 2
  const maxAllowedParticipants = 20
  if (
    participants.length <= 1 &&
    participants.length > maxAllowedParticipants
  ) {
    return handleError({
      res,
      statusCode: 400,
      err: `You can create at most ${maxAllowedParticipants} and at least 2 participant message group.`,
      // result = 0,
      // data = {}
    });

  }

  // Build the Conversation
  const conversation = new Conversation({
    participants,
    participantsCount: participants.length,
    _createdBy: __user._id,
  })

  // Save Conversation
  await conversation.save()

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

  await conversation
    .populate([
      {
        path: 'participants._user',
        select: 'firstName middleName lastName image',
      },
      {
        path: '_lastMessage',
      },
    ])
    .execPopulate()
  const conversationJSON = conversation.toJSON()
  conversationJSON.participants.map((e) => {
    delete e.firstName
    delete e.middleName
    delete e.lastName
  })

  // FCM Push Notification
  const messageJSON = message.toJSON()
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
    statusCode: 201,
    msg: 'Conversation create successful.',
    res,
    data: conversationJSON
  });
}


module.exports = CreateConversation