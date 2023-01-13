const mongoose = require('mongoose')
const db = require('../connection/dbMaster')

const CmsSchema = new mongoose.Schema({
    pageTitle: { type: String, required: true },
    pageDescription: { type: String, required: true },
    isDeleted: { type: Boolean, default: false}
}, { timestamps: true })

module.exports = db.model('cms', CmsSchema);