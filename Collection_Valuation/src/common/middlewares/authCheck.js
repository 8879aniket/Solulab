const jwt = require('jsonwebtoken');
const { appSecret } = require('../../config/config');
const { handleError } = require('./requestHandlers');
const { get } = require('../../dbServices/users');
const adminModel = require('../../models/adminModel')

const appURI = '/api/v1';
const skipUrls = [
  '/users/register',
  '/users/login',
  '/users/forgot-password',
  '/users/resend-otp',
  '/users/otp-verify',
  '/users/resend-email',
  '/users/reset-password',
  '/users/register/check-availability',
  '/pay/SUBSCRIBE_TO_VIP_MEMBERSHIP/paypal',
  '/pay/SUBSCRIBE_TO_VIP_MEMBERSHIP/callback/paypal',
  '/pay/SUBSCRIBE_TO_VIP_MEMBERSHIP/callback/paypal/cancel',
  '/pay/BUY_COIN/paypal',
  '/pay/BUY_COIN/callback/paypal',
  '/pay/BUY_COIN/callback/paypal/cancel',
  '/coin/buy-coin',
  '/pay',
  '/pay/callback'
];

module.exports.isAuthenticated = async function isAuthenticated(
  req,
  res,
  next,
) {  
  const url = req.url.replace(appURI, '').split('?')[0];  
  let token;
  if (skipUrls.indexOf(url) !== -1) return next();
  if (req.headers.authorization !== undefined) {
    token = req.headers.authorization.split(' ')[1];
  }
  try {
    const user = await jwt.verify(token, appSecret);
    req.user = await get(user._id, '_id', '+token');
    if (!req.user) throw 'Invalid token,No user exists';
    if (req.user.token !== token) {
      throw 'Your login session has expired';
    }
    if (user.isDeleted === true) {
      throw 'User is deleted';
    }
    if (user.isBlocked === true) {
      throw 'User is blocked';
    }
    return next();
  } catch (err) {
    return handleError({ res, err, statusCode: 401 });
  }
};

module.exports.verifyToken = function verifyToken(req, res, next){
  try {
    let token
    if ('jwt' in req.cookies)
      token = req.cookies.jwt

    if (!token){
      req.flash('error', 'Please login to continue')
      res.redirect('/admin/login')
    }
    else {
      jwt.verify(token, process.env.APP_SECRET, (err, payload) => {
        if (err){
        req.flash('error', 'Session expired...Please login.')
        return res.redirect('/admin/login')
        }
        else {
          const{_id } = payload
          adminModel.findById(_id).then(userData=>{
            req.user = userData
            if(userData.userType !=='admin'){
              req.flash('error', 'User must be admin. Access denied!')
              return res.redirect('/admin/login')
            }
            next()
          })
        }
      })
    }
  } catch (err) {
    return handleError({ res, err, statusCode: 401 });
  }
}