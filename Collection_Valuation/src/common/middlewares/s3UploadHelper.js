const AWS = require('aws-sdk')
const fs = require('fs')
const { S3: { ACCESSKEYID, SECRETACCESSKEY, ACL, BUCKET_NAME } } = require('../../config/config');

function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err)
      return
    }
  })
}

var upload = async function (folderName, files) {
  const s3 = new AWS.S3({
    accessKeyId: ACCESSKEYID,
    secretAccessKey: SECRETACCESSKEY
  })

  const response = await Promise.all(files.map(file => {
    return new Promise(function (resolve, reject) {
      const params = {
        Bucket: BUCKET_NAME,
        Key: `${folderName}/${file.timeStamp}.${file.extension}`,
        Body: fs.readFileSync(`./public/${file.filePath}`),
        ACL: ACL,
        ContentType: file.fileType
      }
      s3.upload(params, function (err, data) {        
        if (err) {          
          deleteFile(`./public/${file.filePath}`)
          // eslint-disable-next-line prefer-promise-reject-errors
          reject()
        }
        deleteFile(`./public/${file.filePath}`)
        resolve(data.Location)
      })
    })
  }))

  return response
}

module.exports.upload = upload
