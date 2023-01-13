const { handleResponse, handleError } = require('../../common/middlewares/requestHandlers')
const { getAll, getMessageDetails, getAllResolved } = require('../../services/admin/disputeRequest')
const Model = require('../../models/contactUsModel')

module.exports = {
    getAll: async(req, res)=>{
        try{
            let successMessage = req.flash('success')
            if(successMessage.length > 0 ){
                successMessage = successMessage[0]
            }else{
                successMessage = null
            }
            const loggedInUser = req.user
            const data = await getAll()
            const data1 = await getAllResolved()
            res.render('admin/disputeRequest/disputeRequest', { data, data1, loggedInUser, success: successMessage })
            // }
        }catch(err){
            return handleError({ res, err })
        }
    },
    getMessageDetails: async(req, res)=>{
        try{
           
            const { msgId } = req.params
            const loggedInUser = req.user
            const data = await getMessageDetails(msgId)
            if(data.length == 0){
                return handleResponse({ res, msg:'No record found'})
            }else{
            // return handleResponse({ res, data })
            res.render('admin/disputeRequest/viewMessage', { data, loggedInUser })
            }
        }catch(err){
            return handleError({ res, err })
        }
    },
    markApproved: async(req, res)=>{
        try{
            const { msgId } = req.params
            const data = await Model.findById({_id: msgId})
            if(data.length == 0){
                return handleResponse({ res, msg:'No record found'})
            }else{
                data.isApproved = true
                await data.save()
                req.flash('success', 'Issue resolved successfully!')
                return res.redirect('/admin/disputeRequest')
            }
        }catch(err){
            return handleError({ res, err })
        }
    }
}