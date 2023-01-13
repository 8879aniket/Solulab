const { ObjectId } = require('mongoose').Types

exports.isValidObjectId = (id) => {
	if (ObjectId.isValid(id)) {
		if (String(new ObjectId(id)) === id) return true
		return false
	}
	return false
}
