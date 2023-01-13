import { config } from 'dotenv'

import ConfigInterface from '@interfaces/config'

config()

const Config: ConfigInterface = {
	NODE_ENV: process.env.NODE_ENV,
	PORT: process.env.PORT,
	AWS: {
		UserName: process.env.AWS_UserName,
		Password: process.env.AWS_Password,
		Access_key_ID: process.env.AWS_Access_key_ID,
		Secret_access_Key: process.env.AWS_Secret_access_Key,
		ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
		SQS_QUEUE_REGION: process.env.AWS_SQS_QUEUE_REGION,
		SES_REGION: process.env.AWS_SES_REGION!,
		SES_SOURCE_EMAIL: process.env.AWS_SES_SOURCE_EMAIL!,
		SES_CC_EMAIL: process.env.AWS_SES_CC_EMAIL!,
		SQS_QUEUE_URL: `https://sqs.${process.env.AWS_SQS_QUEUE_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}`,
	},
	DB: {
		DB_NAME: process.env.DB_NAME,
		DB_DIALECT: process.env.DB_DIALECT,
		DB_USERNAME: process.env.DB_USERNAME,
		DB_PASSWORD: process.env.DB_PASSWORD,
		DB_HOST: process.env.DB_HOST,
		DB_PORT: process.env.DB_PORT,
	},
	SERVICES: {
		USER: process.env.SERVICES_USER_URL,
		AUTH: process.env.SERVICES_AUTH_URL,
	},
	FIREBASE: {
		SERVICE_ACCOUNT: {
			type: process.env.FIREBASE_TYPE!,
			project_id: process.env.FIREBASE_PROJECT_ID!,
			private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
			private_key:
				'-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCzJahxh9Pmj7vN\nOL9ivMck8s8LZZT+P0qlSc4PdMm49HIusonOj2UbEduApp5Vlr44z3SeJNAhXGIu\ndJa4UBd3v/lmlCAOlVyJaAaVLxhtgWKAdOVhsAQjNOjjcmIMtJ/zVI4Fhb+a2gBt\n3TZNsbOOFsdEfc4eM3HWD/PSD6WAsb1lq5j6bu/CGvA9vYqRknQEJemPEknTjRpO\n3qDBu73pAMLnZ5sI6qfHT7X3/2SV4NhPq4UMvpQVppq4jr9g7d4mrl/AprDmyIeU\nQ/IrI3i1mvlGg2dvHqhINpErl43DQ3JvQVwEwbtchfN6pnu9jjLegl+N7mNR9kDA\n5Fl4uSo/AgMBAAECggEAS+vDrQmBNg7n6hsIkNGsG+6C7DOKpw0vl0jl+Qrnimie\nE0g6ur1ufcBdo/H43BDcYLsakwLK6bh7K3Dhhw76QxeqnFxeEZAe/WSGlaa11YKl\nugbQR0wPFNSRdgK9puDNgJPu9EwwXXHSCL1dDCQpEih5Hn+qYIYw0iVEkVtsKlNx\nxfsHeYifMJV9vH+S+paGbHZ1MNyDTxwlAeLCX0Iuvy4RjN4dKBZngFa5Tw8jf5wE\nfWZxWtw0Or37haw6QaRRZaTDR/jNpjFZ8ocXYzdpHztl+xjdVIrpSffOjWxOxDY6\ngT3Aq7yAlS3ks/5pO2jURFq+ex2oSuJ35rSn61x0cQKBgQD2NRhBFw9dl1SpuUvX\nDLGRv7ZSpZiqH6J2dftBZDdHQwrvUZkzPKpBdZBYYgctC5H4nwHp/s5e4wEM7MRD\n8eTfzwzRpviK1rSjA0Pw5GjE8gZ8Fg02Vi7zOGeG0UlYHsLUgCL/sbSmImRpIFIo\n95CLGxS9w/WgAq0VbhgRU3l5cwKBgQC6Rb/ZZ2HGxJ9k5cQp4rI8N/dOuo/fanqA\neJtdbfS2DOjSzWOwGJyAlOcAxSOuLYgcrUMQ5Oz0CqRQ+9odgtjQiGz9YfYQsCKj\nn2y2zExjEfopnwFxLmRTVRNV4tLTXQqE1MX3zkZkknb8R3XrC0kcWcoJVj0WL66b\nabBBb2hJBQKBgQC/xJ89o55+QW7aO8+MkwCEC5URTpZYfAdoyYCIcGx1/ww3V5FC\nTVA3aECj9sasGUT7J66v+Z34XkvlK027tl+Uy4qqiakxSwarqdFzghTwwaq3X92u\novYyz44jfkPodR0/swaPrnSMqmEXWOtlqV5WWyOOo2Ff3nW+KWBprmEBbQKBgQCt\nPlvtfmqA7LR2qgAlGLO+sCqyLW/MUgL3Y7TUU4TqoN0V2nLiADHmoRasL648vBpA\n2aBroQ8E9rTWoTa+hcjTQl9j1m1+HeNJnOgGp8JPzhOGDF3R/1zN6G1gTuLYNEup\nOR+al13/Af3qKyhv4AIyfQwcXPnZnaVe5BBK+6vZZQKBgQCzPHCxvOvIDtohlouN\n4F5wUUWyxhFESbdUmYIRdiqy6ZS2wkuwnQ7EgalnOUG/ym8YB965BhLPWZS1ii8Y\ncyh2/uSinYRkm1hmLVs4xqIa0j+rxyKCIl2Qi06Nxc0j4GRn8KDPckXQDqhcdpVX\n3AO0WDXqm/12x77WuAxqjJkE0w==\n-----END PRIVATE KEY-----\n',
			client_email: process.env.FIREBASE_CLIENT_EMAIL!,
			client_id: process.env.FIREBASE_CLIENT_ID!,
			auth_uri: process.env.FIREBASE_AUTH_URI!,
			token_uri: process.env.FIREBASE_TOKEN_URI!,
			auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL!,
			client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL!,
		},
	},
	AUTH: {
		GENERATE_TOKEN: `${process.env.SERVICES_AUTH_URL!}/api/v1/auth/generateToken`,
		VERIFY_TOKEN: `${process.env.SERVICES_AUTH_URL!}/api/v1/auth/verifyToken`,
	},
	PAYMENT: {
		CREATE_USER: `${process.env.SERVICES_PAYMENT_URL}/api/v1/dummy/user/create`,
		UPDATE_USER: `${process.env.SERVICES_PAYMENT_URL}/api/v1/dummy/user/update`,
		CREATE_BANK_ACCOUNT: `${process.env.SERVICES_PAYMENT_URL}/api/v1/circle/createBankAccount`,
		CREATE_WALLET: `${process.env.SERVICES_PAYMENT_URL}/api/v1/circle/createWallet`,
		CREATE_ACH_BANK_ACCOUNT: `${process.env.SERVICES_PAYMENT_URL}/api/v1/circle/createACHBankAccount`,
		CAXTON: {
			USER_ONBOARDING: `${process.env.SERVICES_PAYMENT_URL}/api/v1/caxton/userOnboarding`,
			USER_LOGIN: `${process.env.SERVICES_PAYMENT_URL}/api/v1/caxton/loginCaxtonAccount`,
		},
	},
	WEB3: {
		CREATE_BLOCKCHAIN_WALLET: `${process.env.SERVICES_WEB3_URL}/api/v1/venly/createBlockchainWallet`,
	},
	CREATE_PASSWORD: {
		FE_CREATE_PASSWORD_URL: process.env.FE_CREATE_PASSWORD_URL,
	},
	BACKEND_PLATFORM: {
		CREATE_USER: `${process.env.SERVICES_BACKEND_PLATFORM_URL}/api/v1/dummy/user/create`,
		UPDATE_USER: `${process.env.SERVICES_BACKEND_PLATFORM_URL}/api/v1/dummy/user/update`,
	},
	CIRCLE: {
		CIRCLE_TEST_DATA: process.env.CIRCLE_TEST_DATA === 'true' ? true : false,
		ACCOUNT_NUMBER: process.env.ACCOUNT_NUMBER,
		ROUTING_NUMBER: process.env.ROUTING_NUMBER,
		BILLING_CITY: process.env.BILLING_CITY,
		BILLING_COUNTRY: process.env.BILLING_COUNTRY,
		BILLING_DISTRICT: process.env.BILLING_DISTRICT,
		BILLING_LINE1: process.env.BILLING_LINE1,
		POSTAL_CODE: process.env.POSTAL_CODE,
		BANK_COUNTRY: process.env.BANK_COUNTRY,
		BANK_DISTRICT: process.env.BANK_DISTRICT,
	},
	ECHO_SERVICE: {
		CREATE_USER: `${process.env.SERVICES_ECHO_URL}/api/v1/dummy/user/create`,
		UPDATE_USER: `${process.env.SERVICES_ECHO_URL}/api/v1/dummy/user/update`,
	},
	NOTIFICATION: {
		SEND: `${process.env.SERVICES_NOTIFICATION_URL}/api/v1/notification/create`,
		BULK_SEND: `${process.env.SERVICES_NOTIFICATION_URL}/api/v1/notification/bulkCreate`,
		SUBSCRIBE_TOPIC: `${process.env.SERVICES_NOTIFICATION_URL}/api/v1/notification/subscribeTopic`,
		UNSUBSCRIBE_TOPIC: `${process.env.SERVICES_NOTIFICATION_URL}/api/v1/notification/unSubscribeTopic`,
	},
	FE_EMAIL_VERIFICATION_URL: `${process.env.FE_EMAIL_VERIFICATION_URL}`,
}

export default Config
