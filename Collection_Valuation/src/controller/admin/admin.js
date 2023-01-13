const adminModel = require('../../models/adminModel')
const { handleResponse, handleError } = require('../../common/middlewares/requestHandlers')
const { S3ExtractMeta, deleteFromS3 } = require('../../common/utils/uploadAdminPic')
const _ = require('lodash');
const { save: saveNotification } = require('../../dbServices/notification')
const { generateRandonCode } = require('../../common/utils/util')
const {
    generateOtpExpiry,
    appSecret,
    notificationSettings: {
      notificationTypes,
      deliveryModesForNotificationTypes,
    },
  } = require('../../config/config')
  const {
    verifyCodeForgotPwd,
    reviewAdded,
    primaryAddress,
    verifyEmail,
  } = require('../../messages/success');


module.exports = {
    renderLogin: async(req, res)=>{
        try{
            let message = req.flash('error')
            if(message.length > 0 ){
               message = message[0]
            }else{
                message = null
            }
            let successMessage = req.flash('success')
            if(successMessage.length > 0 ){
                successMessage = successMessage[0]
            }else{
                successMessage = null
            }
            res.render('admin/auth/login',{ error:message, success:successMessage})
        }catch(err){
            return handleError({ res, err })
        }
    },
    login: async(req, res)=>{
        try {
            const { email, password } = req.body
            if (!email || !password) {
                req.flash('error', 'Please provide email and password')
                // return handleError({ res, err:'Please provide email and password'})
                return res.redirect('/admin/login')
            }
            const user = await adminModel.findOne({ email }).select('+password')
    
            if (!user || !(await user.correctPassword(password, user.password))) {
                req.flash('error', 'Invalid Credentials')
                // return handleError({ res, err:'Invalid credentials'})
                return res.redirect('/admin/login')
            }
            if (user.userType !== 'admin'){
                req.flash('error', 'User must be admin. Access Denied !')
            //    return handleError({ res, err:'User must be admin'})
                return res.redirect('/admin/login')
            }    
            const token = user.generateJwt()
            res.cookie("jwt", token, {secure: true, httpOnly: true})
            // return handleResponse({ res, data: { user, token }})
            return res.redirect('/admin/dashboard')
        } catch (err) {
            return handleError({ res, err})
        }
    },
    createAdmin: async(req, res)=>{
        try{
            const {
                firstName,
                lastName,
                userName,
                email,
                password,
                countryCode,
                phone,
                profilePic

            } = req.body
            const adminObj = {
                firstName,
                lastName,
                userName,
                email,
                password,
                countryCode,
                phone,
                profilePic
            }
            const admin = await adminModel.create(adminObj)
            return handleResponse({ res, data: admin })
        }catch(err){
            return handleError({ res, err })
        }
    },
    adminProfile: async(req, res)=>{
        try{
            let message = req.flash('error')
            if(message.length > 0){
                message = message[0]
            } else{
                message = null
            }
            let successMessage = req.flash('success')
            if(successMessage.length > 0 ){
                successMessage = successMessage[0]
            }else{
                successMessage = null
            }
            const loggedInUser = req.user
            const data = await adminModel.aggregate([
                {
                    $match:{
                        _id: loggedInUser._id
                    }
                },
                {
                    $project:{
                        'firstName':1,
                        'lastName':1,
                        'countryCode':1,
                        'phone':1,
                        'email':1,
                        'profilePic':1
                    }
                }
            ])
            // return handleResponse({ res, data })
            res.render('admin/auth/adminProfile', { data: data, error: message, success: successMessage })
            
        }catch(err){
            return handleError({ res, err })
        }
    },
    updatePassword: async(req, res)=>{
        try {
            let message = req.flash('error')
            if(message.length > 0){
                message = message[0]
            } else{
                message = null
            }
            let successMessage = req.flash('success')
            if(successMessage.length > 0 ){
                successMessage = successMessage[0]
            }else{
                successMessage = null
            }
            let loggedInUser = req.user
            const { oldPassword, newPassword, confirmPassword } = req.body
            const user = await adminModel.findById({ _id: loggedInUser._id }).select('+password')
            if( loggedInUser.userType !== 'admin'){
                req.flash('error', 'Unauthorized access')
                // return handleError({ res, err:'Unauthorized access' })
            }
            if(!user){
                req.flash('error', 'User record not found')
                return res.redirect('/admin/update-password')
                // return handleError({ res, err:'User record not found' })
            }
            if(!oldPassword || !newPassword){
                req.flash('error', 'All fields are required')
                return res.redirect('/admin/update-password')
                // return handleError({ res, err:'All fields are required'})
            }
            if(!(await user.correctPassword(oldPassword, user.password))){
                req.flash('error', 'Password is incorrect')
                return res.redirect('/admin/update-password')
                // return handleError({ res, err:'Password is incorrect'})
            }
            if((await user.correctPassword(newPassword, user.password))){
                req.flash('error', 'New password should not be same as old password')
                return res.redirect('/admin/update-password')
                // return handleError({ res, err:'Password is incorrect'})
            }
            if(newPassword !== confirmPassword ){
                req.flash('error', 'New Password does not match with confirm password')
                return res.redirect('/admin/update-password')
                // return res.redirect('/admin/profile')
                // return handleError({ res, err:'New Password does not match with confirm password'})
            }else{
                user.password = newPassword
                await user.save()
                req.flash('success', 'Password changed successfully')
                return res.redirect('/admin/profile')
                // return handleResponse({ res, msg:'Password changed succesfully', data: user })
                // return res.redirect('/admin/profile')

            }
        } catch (err) {
            return handleError({ res, err })
        }
    },
    renderUpdatePassword: async(req, res)=>{
        try{
            let message = req.flash('error')
            if(message.length > 0){
                message = message[0]
            } else{
                message = null
            }
            let successMessage = req.flash('success')
            if(successMessage.length > 0 ){
                successMessage = successMessage[0]
            }else{
                successMessage = null
            }
            res.render('admin/auth/updatePassword', { error: message, success: successMessage})
        }catch(err){
            return handleError({ res, err })
        }
    },
    uploadProfilePic: async (req, res) => {
    try {
        let loggedInUser = req.user
        
    //   Fetch uploaded file information
      const { files } = req;
      if (!files) {
        req.flash('error', 'Please upload one image file')
        return res.redirect('/admin/profile')
        
      }
  
      const FILE = S3ExtractMeta(files);
      if (FILE.length !== 1) {
        req.flash('error', 'Please upload one image file')
        return res.redirect('/admin/profile')
      }
  
      const targetFile = FILE[0];
  
      // Throw error if uploaded file is not an image
      if (targetFile.contentType != 'image') {
        // Remove the uploaded File
        await deleteFromS3(targetFile.key);
        req.flash('error', 'Please upload one image file')
        return res.redirect('/admin/profile')
      }
  
    //   Fetch user
      const user = await adminModel.findById({ _id: loggedInUser._id})
      let oldProfilePic = user.toJSON().profilePic;
     
      oldProfilePic = _.isString(oldProfilePic) ? null : oldProfilePic
     
      //   Remove old profile picture
        if (oldProfilePic) {
              await deleteFromS3(oldProfilePic);
            }
          // Add New image information
          user.profilePic = {
              key: targetFile.key,
              url: targetFile.location,
              sizeInMegaByte: targetFile.size / 1024 ** 2,
            };
    //   Save User
     await user.save()
  
      // All Done
      req.flash('success', 'Profile picture updated successfully')
      return res.redirect('/admin/profile')
      handleResponse({
        res,
        mgs: 'Profile picture updated successfully.',
        data: user,
      });
    } catch (err) {
      handleError({ res, err });
    }
  },
  sendResetLink: async(req, res)=>{
      try{
        const { email } = req.body
        const data = await adminModel.findOne({ email })
        if(!email){
            req.flash('error', 'Please provide email')
            return res.redirect('/admin/forgotPassword')
        }
        if(!data){
            req.flash('error', 'Email not registered')
            return res.redirect('/admin/forgotPassword')
            return handleResponse({ result: 0, res, msg: 'Email not registered' });
        }
            const token = await generateRandonCode(64)
            await saveNotification({
                notificationType: notificationTypes.RESET_PASSWORD,
                to: data._id,
                metadata: {
                  body: `Your reset password link is : ${req.headers.host}/admin/verifyToken/${token}`
                },
                deliveryInfo: {
                  sms: data.countryCode + data.phone,
                  email: data.email
                },
              })
            data.resetToken = token
            await data.save()
            req.flash('success', `A verification link has been sent to ${data.email}`)
            return res.redirect('/admin/login')
            return handleResponse({ res, msg: verifyCodeForgotPwd, data})
        
      }catch(err){
          return handleError({ res, err })
      }
  },
  verifyResetToken: async(req, res)=>{
      try{
        let message = req.flash('error')
        if(message.length > 0 ){
          message = message[0]
        }else{
          message = null
        }
        
       const { token } = req.params
       const data = await adminModel.findOne({ resetToken:token })
       if(!data){
           req.flash('error', 'Link has been expired')
           return res.redirect('/admin/login')
        //    return handleResponse({ result:0, res, msg:'Link expired' })
       }else{
           
           res.render('admin/auth/resetPassword' , { token, error:message})
           
       }

      }catch(err){
          return handleError({ res, err })
      }
  },
  resetPassword: async(req,res)=>{
      try{
        let message = req.flash('error')
        if(message.length > 0 ){
            message = message[0]
        }else{
            message = null
        }
        let successMessage = req.flash('success')
        if(successMessage.length > 0 ){
            successMessage = successMessage[0]
        }else{
            successMessage = null
        }
        const { newPassword, confirmPassword } = req.body
        const { token } = req.params
        const data = await adminModel.findOne({ resetToken: token }).select('+password')

        if(!data){
            req.flash('error', 'Link has been expired')
            return res.redirect(`/admin/verifyToken/${token}`)
            // return handleResponse({ result:0, res, msg:'Link expireds'})
        }
        if(!newPassword || !confirmPassword){
            req.flash('error', 'All fields are required')
            return res.redirect(`/admin/verifyToken/${token}`)
            // return handleResponse({ result:0, res, msg:'All fields are required'})
        }
        if(newPassword != confirmPassword){
            req.flash('error', 'Passwords not match')
            return res.redirect(`/admin/verifyToken/${token}`)
            // return handleResponse({ result:0, res, msg:'Passwords not match! Try again'})
        }
        if((await data.correctPassword(newPassword, data.password))){
            req.flash('error', 'New password should not be same as old password')
            return res.redirect(`/admin/verifyToken/${token}`)
            // return handleError({ res, err:'Password is incorrect'})
        }
        else{
            data.password = newPassword
            data.resetToken = null
            await data.save()
            // return handleResponse({ res, msg:'Password reset successfully'})
            req.flash('success', 'Password has been reset successfully')
            return res.redirect('/admin/login')
        }

      }catch(err){
          return handleError({ res, err })
      }
  },
  renderForgotPassword: async(req, res)=>{
      try{
        let message = req.flash('error')
        if(message.length > 0 ){
          message = message[0]
        }else{
          message = null
        }
        return res.render('admin/auth/forgotPassword', { error: message })
        
      }catch(err){
          return handleError({ res, err })
      }
  },
  logout: async(req, res)=>{
      try{
        res.clearCookie('jwt')
        return res.redirect('/admin/login')
      }catch(err){
          return res.handleError({ res, err })
      }
  }
}