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
	}
	CIRCLE: {
		CIRCLE_SANDBOX_AUTH_TOKEN: string | undefined
		CIRCLE_SANDBOX_URL: string | undefined
		CIRCLE_PRODUCTION_URL: string | undefined
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
	PLAID: {
		PLAID_ENV_PROD: string | undefined
		PLAID_ENV_DEV: string | undefined
		PLAID_ENV: string | undefined
		PLAID_CLIENT_ID: string | undefined
		PLAID_SECRET: string | undefined
		PLAID_ENV_SANDBOX: string | undefined
	}
	AUTH: {
		GENERATE_TOKEN: string
		VERIFY_TOKEN: string
	}
	USER: {
		UPDATE_BANK_ACCOUNT: string | undefined
		UPDATE_ACH_BANK_ACCOUNT: string | undefined
	}
	ADMIN: {
		UPDATE_BANK_ACCOUNT: string | undefined
		UPDATE_ACH_BANK_ACCOUNT: string | undefined
		GET_PLATFORM_VARIABLE: string | undefined
	}
}
