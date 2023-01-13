/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable node/no-extraneous-import */
/* eslint-disable func-names */
/* eslint-disable object-shorthand */
import aws from 'aws-sdk'
import multer from 'multer'
import multerS3 from 'multer-s3'
import config from '../config/config.js'

const s3 = new aws.S3(config.s3Credentials)

const multerStorage = multerS3({
	s3: s3,
	bucket: config.s3Credentials.bucket,
	acl: 'public-read',
	metadata: function (req, file, cb) {
		cb(null, { fieldName: file.fieldname })
	},
	key: function (req, file, cb) {
		const ext = file.mimetype.split('/')[1]
		cb(null, `images-${req.user._id}-${Date.now()}.${ext}`)
	},
})
const multerFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg'
	) {
		cb(null, true)
	} else {
		req.file_error = 'file not allowed'
		cb(null, false)
	}
}
const uploadUser = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
})
export default uploadUser
