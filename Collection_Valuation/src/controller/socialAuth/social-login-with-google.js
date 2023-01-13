const {
    update,
    getSocialUser,
} = require('../../dbServices/users');

const GoogleOAuthCredentials = require('../../../google-oauth-credentials.json')
const GoogleOAuthCredentialsAuthSource = GoogleOAuthCredentials.web

if (!GoogleOAuthCredentialsAuthSource) {
    throw 'Google OAuth Web Credentials Not Found.'
}

const {
    handleResponse,
    handleError,
} = require('../../common/middlewares/requestHandlers.js');
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;


const verifyHandler = function (accessToken, refreshToken, profile, cb, done) {
    const data = {
        id: cb.id,
        name: cb.displayName,
        email: cb.emails[0].value,
        emailVerified: cb.emails[0].verified
    }
    return done(null, data)
}

passport.use(new GoogleStrategy({
    clientID: GoogleOAuthCredentialsAuthSource.client_id,
    clientSecret: GoogleOAuthCredentialsAuthSource.client_secret,
    callbackURL: GoogleOAuthCredentialsAuthSource.redirect_uris[0],
    passReqToCallback: true
}, verifyHandler))


module.exports.Login = (req, res) => {
    req.session.lastQuery = req.query
    passport.authenticate('google', { scope: ['email', 'profile'] })(req, res)
}


module.exports.CallBack = async (req, res) => {
    try {
        const promise = new Promise((resolve, reject) => {
            passport.authenticate('google', { session: false }, (error, user) => {
                if (error) {
                    reject(error)
                }

                resolve(user)
            })(req, res)
        })

        let googleUser = null

        const { lastQuery } = req.session;
        

        googleUser = await promise.then(data => data)

        // Get User From MongoDB
        const socialId = googleUser.id
        const email = googleUser.email
        let socialUser = await getSocialUser('google', socialId, email);
        if (!socialUser) {
            return handleResponse({
                res,
                statusCode: 401,
                data: { SOCIAL_NOT_REGISTERED: true },
                msg: "Social login not registered",
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
            data: user
        });


    } catch (error) {
        console.log(error)
        return handleError({
            err: 'Error',
            res,
            // data: error
        });
    }

}