import { config } from 'dotenv-safe'

config({
	allowEmptyValues: true,
})

module.exports = {
	baseUrl: process.env.APP_URL,
	appName: process.env.APP_NAME,
	db: {
		str: process.env.MONGO_URL,
		options: {
			auto_reconnect: true,
			poolSize: 200,
			useNewUrlParser: true,
			readPreference: 'primaryPreferred',
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true,
		},
	},
	jwtToken: process.env.JWT_SECRETKEY,
	twilioObj: {
		accountSid: process.env.TWILIO_ACCOUNT_SID,
		authToken: process.env.TWILIO_AUTH_TOKEN,
		verifyService: process.env.TWILIO_VERIFY_SERVICE,
	},
	smtpSettings: {
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		secure: false, // true for 465, false for other ports
		auth: {
			user: process.env.SMTP_EMAIL,
			pass: process.env.SMTP_PASS,
		},
		from: {
			email: process.env.SMTP_FROM_EMAIL,
			name: process.env.SMTP_FROM_NAME,
		},
		apiKey: process.env.SENDGRID_API_KEY,
		senderEmail: process.env.SENDER_EMAIL,
	},
	s3Credentials: {
		region: process.env.S3REGION,
		accessKeyId: process.env.S3ACCESS_KEY,
		secretAccessKey: process.env.S3SECRET_ACCESS_KEY,
		bucket: process.env.BUCKET,
	},
	hashRateUrl: process.env.HASHRATE_URL,
	bitcoinPerBlockUrl: process.env.BITCOINPERBLOCK_URL,
	bitcoinPriceUrl: process.env.BITCOIN_PRICE_COINBASE_URL,

	accountSid: process.env.TWILIO_ACCOUNT_SID,
	authToken: process.env.TWILIO_AUTH_TOKEN,
	twilioNumber: process.env.TWILIO_ACCOUNT_NUMBER,
	stripe: {
		secretKey: process.env.STRIPE_SECRET_KEY,
		publicKey: process.env.STRIPE_PUBLIC_KEY,
	},
	appLogo: process.env.APP_LOGO,
}
