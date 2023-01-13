import multer from 'multer'

const uploadProfilePic = multer({ dest: 'uploadPic' })

const uploadNft = multer({ dest: 'uploadNft' })
module.exports.uploadNft = uploadNft

module.exports.uploadProfilePic = uploadProfilePic
