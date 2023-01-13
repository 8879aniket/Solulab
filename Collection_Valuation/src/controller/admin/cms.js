const { handleResponse, handleError } = require('../../common/middlewares/requestHandlers')
const { getCms, getSingleCms, updateCms, deleteCms, createCms } = require('../../services/admin/cms')

module.exports = {
    getCms: async(req, res)=>{
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
            const data = await getCms()
            if(data.length == 0){
                return handleResponse({ res, msg: 'No records'})
            }
            // return handleResponse({ res, data })
            res.render('admin/cms/cms', { data, loggedInUser, error:message, success: successMessage })
        }catch(err){
            return handleError({ res, err })
        }
    },
    getSingleCms: async(req, res)=>{
        try{
            const loggedInUser = req.user
            const { cmsId } = req.params
            const data = await getSingleCms(cmsId)
            // return handleResponse({ res, data })
            res.render('admin/cms/viewCms', { data, loggedInUser })
        }catch(err){
            return handleError({ res, err })
        }
    },
    updateSingleCms: async(req, res)=>{
        try{
            const loggedInUser = req.user
            const { cmsId } = req.params
            const data = await getSingleCms(cmsId)
            // return handleResponse({ res, data })
            res.render('admin/cms/editCms', { data, loggedInUser })
        }catch(err){
            return handleError({ res, err })
        }
    },
    updateCms: async(req, res)=>{
        try{
            const loggedInUser = req.user
            const { cmsId } = req.params
            const { pageTitle, pageDescription } = req.body
            const cmsObj = {
                pageTitle,
                pageDescription
            }
            const cms = await getSingleCms(cmsId)
            if(!cms || cms.name == 'CastError'){
                req.flash('error', 'ID not found')
                return res.redirect('/admin/cmsPages')
                return handleError({ res, err: 'Id not found' })
            }
            if(cms.isDeleted === true){
                req.flash('error', 'This page has been deleted')
                return res.redirect('/admin/cmsPages')
                return handleError({ res, err: 'This page has been deleted' })
            }
            else{
                const data = await updateCms(cmsId, cmsObj)
                res.redirect('/admin/cmsPages')
                // return handleResponse({ res, data })
            }
        }catch(err){
            return handleError({ res, err })
        }
    },
    deleteCms: async(req, res)=>{
        try{
            const { cmsId } = req.params
            const cms = await getSingleCms(cmsId)
            if(!cms || cms.name == 'CastError'){
                req.flash('error', 'Id not found')
                return res.redirect('/admin/cmsPages')
                return handleError({ res, err: 'Id not found' })
            }
            if(cms.isDeleted === true){
                req.flash('error', 'This page has been already deleted')
                return res.redirect('/admin/cmsPages')
                return handleError({ res, err: 'This page has been already deleted' })
            }else{
                const data = await deleteCms(cmsId)
                // return handleResponse({ res, data })
                req.flash('success', 'CMS page deleted successfully!')
                res.redirect('/admin/cmsPages')
            }
        }catch(err){
            return handleError({ res, err })
        }
    },
    createCms: async(req, res)=>{
        try{
            const { pageTitle, pageDescription } = req.body
            const cmsObj = {
                pageTitle,
                pageDescription
            }
            const data = await createCms(cmsObj)
            return handleResponse({ res, data })
        }catch(err){
            return handleError({ res, err })
        }
    }
}