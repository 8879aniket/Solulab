const { readFileSync } = require('fs')
const { posix } = require('path')

const authTokenPrivateKey = readFileSync(
	posix.join(__dirname, 'private.pem'),
	'utf-8'
)
const authTokenPublicKey = readFileSync(
	posix.join(__dirname, 'public.pem'),
	'utf-8'
)

module.exports = { authTokenPublicKey, authTokenPrivateKey }
