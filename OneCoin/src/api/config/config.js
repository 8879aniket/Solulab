import dotenv from 'dotenv'

dotenv.config()
export default {
	apiVersionUrl: '/api/v1',
	env: process.env.NODE_ENV,
	redisPort: process.env.REDIS_PORT,
	redisHost: process.env.REDIS_HOST,
	backendHostedUrl: process.env.HOST_URL,
	// env: 'development',
	// auth_token:
	// 	process.env.NODE_ENV === 'development'
	// 		? process.env.AUTH_DEV_TOKEN
	// 		: process.env.AUTH_PROD_TOKEN,

	jwtSecret: 'process.env.JWT_SECRET',
	jwtExpiresIn: '24h',
	// nft_gallery_url:
	// 	process.env.NODE_ENV === 'development'
	// 		? process.env.MONGO_DEV_STRING
	// 		: process.env.MONGO_DEV_STRING,

	db: {
		str: process.env.MONGO_URI,
		options: {
			useNewUrlParser: true,
			readPreference: 'primaryPreferred',
			useUnifiedTopology: true,
		},
	},
	adminCreds: {
		email: process.env.ADMIN_EMAIL,
		password: process.env.ADMIN_PASSWORD,
		mobileNumber: process.env.ADMIN_MOBILENUMBER,
		countryCode: process.env.ADMIN_COUNTRYCODE,
	},
	s3Credentials: {
		region: process.env.S3REGION,
		accessKeyId: process.env.S3ACCESS_KEY,
		secretAccessKey: process.env.S3SECRET_ACCESS_KEY,
		bucket: process.env.BUCKET,
	},

	ogtValue: process.env.OGT,

	sendgrid: {
		api_key: process.env.SENDGRID_API_KEY,
		account_SID: process.env.SENDGRID_ACCOUNT_SID,

		auth_token: process.env.SENDGRID_AUTH_TOKEN,

		trial_number: process.env.SENDGRID_TRIAL_NUMBER,

		mail: process.env.CONFIG_MAIL,
	},
	helpdesk_email: process.env.SUPPORT_EMAIL,
	polygonURL: process.env.POLYGON_WEBSOCKET_URL,
	contractAddress: {
		oneCoinOGT: process.env.ONECOIN_OGT,
		onecoinNFTMint: process.env.ONECOIN_NFT_MINT,
		onecoinMarketPlace: process.env.ONECOIN_MARKETPLACE,
		onecoinOneForge: process.env.ONECOIN_ONEFORGE,
	},
	ownerPrivateKey: process.env.OWNER_PRIVATE_KEY,
	ownerMintAddress: process.env.OWNER_MINTING_ADDRESS,
}
