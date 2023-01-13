import User from '@user/user.model'
import Config from '@config/config'
import { Logger } from '@config/logger'
import axios from 'axios'

export function afterCreateHooks(instance: User) {
	Logger.info('Inside beforeCreateDummyModel hooks')
	// this will be called when an instance is created or updated

	//? Updating all the microservice which have dummy User table
	// axios.post(`${Config.SERVICES.AUTH}/api/v1/dummy/user/create`, instance.get()).catch((err) => {
	// 	Logger.error(`${Config.SERVICES.AUTH}: Error`, err)
	// })
	axios.post(`${Config.PAYMENT.CREATE_USER}`, instance.get()).catch((err) => {
		Logger.error(`${Config.PAYMENT.CREATE_USER}: Error`, err)
	})

	axios.post(`${Config.BACKEND_PLATFORM.CREATE_USER}`, instance.get()).catch((err) => {
		Logger.error(`${Config.BACKEND_PLATFORM.CREATE_USER} : Error`, err)
	})

	axios.post(`${Config.ECHO_SERVICE.CREATE_USER}`, instance.get()).catch((err) => {
		Logger.error(`${Config.ECHO_SERVICE.CREATE_USER} : Error`, err)
	})
}

export function afterUpdateHooks(instance: User) {
	Logger.info('Inside updateDummyModel hooks')
	// Will be called if using findOne and update are used together

	//? Creating entry for all the microservice which have dummy Admin table
	// axios
	// 	.put(
	// 		`${Config.SERVICES.AUTH}/api/v1/dummy/user/updateAdmin/${instance.get().id}`,
	// 		instance.get()
	// 	)
	// 	.catch((err) => {
	// 		Logger.error(`${Config.SERVICES.AUTH}: Error`, err)
	// 	})
	axios.put(`${Config.PAYMENT.UPDATE_USER}/${instance.get().id}`, instance.get()).catch((err) => {
		Logger.error(`${Config.PAYMENT.CREATE_USER}: Error`, err)
	})

	axios
		.put(`${Config.BACKEND_PLATFORM.UPDATE_USER}/${instance.get().id}`, instance.get())
		.catch((err) => {
			Logger.error(`${Config.BACKEND_PLATFORM.UPDATE_USER}: Error`, err)
		})

	axios
		.put(`${Config.ECHO_SERVICE.UPDATE_USER}/${instance.get().id}`, instance.get())
		.catch((err) => {
			Logger.error(`${Config.ECHO_SERVICE.UPDATE_USER}: Error`, err)
		})
}
