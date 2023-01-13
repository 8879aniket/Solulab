import _ from 'lodash'
import jwt from 'jsonwebtoken'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { generateKeyPairSync } from 'crypto'
import config from '@config/config'
import { Logger } from '@config/logger'

import { JWTPayload } from '../interfaces/jwtPayload'

const _JWT_SECRET = config.JWT.JWT_SECRET
const _JWT_EXPIRY = config.JWT.JWT_EXPIRE
const _JWT_REMEMBERME_EXPIRES_IN = config.JWT.JWT_REMEMBERME_EXPIRES_IN
const _keyDir = resolve(`${process.cwd()}/src/keys`)
const _publicKeyPath = resolve(`${_keyDir}/rsa.pub`)
const _privateKeyPath = resolve(`${_keyDir}/rsa`)

export const generateKey = async () => {
	try {
		const keyDir = _keyDir
		const publicKeyPath = _publicKeyPath
		const privateKeyPath = _privateKeyPath

		const JWT_SECRET = _JWT_SECRET

		// Throw error if JWT_SECRET is not set
		if (!JWT_SECRET) {
			throw new Error('JWT_SECRET is not defined.')
		}

		// Check if config/keys exists or not
		if (!existsSync(keyDir)) {
			mkdirSync(keyDir)
		}

		// Check if PUBLIC and PRIVATE KEY exists else generate new
		if (!existsSync(publicKeyPath) && !existsSync(privateKeyPath)) {
			const result = generateKeyPairSync('rsa', {
				modulusLength: 4096,
				publicKeyEncoding: {
					type: 'spki',
					format: 'pem',
				},
				privateKeyEncoding: {
					type: 'pkcs8',
					format: 'pem',
					cipher: 'aes-256-cbc',
					passphrase: JWT_SECRET,
				},
			})

			const { publicKey, privateKey } = result
			writeFileSync(`${keyDir}/rsa.pub`, publicKey, { flag: 'wx' })
			writeFileSync(`${keyDir}/rsa`, privateKey, { flag: 'wx' })
			Logger.warn('New public and private key generated.')
		}
	} catch (err) {}
}

export const generateToken = async (payload: JWTPayload, rememberMe: boolean) => {
	try {
		const privateKey = readFileSync(_privateKeyPath)

		if (payload.accountType === 'Echo' || 'Backendplatform') {
			return jwt.sign(
				{},
				{ key: privateKey.toString(), passphrase: _JWT_SECRET! },
				{
					algorithm: 'RS256',
					//expiresIn: _JWT_EXPIRY,
					expiresIn: rememberMe ? _JWT_REMEMBERME_EXPIRES_IN : _JWT_EXPIRY,
					subject: payload.accountType,
				}
			)
		}

		return jwt.sign(
			payload,
			{ key: privateKey.toString(), passphrase: _JWT_SECRET! },
			{
				algorithm: 'RS256',
				//expiresIn: _JWT_EXPIRY,
				expiresIn: rememberMe ? _JWT_REMEMBERME_EXPIRES_IN : _JWT_EXPIRY,
				subject: payload.id,
			}
		)
	} catch (err) {
		Logger.error(err)
	}
}

export const verifyToken = async (token: string) => {
	try {
		const publicKey = readFileSync(_publicKeyPath)
		return jwt.verify(token, publicKey, {
			algorithms: ['RS256'],
		}) as JWTPayload
	} catch (err) {
		Logger.error(err)
		return { error: err }
	}
}
