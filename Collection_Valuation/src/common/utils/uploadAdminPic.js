const { S3: { ACCESSKEYID, SECRETACCESSKEY, ACL, BUCKET_NAME: _BUCKET_NAME } } = require('../../config/config');

const path = require('path')
const AWS = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3-transform')
const sharp = require('sharp')

// access ID and secret key here
const ID = ACCESSKEYID
const SECRET = SECRETACCESSKEY
// The name of the bucket that you have created
const BUCKET_NAME = _BUCKET_NAME

const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
})

module.exports.uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    acl: ACL,
    bucket: BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname })
    },
    key: (req, file, cb) => {
      const loggedInUser = req.user
     
      const fullPath = `${loggedInUser._id.toString()}/${loggedInUser._id.toString()}-${Date.now()}${path.extname(
        file.originalname
      )}`
      cb(null, fullPath)
    },
    shouldTransform: function (req, file, cb) {
      cb(null, /^image/i.test(file.mimetype))
    },
    transforms: [
      {
        id: 'toWebp',
        key: (req, file, cb) => {
          const loggedInUser  = req.user
          const fullPath = `${loggedInUser._id.toString()}/${loggedInUser._id.toString()}-${Date.now()}.webp`
          cb(null, fullPath)
        },
        transform: function (req, file, cb) {
          cb(null, sharp().webp())
        },
      },
    ],
  }),
})

module.exports.deleteFromS3 = (key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key.key
    }
    return new Promise((resolve, reject) => {
      s3.deleteObject(params, function (err, data) {
        if (err) reject()
        else resolve(data)
      })
    })
  } catch (error) {
    throw error
  }
}

module.exports.S3ExtractMeta = (files) => {
  // Fetch uploaded file information
  const FILE = []
  if (!Array.isArray(files)) {
    return FILE
  }
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex]
    const metaSource = file.transforms ? file.transforms[0] : file
    if (metaSource) {
      metaSource.mimetype = metaSource.mimetype ?? 'image/webp'
      const contentType = /^image/i.test(file.mimetype)
        ? 'image'
        : /^video/i.test(file.mimetype)
          ? 'video'
          : null
      FILE.push({
        mimetype: metaSource.mimetype,
        contentType,
        key: metaSource.key,
        location: metaSource.location,
        size: metaSource.size,
      })
    }
  }
  return FILE
}
