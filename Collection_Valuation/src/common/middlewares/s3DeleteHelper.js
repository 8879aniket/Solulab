const AWS = require('aws-sdk')
const { S3: { ACCESSKEYID, SECRETACCESSKEY, BUCKET_NAME } } = require('../../config/config');

var s3Delete = async function (folderName, files) {
  const s3 = new AWS.S3({
    accessKeyId: ACCESSKEYID,
    secretAccessKey: SECRETACCESSKEY
  })

  const response = await Promise.all(files.map(file => {
    if (file && file.filePath) {
      var params = {
        Bucket: BUCKET_NAME,
        Key: `${folderName}/${file.filePath.split('/').pop(0)}`
      }
      return new Promise((resolve, reject) => {
        s3.createBucket({
          Bucket: BUCKET_NAME /* Put your bucket name */
        }, function () {
          s3.deleteObject(params, function (err, data) {
            // eslint-disable-next-line prefer-promise-reject-errors
            if (err) reject()
            else resolve(data)
          })
        })
      })
    }
  }))

  return response
}

module.exports.s3Delete = s3Delete
