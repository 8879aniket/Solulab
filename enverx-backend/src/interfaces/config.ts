export default interface ConfigInterface {
	NODE_ENV: string | undefined
	PORT: string | undefined
	AWS: {
		AWS_UserName: string | undefined
		AWS_Password: string | undefined
		AWS_Access_key_ID: string | undefined
		AWS_Secret_access_Key: string | undefined
		AWS_ACCOUNT_ID: string | undefined
		AWS_SQS_QUEUE_REGION: string | undefined
		AWS_SQS_QUEUE_URL: string | undefined
		AWS_SES_SOURCE_EMAIL: string
		AWS_SES_REGION: string
		AWS_SES_CC_EMAIL: string
	}
	DB: {
		DB_NAME: string | undefined
		DB_DIALECT: string | undefined
		DB_USERNAME: string | undefined
		DB_PASSWORD: string | undefined
		DB_HOST: string | undefined
		DB_PORT: string | undefined
	}
	SERVICES: {
		USER: string | undefined
		AUTH: string | undefined
		PAYMENT: string | undefined
	}
	AUTH: {
		GENERATE_TOKEN: string
		VERIFY_TOKEN: string
		GENERATE_TEMP_TOKEN: string
	}
	PAYMENT: {
		CREATE_WALLET: string | undefined
		GET_ALL_WALLETS: string | undefined
		GET_BALANCE: string | undefined
		CREATE_TRANSFER: string | undefined
		GET_WALLET_DETAILS: string | undefined
		GET_TRANSACTION_BY_WALLET_ID: string | undefined
		UPDATE_TRANSACTION: string | undefined
		CAXTON: {
			CAXTON_ENABLE: boolean | undefined
			CREATE_CURRENCY_POT: string | undefined
			GET_MAIN_POT_BALANCE: string | undefined
			GET_CURRENCY_POT_BALANCE: string | undefined
			GET_ALL_CURRENCY_POT_BALANCE: string | undefined
			TRANSFER_BETWEEN_POTS: string | undefined
			TRANSFER_BETWEEN_ACCOUNTS: string | undefined
			GET_TRANSACTION_BY_CCY_CODE: string | undefined
		}
	}
	REQUIRED_FIELDS: {
		PROJECT_CREATION: string[]
	}
	HELLO_SIGN: {
		KEY: string
		TEMPLATE_ID: string
		CLIENT_ID: string
	}
	WEB3: {
		CREATE_BLOCKCHAIN_WALLET: string | undefined
		EXECUTE_CONTRACT: string | undefined
		MINT_GTP_META_TRANSACTION: string | undefined
		TRANSFER_GTP_TOKEN: string | undefined
		MINT_VCC_META_TRANSACTION: string | undefined
		GTP_CONTRACT_ADDRESS: string | undefined
		SWAP_META_TRANSACTION: string | undefined
	}
	ADMIN: {
		GET_SUPER_ADMIN: string | undefined
	}
	COIN_GECKO: {
		url: string
		COIN_ID: string
		COIN_QUERY: string
	}
	CIRCLE: {
		CIRCLE_TEST_DATA: boolean | undefined
		ACCOUNT_NUMBER: string | undefined
		ROUTING_NUMBER: string | undefined
		BILLING_CITY: string | undefined
		BILLING_COUNTRY: string | undefined
		BILLING_DISTRICT: string | undefined
		BILLING_LINE1: string | undefined
		POSTAL_CODE: string | undefined
		BANK_COUNTRY: string | undefined
		BANK_DISTRICT: string | undefined
	}
	PUBLIC: {
		GET_PUBLIC_PROJECT_DATA: string | undefined
		GET_PUBLIC_VCC_DATA: string | undefined
	}
	NOTIFICATION: {
		SEND: string
		BULK_SEND: string
		SUBSCRIBE_TOPIC: string
	}
	REDIS_CLUSTER_PATH: string[]
	REDIS_CLUSTER_PASSWORD: string
	REDIS_ENVIRONMENT: string
}
