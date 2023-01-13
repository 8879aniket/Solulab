const mongoose = require ('mongoose')
const bcrypt = require ('bcrypt')
const jwt = require ('jsonwebtoken')
const db = require('../connection/dbMaster');

const adminSchema = new mongoose.Schema({
	firstName: { type: String },
    lastName: { type: String },
	userName: { type: String },
	email: { type: String, required: true, trim: true, lowercase: true },
    countryCode: { type: String },
    phone: { type: Number, required: true },
    profilePic: {
        key: String,
        url: String,
        sizeInMegaByte: Number,
      },
	resetToken: { type: String, default: ''},
    userType: { type: String, enum:['user', 'admin'], default:'user'},
	password: { type: String, required: true, select: false },
	passwordChangedAt: { type: Date },
}, { timestamps: true })

adminSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next()
	this.password = await bcrypt.hash(this.password, 10)
	next()
})
adminSchema.pre('save', async function (next) {
	if (!this.isModified('password') || this.isNew ) return next()
	this.passwordChangedAt = Date.now()
	next()
})
adminSchema.methods.correctPassword = async function (candidatePassword, userPassword){
	return await bcrypt.compare(candidatePassword, userPassword)
}

adminSchema.methods.generateJwt = function () {
	return jwt.sign({ _id: this._id }, process.env.APP_SECRET, {
		expiresIn: "24h"
	})
}

module.exports = db.model('admin', adminSchema);
