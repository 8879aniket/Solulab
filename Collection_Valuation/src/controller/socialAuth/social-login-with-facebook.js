const { update, getSocialUser } = require('../../dbServices/users');

const FacebookOAuthCredentials = require('../../../facebook-oauth-credentials.json');
const FacebookOAuthCredentialsAuthSource = FacebookOAuthCredentials.web;

if (!FacebookOAuthCredentialsAuthSource) {
  throw 'Google OAuth Web Credentials Not Found.';
}

const {
  handleResponse,
  handleError,
} = require('../../common/middlewares/requestHandlers.js');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;

const verifyHandler = function (accessToken, refreshToken, profile, cb, done) {
  const data = {
    id: cb.id,
    name: cb.displayName,
    email: cb.emails[0].value,
    emailVerified: cb.emails[0].verified,
  };
  return done(null, data);
};

passport.use(
  new FacebookStrategy(
    {
      clientID: FacebookOAuthCredentialsAuthSource.client_id,
      clientSecret: FacebookOAuthCredentialsAuthSource.client_secret,
      callbackURL: FacebookOAuthCredentialsAuthSource.redirect_uris[0],
      profileFields: ['email', 'name'],
      passReqToCallback: true,
    },
    verifyHandler
  )
);

module.exports.Login = (req, res) => {
  passport.authenticate('facebook')(req, res);
};

module.exports.CallBack = async (req, res) => {
  try {
    const promise = new Promise((resolve, reject) => {
      passport.authenticate('facebook', { session: false }, (error, user) => {
        if (error) {
          reject(error);
        }

        resolve(user);
      })(req, res);
    });

    let facebookUser = null;

    facebookUser = await promise.then((data) => data);

    // Get User From MongoDB
    const socialId = facebookUser.id;
    const email = facebookUser.email;
    let socialUser = await getSocialUser('google', socialId, email);
    if (!socialUser) {
      return handleResponse({
        res,
        statusCode: 401,
        data: { SOCIAL_NOT_REGISTERED: true },
        msg: 'Social login not registered',
      });
    }
    delete socialUser.password;
    const socialUserData = { ...socialUser._doc };
    delete socialUserData.token;
    const newToken = await generateJwtToken(socialUserData);
    user = await update(socialUserData._id, { token: newToken });

    // All Done
    return handleResponse({
      msg: 'Login successful.',
      statusCode: 200,
      res,
      data: user,
    });
  } catch (error) {
    return handleError({
      err: 'Error',
      res,
      // data: error
    });
  }
};
