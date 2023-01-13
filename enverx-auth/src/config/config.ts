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
		ADMIN: 'http://localhost:4002', // Admin microservrice url
	},
	JWT: {
		JWT_SECRET: process.env.JWT_SECRET,
		JWT_EXPIRE: process.env.JWT_EXPIRES_IN,
		JWT_REMEMBERME_EXPIRES_IN: process.env.JWT_REMEMBERME_EXPIRES_IN
	}
}

export default Config
