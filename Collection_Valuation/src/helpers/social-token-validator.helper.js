const axios = require('axios')
const Logger = require('../common/middlewares/logger');

const SocialTokenValidator = {
    async Validate(provider, token) {
        let response = null
        try {
            switch (provider) {
                case 'google':
                    response = await SocialTokenValidator.ValidateWithGoogle(token)
                    break
                case 'facebook':
                    response = await SocialTokenValidator.ValidateWithFacebook(token)
                    break
                case 'twitter':
                    response = null
                    break
            }
        } catch (error) {
            Logger.error(error)
        } finally {
            return response
        }
    },

    async ValidateWithGoogle(token) {
        const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)

        // Return Null on null response
        if (!response) {
            return null
        }

        // Return Null on error response
        if (response.data.error) {
            return null
        }

        return response.data
    },

    async ValidateWithFacebook(token) {

        const response = await axios.get(
            `https://graph.facebook.com/me?fields=email,name&access_token=${token}`
        )

        // Return Null on null response
        if (!response) {
            return null
        }

        // Return Null on error response
        if (response.data.error) {
            return null
        }

        return response.data
    }
}


module.exports.SocialTokenValidator = SocialTokenValidator