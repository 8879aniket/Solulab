const Logger = require('../common/middlewares/logger.js')
const FCM = require('firebase-admin')
const _ = require('lodash')

FCM.initializeApp({
  credential: FCM.credential.applicationDefault(),
})

const FCMHelper = {

  SubscribeToTopic(options) {
    try {
      const { topic, token } = options

      let registrationTokens = null
      if (_.isArray(token)) {
        registrationTokens = token
      } else if (_.isString(token)) {
        registrationTokens = [token]
      }

      // Subscribe the devices corresponding to the registration tokens to the topic.
      FCM.messaging()
        .subscribeToTopic(registrationTokens, topic)
        .then((response) => {
          Logger.info('Successfully subscribed to topic:', response)
        })
        .catch((error) => {
          Logger.info('Error subscribing to topic:', error)
        })
    } catch (error) {
      Logger.error(error)
    }
  },

  Send(options) {
    try {
      const { token, topic } = options
      if (token) {
        return this.SendToToken(options, token)
      }

      if (topic) {
        return this.SendToTopic(options, topic)
      }
    } catch (error) {
      Logger.error(error)
    }
  },

  SendToTopic(options, topic = 'general') {
    try {
      const { notification, data } = options

      const message = {
        notification,
        data,
        topic,
      }

      FCM.messaging()
        .send(message)
        .then((response) => {
          // Response is a message ID string.
          Logger.info(
            `Successfully sent message to topic "${topic}":  ${response}`
          )
        })
        .catch((error) => {
          Logger.info('Error sending message:', error)
        })
    } catch (error) {
      Logger.error(error)
    }
  },

  async SendToToken(options, token) {
    try {
      const { notification, data } = options

      const message = {
        notification,
        data,
        token,
      }


      const response =
        await FCM.messaging()
          .send(message)
          .then(response => response)
          .catch(error => { throw error })
      Logger.info(`Successfully sent message to token: ${response}`)

    } catch (error) {
      Logger.error(error)
    }
  }
}

// All Done
module.exports = FCMHelper
