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
	FIREBASE: {
		SERVICE_ACCOUNT: Object
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
		CAXTON: {
			USER_ONBOARDING: string | undefined
			USER_LOGIN: string | undefined
		}
	}
	WEB3: {
		CREATE_BLOCKCHAIN_WALLET: string | undefined
	}
	CREATE_PASSWORD: {
		FE_CREATE_PASSWORD_URL: string | undefined
	}
	BACKEND_PLATFORM: {
		CREATE_USER: string | undefined
		UPDATE_USER: string | undefined
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
	ECHO_SERVICE: {
		CREATE_USER: string | undefined
		UPDATE_USER: string | undefined
	}
	NOTIFICATION: {
		SEND: string
		BULK_SEND: string
		SUBSCRIBE_TOPIC: string
		UNSUBSCRIBE_TOPIC: string
	}
	FE_EMAIL_VERIFICATION_URL: string | undefined
}
