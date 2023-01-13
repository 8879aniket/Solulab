import crypto from 'crypto'

export const encryptCaxtonPassword = async (password: string) => {
	const hash = crypto.createHash('md5')
	const passwordBytes = Buffer.from(password, 'utf8')
	const hashedPassword = hash.update(passwordBytes).digest()
	const finalData = hashedPassword.toString('base64')

	return finalData
}
