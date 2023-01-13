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
		ADMIN: string | undefined
	}
	JWT: {
		JWT_SECRET: string | undefined
		JWT_EXPIRE: string | undefined
		JWT_REMEMBERME_EXPIRES_IN: string | undefined
	}
}
