const mongoose = require('mongoose')
const cmsModel = require('../../models/cmsModel')

module.exports = {
    getCms: async()=>{
        try{
            const data = await cmsModel.aggregate([
                {
                    $match:{
                        isDeleted: false
                    }
                }
            ])
            return data
        }catch(err){
            return err
        }
    },

    getSingleCms: async(cmsId)=>{
        try{
            const data = await cmsModel.findById({ _id: cmsId })
            return data
        }catch(err){
            return err
        }
    },
    updateCms: async(cmsId, cmsObj)=>{
        try{
            const data = await cmsModel.findByIdAndUpdate(cmsId, cmsObj, { new: true })
            return data 
        }catch(err){
            return err
        }
    },
    deleteCms: async(cmsId)=>{
        try{
            const data = await cmsModel.findByIdAndUpdate(
                { _id: cmsId },
                { $set:{ isDeleted: true }},
                { new: true })
            return data
        }catch(err){
            return err
        }
    },
    createCms: async(cmsObj)=>{
        try{
            const newCms = await cmsModel.create(cmsObj)
            return newCms
        }catch(err){
            throw err
        }
    }
}