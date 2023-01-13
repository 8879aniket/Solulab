export default interface ConfigInterface {
	NODE_ENV: string | undefined
	PORT: string | undefined
	AWS: {
		UserName: string | undefined
		Password: string | undefined
		Access_key_ID: string | undefined
		Secret_access_Key: string | undefined
		ACCOUNT_ID: string | undefined
		SQS_QUEUE_REGION: string | undefined
		SQS_QUEUE_URL: string | undefined
		SES_REGION: string
		SES_SOURCE_EMAIL: string
		SES_CC_EMAIL: string
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
	}
	AUTH: {
		GENERATE_TOKEN: string
		VERIFY_TOKEN: string
	}
	PAYMENT: {
		CREATE_USER: string | undefined
		UPDATE_USER: string | undefined
		CREATE_BANK_ACCOUNT: string | undefined
		CREATE_WALLET: string | undefined
		CREATE_ACH_BANK_ACCOUNT: string | undefined
	}
	BACKEND_PLATFORM: {
		UPDATE_PROJECT_TRANSACTION: string | undefined
		CREATE_TOKEN_TRANSACTION: string | undefined
		CREATE_VCC_TOKEN_TRANSACTION: string | undefined
		UPDATE_VCC_TRANSACTION: string | undefined
		CREATE_TOKEN_TRANSACTION_AFTER_SWAP: string | undefined
	}
	WEB3: {
		CREATE_BLOCKCHAIN_WALLET: string | undefined
	}
	CREATE_PASSWORD: {
		FE_CREATE_PASSWORD_URL: string | undefined
	}
	VENLY: {
		VENLY_CLIENT_ID: string | undefined
		VENLY_SECRET_ID: string | undefined
		VENLY_APPLICATION_ID: string | undefined
		VENLY_URL: string | undefined
	}
	BLOCKCHAIN: {
		RPC_SOCKET_URL: string | undefined
		GTP_CONTRACT_ADDRESS: string | undefined
		VCC_CONTRACT_ADDRESS: string | undefined
		SWAP_CONTRACT_ADDRESS: string | undefined
		CHAIN_ID: string | undefined
		BICONOMY_URL: string | undefined
		BICONOMY_DAPP_API_KEY: string | undefined
		BICONOMY_GTP_META_TRANSACTION_API_ID: string | undefined
		BICONOMY_VCC_META_TRANSACTION_API_ID: string | undefined
		BICONOMY_SWAP_META_TRANSACTION_API_ID: string | undefined
	}
}
