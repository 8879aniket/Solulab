import { config } from 'dotenv'

import ConfigInterface from '@interfaces/config'

config()

const Config: ConfigInterface = {
	NODE_ENV: process.env.NODE_ENV,
	PORT: process.env.PORT,
	AWS: {
		AWS_UserName: process.env.AWS_UserName,
		AWS_Password: process.env.AWS_Password,
		AWS_Access_key_ID: process.env.AWS_Access_key_ID,
		AWS_Secret_access_Key: process.env.AWS_Secret_access_Key,
		AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
		AWS_SQS_QUEUE_REGION: process.env.AWS_SQS_QUEUE_REGION,
		AWS_SQS_QUEUE_URL: `https://sqs.${process.env.AWS_SQS_QUEUE_REGION}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}`,
		AWS_SES_SOURCE_EMAIL: process.env.AWS_SES_SOURCE_EMAIL!,
		AWS_SES_REGION: process.env.AWS_SES_REGION!,
		AWS_SES_CC_EMAIL: process.env.AWS_SES_CC_EMAIL!,
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
		USER: `${process.env.SERVICES_USER_URL}/api/v1`, // User microservrice url
		AUTH: `${process.env.SERVICES_AUTH_URL}/api/v1`, // Auth microservrice url
		PAYMENT: `${process.env.SERVICES_PAYMENT_URL}/api/v1`, // Payment microservrice url
	},
	AUTH: {
		GENERATE_TOKEN: `${process.env.SERVICES_AUTH_URL!}/api/v1/auth/generateToken`,
		VERIFY_TOKEN: `${process.env.SERVICES_AUTH_URL!}/api/v1/auth/verifyToken`,
		GENERATE_TEMP_TOKEN: `${process.env
			.SERVICES_AUTH_URL!}/api/v1/auth/generateToken-microservices`,
	},
	PAYMENT: {
		CREATE_WALLET: `${process.env.SERVICES_PAYMENT_URL}/api/v1/circle/createWallet`,
		GET_ALL_WALLETS: `${process.env.SERVICES_PAYMENT_URL}/api/v1/circle/getAllWallet`,
		GET_BALANCE: `${process.env.SERVICES_PAYMENT_URL}/api/v1/circle/getWalletbalance`,
		CREATE_TRANSFER: `${process.env.SERVICES_PAYMENT_URL}/api/v1/circle/createTransfer`,
		GET_WALLET_DETAILS: `${process.env.SERVICES_PAYMENT_URL}/api/v1/circle/getWalletDetails`,
		GET_TRANSACTION_BY_WALLET_ID: `${process.env.SERVICES_PAYMENT_URL}/api/v1/circle/getAllTransactionByWalletId`,
		UPDATE_TRANSACTION: `${process.env.SERVICES_PAYMENT_URL}/api/v1/circle/updateTransaction`,
		CAXTON: {
			CAXTON_ENABLE: process.env.CAXTON_ENABLE === 'true' ? true : false,
			CREATE_CURRENCY_POT: `${process.env.SERVICES_PAYMENT_URL}/api/v1/caxton/createCurrencyPot`,
			GET_MAIN_POT_BALANCE: `${process.env.SERVICES_PAYMENT_URL}/api/v1/caxton/getMainCurrencyBalance`,
			GET_CURRENCY_POT_BALANCE: `${process.env.SERVICES_PAYMENT_URL}/api/v1/caxton/getCurrencyPotBalance`,
			GET_ALL_CURRENCY_POT_BALANCE: `${process.env.SERVICES_PAYMENT_URL}/api/v1/caxton/getAllPotBalance`,
			TRANSFER_BETWEEN_POTS: `${process.env.SERVICES_PAYMENT_URL}/api/v1/caxton/transferMoneyBetweenPotService`,
			TRANSFER_BETWEEN_ACCOUNTS: `${process.env.SERVICES_PAYMENT_URL}/api/v1/caxton/transferFundBetweenAccount`,
			GET_TRANSACTION_BY_CCY_CODE: `${process.env.SERVICES_PAYMENT_URL}/api/v1/caxton/getAllCaxtonTransactionByccyCode`,
		},
	},
	WEB3: {
		CREATE_BLOCKCHAIN_WALLET: `${process.env.SERVICES_WEB3_URL}/api/v1/venly/createBlockchainWallet`,
		EXECUTE_CONTRACT: `${process.env.SERVICES_WEB3_URL}/api/v1/venly/executeContract`,
		MINT_GTP_META_TRANSACTION: `${process.env.SERVICES_WEB3_URL}/api/v1/venly/mintGTP`,
		TRANSFER_GTP_TOKEN: `${process.env.SERVICES_WEB3_URL}/api/v1/venly/transferGTP`,
		MINT_VCC_META_TRANSACTION: `${process.env.SERVICES_WEB3_URL}/api/v1/venly/mintVCC`,
		GTP_CONTRACT_ADDRESS: process.env.GTP_CONTRACT_ADDRESS,
		SWAP_META_TRANSACTION: `${process.env.SERVICES_WEB3_URL}/api/v1/venly/swap`,
	},
	ADMIN: {
		GET_SUPER_ADMIN: `${process.env.SERVICES_ADMIN_URL}/api/v1/admin/getSuperAdmin`,
	},
	REQUIRED_FIELDS: {
		PROJECT_CREATION: [
			'title',
			'country',
			'city',
			'state',
			'postal_code',
			'address',
			'vintage',
			'latitude',
			'longitude',
			'registry',
			'standard',
			'activity',
			'type',
			'methodology',
			'scale',
			'length',
			'project_details_doc',
			'project_images',
			'other_docs',
			'project_logo',
			'payment_method',
			'account_type',
			'account_number',
			'routing_number',
			'bank_country',
			'bank_name',
			'bank_city',
			'iban',
			'plaid_token',
			'billing_name',
			'billing_country',
			'billing_city',
			'billing_address1',
			'billing_postal_code',
			'seed_credits',
			'expected_credit_date',
			'raise_amount',
		],
	},
	HELLO_SIGN: {
		KEY: process.env.HELLO_SIGN_KEY!,
		TEMPLATE_ID: process.env.HELLO_SIGN_TEMPLATE_ID!,
		CLIENT_ID: process.env.HELLO_SIGN_CLIENT_ID!,
	},
	// TODO: this is for testing will change it in future
	COIN_GECKO: {
		url: process.env.COIN_GECKO_URL!,
		COIN_ID: process.env.COIN_ID!,
		COIN_QUERY: process.env.COIN_QUERY!,
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
	PUBLIC: {
		GET_PUBLIC_PROJECT_DATA: `${process.env.SERVICES_BACKEND_PLATFORM_URL}/api/v1/projects/getProjectPublic`,
		GET_PUBLIC_VCC_DATA: `${process.env.SERVICES_BACKEND_PLATFORM_URL}/api/v1/projects/getPojectVccPublicData`,
	},
	NOTIFICATION: {
		SEND: `${process.env.SERVICES_NOTIFICATION_URL}/api/v1/notification/create`,
		BULK_SEND: `${process.env.SERVICES_NOTIFICATION_URL}/api/v1/notification/bulkCreate`,
		SUBSCRIBE_TOPIC: `${process.env.SERVICES_NOTIFICATION_URL}/api/v1/notification/subscribeTopic`,
	},
	REDIS_CLUSTER_PATH: [
		process.env.REDIS_CLUSTER_PATH1!,
		process.env.REDIS_CLUSTER_PATH2!,
		process.env.REDIS_CLUSTER_PATH3!,
	],
	REDIS_CLUSTER_PASSWORD: process.env.REDIS_CLUSTER_PASSWORD!,
	REDIS_ENVIRONMENT: process.env.REDIS_ENVIRONMENT!,
}

export default Config
