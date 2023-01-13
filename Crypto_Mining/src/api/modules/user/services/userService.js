import { userModel } from '../userModel'

module.exports.checkEmailExist = async (email) => {
	const conditions = {
		email,
	}
	const data = await userModel.findOne(conditions)
	return data
}

module.exports.addMinutesToDate = async (date, minutes) => {
	return new Date(date.getTime() + minutes * 60000)
}

const getRandomString = async (length, forWhat) => {
	let randomChars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz'
	if (forWhat === 'recoverycode') {
		randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
	}
	let user
	let result = ''
	for (let i = 0; i < length; i++) {
		result += randomChars.charAt(
			Math.floor(Math.random() * randomChars.length)
		)
	}
	if (forWhat === 'recoverycode') {
		user = await userModel.findOne({ recovery_code: result })
	} else if (forWhat === 'resetpassword') {
		user = await userModel.findOne({ reset_password_code: result })
	} else if (forWhat === 'confirmation') {
		user = await userModel.findOne({ confirmation_code: result })
	}

	if (user) {
		result = await getRandomString(length, forWhat)
	}
	return result
}
module.exports.getRandomString = getRandomString

module.exports.getString = async (callback) => {
	callback('get it?')
}
