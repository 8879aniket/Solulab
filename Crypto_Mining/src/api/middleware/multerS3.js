/* eslint-disable object-shorthand */
/* eslint-disable func-names */
import aws from 'aws-sdk'
import multer from 'multer'
import multerS3 from 'multer-s3'
import { s3Credentials } from '../config/index'

const s3 = new aws.S3(s3Credentials)
const multerStorage = multerS3({
	s3: s3,
	bucket: s3Credentials.bucket,
	acl: 'public-read',
	metadata: function (req, file, cb) {
		cb(null, { fieldName: file.fieldname })
	},
	key: function (req, file, cb) {
		const ext = file.mimetype.split('/')[1]
		cb(
			null,
			`product/${req.body.name.replace(/ /g, '')}-${Date.now()}.${ext}`
		)
	},
})

const multerStorageUser = multerS3({
	s3: s3,
	bucket: s3Credentials.bucket,
	acl: 'public-read',
	metadata: function (req, file, cb) {
		cb(null, { fieldName: file.fieldname })
	},
	key: function (req, file, cb) {
		const ext = file.mimetype.split('/')[1]
		cb(null, `profile-images/user-${req.userId}-${Date.now()}.${ext}`)
	},
})

const multerStorageAdmin = multerS3({
	s3: s3,
	bucket: s3Credentials.bucket,
	acl: 'public-read',
	metadata: function (req, file, cb) {
		cb(null, { fieldName: file.fieldname })
	},
	key: function (req, file, cb) {
		const ext = file.mimetype.split('/')[1]
		cb(null, `profile-images/admin-${req.userId}-${Date.now()}.${ext}`)
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

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
})

const uploadUser = multer({
	storage: multerStorageUser,
	fileFilter: multerFilter,
})

const uploadAdmin = multer({
	storage: multerStorageAdmin,
	fileFilter: multerFilter,
})

exports.uploadProductImages = upload.array('image', 5)
exports.uploadUserImage = uploadUser.single('image')
exports.uploadAdminImage = uploadAdmin.single('image')
exports.s3 = s3
