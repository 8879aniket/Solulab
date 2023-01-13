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
	},
	BACKEND_PLATFORM: {
		UPDATE_PROJECT_TRANSACTION: `${process.env.SERVICES_BACKEND_PLATFORM_URL}/api/v1/projects/updateProjectTransaction`,
		CREATE_TOKEN_TRANSACTION: `${process.env.SERVICES_BACKEND_PLATFORM_URL}/api/v1/projects/createTokenTransaction`,
		CREATE_VCC_TOKEN_TRANSACTION: `${process.env.SERVICES_BACKEND_PLATFORM_URL}/api/v1/projects/createVCCTokenTransaction`,
		UPDATE_VCC_TRANSACTION: `${process.env.SERVICES_BACKEND_PLATFORM_URL}/api/v1/projects/updateSeedVCCCredits`,
		CREATE_TOKEN_TRANSACTION_AFTER_SWAP: `${process.env.SERVICES_BACKEND_PLATFORM_URL}/api/v1/projects/createTokenTransactionAfterSwap`,
	},
	WEB3: {
		CREATE_BLOCKCHAIN_WALLET: `${process.env.SERVICES_WEB3_URL}/api/v1/venly/createBlockchainWallet`,
	},
	CREATE_PASSWORD: {
		FE_CREATE_PASSWORD_URL: process.env.FE_CREATE_PASSWORD,
	},
	VENLY: {
		VENLY_CLIENT_ID: process.env.VENLY_CLIENT_ID,
		VENLY_SECRET_ID: process.env.VENLY_SECRET_ID,
		VENLY_APPLICATION_ID: process.env.VENLY_APPLICATION_ID,
		VENLY_URL: process.env.VENLY_URL,
	},
	BLOCKCHAIN: {
		RPC_SOCKET_URL: process.env.RPC_SOCKET_URL,
		GTP_CONTRACT_ADDRESS: process.env.GTP_CONTRACT_ADDRESS,
		VCC_CONTRACT_ADDRESS: process.env.VCC_CONTRACT_ADDRESS,
		SWAP_CONTRACT_ADDRESS: process.env.SWAP_CONTRACT_ADDRESS,
		CHAIN_ID: process.env.CHAIN_ID,
		BICONOMY_URL: process.env.BICONOMY_URL,
		BICONOMY_DAPP_API_KEY: process.env.BICONOMY_DAPP_API_KEY,
		BICONOMY_GTP_META_TRANSACTION_API_ID: process.env.BICONOMY_GTP_META_TRANSACTION_API_ID,
		BICONOMY_VCC_META_TRANSACTION_API_ID: process.env.BICONOMY_VCC_META_TRANSACTION_API_ID,
		BICONOMY_SWAP_META_TRANSACTION_API_ID: process.env.BICONOMY_SWAP_META_TRANSACTION_API_ID,
	},
}

export default Config
