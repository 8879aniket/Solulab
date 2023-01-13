const { handleResponse, handleError } = require("../../common/middlewares/requestHandlers")
const bankNote = require('../../models/coinModel')
const mongoose = require('mongoose')

module.exports = {
   getGradedNotes: async(req, res)=>{
        try{
            const loggedInUser = req.user
            const data = await bankNote.aggregate([
                {
                    $match:{
                        isDeleted: false, isCoin: false, isGraded: true
                    }
                },
                {
                    $lookup:{
                      from:'users',
                      localField:'userId',
                      foreignField:'_id',
                      as:'userDetails'
                    }
                  },
                  {
                    $unwind:{ 
                      path: '$userDetails'
                    }
                  }
            ])
            res.render('admin/bankNotes/gradedNote', { data, loggedInUser })
            // return handleResponse({ res, data })
        } catch(err){
            return handleError({
                res,
                err
            })
        }
    },

    getOneNote: async(req, res)=>{
        try{
            const loggedInUser = req.user
            const { noteId } = req.params
            const data = await bankNote.aggregate([
                {
                    $match:{
                        _id: mongoose.Types.ObjectId(noteId)
                    }
                }
            ])
            return res.render('admin/bankNotes/viewGradedNote', { data, loggedInUser })
            return handleResponse({
                res,
                data:{ data, loggedInUser}
            })
        } catch(err){
            return handleError({
                res,
                err
            })
        }
    },

    deleteNote: async(req, res)=>{
        try{
            const { noteId } =req.params
            const data = await bankNote.findByIdAndUpdate(
                { _id: noteId },
                { $set:{ isDeleted: true }},
                { new: true }
            )
        }catch(err){
            return handleError({
                res,
                err
            })
        }
    }
}
