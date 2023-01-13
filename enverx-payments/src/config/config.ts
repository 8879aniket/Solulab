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
		USER: 'http://localhost:4003', // User microservrice url
		AUTH: 'http://localhost:4001', // Auth microservrice url
	},
	CIRCLE: {
		CIRCLE_SANDBOX_AUTH_TOKEN: process.env.CIRCLE_SANDBOX_AUTH_TOKEN,
		CIRCLE_SANDBOX_URL: process.env.CIRCLE_SANDBOX_URL,
		CIRCLE_PRODUCTION_URL: process.env.CIRCLE_PRODUCTION_URL,
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
	PLAID: {
		PLAID_ENV_PROD: process.env.PLAID_ENV_PROD,
		PLAID_ENV_DEV: process.env.PLAID_ENV_DEV,
		PLAID_ENV: process.env.PLAID_ENV,
		PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID,
		PLAID_SECRET: process.env.PLAID_SECRET,
		PLAID_ENV_SANDBOX: process.env.PLAID_ENV_SANDBOX,
	},
	AUTH: {
		GENERATE_TOKEN: `${process.env.SERVICES_AUTH_URL!}/api/v1/auth/generateToken`,
		VERIFY_TOKEN: `${process.env.SERVICES_AUTH_URL!}/api/v1/auth/verifyToken`,
	},
	USER: {
		UPDATE_BANK_ACCOUNT: `${process.env.SERVICES_USER_URL}/api/v1/user/updateBankDetail`,
		UPDATE_ACH_BANK_ACCOUNT: `${process.env.SERVICES_USER_URL}/api/v1/user/updateACHBankDetail`,
	},
	ADMIN: {
		UPDATE_BANK_ACCOUNT: `${process.env.SERVICES_ADMIN_URL}/api/v1/admin/updateBankDetail`,
		UPDATE_ACH_BANK_ACCOUNT: `${process.env.SERVICES_ADMIN_URL}/api/v1/admin/updateACHBankDetail`,
		GET_PLATFORM_VARIABLE: `${process.env.SERVICES_ADMIN_URL}/api/v1/platformVariable/getPlatformVariable`,
	},
}

export default Config
