const Model = require('../../models/contactUsModel')
const mongoose = require('mongoose')

module.exports = {
    getAll: async()=>{
        try{
            const data = await Model.aggregate([
                {
                    $match:{
                        isApproved: false
                    }
                },
               {
                   $lookup:{
                       from: 'users',
                       localField:'userId',
                       foreignField:'_id',
                       as:'userDetails'
                   }
               },
               {
                   $project:{
                       'userDetails.firstName':1,
                       'userDetails.lastName':1,
                       'userDetails.email':1,
                       'message':1
                   }
               }
            ])
            return data
        }catch(err){
            throw err
        }
    },
    getAllResolved: async()=>{
        try{
            const data = await Model.aggregate([
                {
                    $match:{
                        isApproved: true
                    }
                },
               {
                   $lookup:{
                       from: 'users',
                       localField:'userId',
                       foreignField:'_id',
                       as:'userDetails'
                   }
               },
               {
                   $project:{
                       'userDetails.firstName':1,
                       'userDetails.lastName':1,
                       'userDetails.email':1,
                       'message':1
                   }
               }
            ])
            return data
        }catch(err){
            throw err
        }
    },
    getMessageDetails: async(msgId)=>{
        try{
            const data = await Model.aggregate([
                {
                    $match:{
                        _id: mongoose.Types.ObjectId(msgId)
                    }
                },
                {
                    $lookup:{
                        from: 'users',
                        localField:'userId',
                        foreignField:'_id',
                        as:'userDetails'
                    }
                },
                {
                    $unwind:{
                        path:"$userDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project:{
                        'userDetails.firstName':1,
                        'userDetails.lastName':1,
                        'userDetails.email':1,
                        'userDetails.phone':1,
                        'userDetails.address':1,
                        'userDetails.userName':1,
                        'userDetails.gender':1,
                        'userDetails.profilePic':1,
                        'message':1,
                        'isApproved':1
                    }
                }
            ])  
            return data
        }catch(err){
            throw err
        }
    }
}