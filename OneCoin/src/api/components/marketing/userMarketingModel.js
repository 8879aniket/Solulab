import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import validator from 'validator'

const { Schema, model } = mongoose
const { ObjectId } = Schema.Types

const userMarketingSchema = new Schema(
	{
		name: {
			type: String,
			default: '',
		},
		walletAddress: {
			type: String,
		},
		email: {
			type: String,
			lowercase: true,
			validate: [validator.isEmail, 'Please provide a valid email'],
		},
		mobileNumber: String,
		countryCode: String,
		otp: Number,
		profilePic: {
			type: Object,
		},
		coverPic: {
			type: Object,
		},
		bio: String,
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user',
		},
		privacySetting: {
			showCollection: {
				type: Boolean,
				default: true,
			},
		},
		notificationSetting: {
			nftSold: {
				type: Boolean,
				default: true,
			},
			nftBought: {
				type: Boolean,
				default: true,
			},
			updateProfile: {
				type: Boolean,
				default: true,
			},
			priceChange: {
				type: Boolean,
				default: true,
			},
			mute: {
				type: Boolean,
				default: true,
			},
		},
		isMute: {
			type: Boolean,
			default: false,
		},
		muteReason: {
			type: String,
		},
		achievement: {
			type: ObjectId,
			ref: 'Achievement',
		},
		achievementClaimDate: Date,
		isPlayer: {
			type: Boolean,
			default: false,
		},
		password: {
			type: String,
			minlength: 8,
		},
		passwordChangedAt: Date,
		passwordResetToken: String,
		passwordResetExpires: Date,
		isActive: {
			type: Boolean,
			default: true,
			select: false,
		},
		// Initial 5% for user
		totalRoyalties: {
			type: Number,
			default: 0,
		},
		totalMerge: {
			type: Number,
			default: 0,
		},
		totalFragment: {
			type: Number,
			default: 0,
		},
		referralCode: {
			type: String,
			require: true,
		},
		referredBy: {
			type: ObjectId,
			ref: 'User',
		},
		walletName: {
			type: String,
			enum: ['METAMASK', 'COINBASE', 'TRUST'],
		},
		chainId: {
			type: Number,
		},
		nftEarned: {
			type: Schema.Types.Mixed,
		},
	},
	{
		timestamps: true,
	}
)

// eslint-disable-next-line func-names
userMarketingSchema.pre('save', async function (next) {
	// Only run this function if password was actually modified
	if (!this.isModified('password')) return next()

	// Hash the password with cost of 12
	this.password = await bcrypt.hash(this.password, 12)
	next()
})

// eslint-disable-next-line func-names
userMarketingSchema.pre('save', function (next) {
	if (!this.isModified('password') || this.isNew) return next()

	this.passwordChangedAt = Date.now() - 1000
	next()
})

userMarketingSchema.methods.correctPassword = async (candidatePassword, userPassword) => {
	const verified = await bcrypt.compare(candidatePassword, userPassword)
	return verified
}

userMarketingSchema.methods.changedPasswordAfter = (JWTTimestamp) => {
	if (this.passwordChangedAt) {
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)

		return JWTTimestamp < changedTimestamp
	}

	// False means NOT changed
	return false
}

const userMarketing = model('userMarketing', userMarketingSchema)

export default userMarketing
