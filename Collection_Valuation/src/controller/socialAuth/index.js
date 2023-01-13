const _SocialLoginWithGoogle = require('./social-login-with-google')
const _SocialLoginWithFacebook = require('./social-login-with-facebook')

module.exports = {
  SocialLoginWithGoogle: _SocialLoginWithGoogle.Login,

  SocialLoginWithGoogleCallback: _SocialLoginWithGoogle.CallBack,

  SocialLoginWithFacebook: _SocialLoginWithFacebook.Login,

  SocialLoginWithFacebookCallback: _SocialLoginWithFacebook.CallBack,
}