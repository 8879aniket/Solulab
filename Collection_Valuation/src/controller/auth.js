const SocialAuth = require('./socialAuth')

module.exports.socialLogin = (req, res) => {
    try {
        const targetOauthProvider = req.params.oauthProvider
        switch (targetOauthProvider) {
            case 'google':
                SocialAuth.SocialLoginWithGoogle(req, res)
                break
            case 'facebook':
                SocialAuth.SocialLoginWithFacebook(req, res)
                break
            case 'twitter':
        }
    } catch (error) {
        handleError({ res, err });
    }
}

module.exports.socialLoginCallback = (req, res) => {
    try {
        const targetOauthProvider = req.params.oauthProvider

        switch (targetOauthProvider) {
            case 'google':
                SocialAuth.SocialLoginWithGoogleCallback(req, res)
                break
            case 'facebook':
                SocialAuth.SocialLoginWithFacebookCallback(req, res)
                break
                break
            case 'twitter':
                break
        }
    } catch (error) {
        handleError({ res, err });
    }
}