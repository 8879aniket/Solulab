var Jimp = require('jimp')

var compress = async function (filePath, writePath) {
  const jimp = await Jimp.read(filePath)
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      await jimp.quality(30).writeAsync(writePath)
      resolve()
    } catch (e) {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject()
    }
  })
}

module.exports.compress = compress
