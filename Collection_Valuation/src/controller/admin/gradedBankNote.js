const { handleResponse, handleError } = require("../../common/middlewares/requestHandlers")
const mongoose = require('mongoose')
const gradedNote = require('../../models/coinModel')

module.exports = {
    getGradedNotes: async(req, res)=>{
        try{
            const loggedInUser = req.user
            const data = await gradedNote.aggregate([
                {
                    $match:{
                        isCoin: false
                    }
                },
                {
                    $match:{
                        isGraded: true
                    }
                },
                {
                    $match:{
                        isDeleted: false
                    }
                }
            ])
            return handleResponse({
                res,
                data:{ data, loggedInUser}
            })
        } catch(err){
            return handleResponse({
                res,
                err
            })
        }
    },
    getOneGradeNote: async(req, res)=>{
        try{
            const loggedInUser = req.user
            const { noteId } = req.params
            const data = await gradedNote.find(
                {
                    _id: noteId,
                    isCoin: false,
                    isDeleted: false,
                    isGraded: true
                }
            )
            return handleResponse({
                res,
                data: { data, loggedInUser}
            })
        }catch(err){
            return handleError({
                res,
                err
            })
        }
    },
    deleteGradedNote: async(req, res)=>{
        try{
            const { noteId } = req.params
            const data = await gradedNote.findByIdAndUpdate(
                {_id: noteId },
                { $set:{ isDeleted: true }},
                { new: true }
            )
            return handleResponse({
                res,
                data
            })
        }catch(err){
            return handleError({
                res,
                err
            })
        }
    }
}