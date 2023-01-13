import moment from 'moment'

const getCurrentDateTime = () => {
	return moment().toISOString()
}

const dateToIso = (date) => {
	return moment(date).toISOString()
}

const daysBetweenToDates = (startDate, endDate) => {
	const date1 = new Date(startDate)
	const date2 = new Date(endDate)
	const differenceInTime = date2.getTime() - date1.getTime()
	const differenceInDays = differenceInTime / (1000 * 3600 * 24)
	return differenceInDays
}

const getDatesBetweenDays = (daysDiff, endDate) => {
	// Test Cases Done
	const date = new Date(endDate)
	date.setDate(date.getDate() - daysDiff)
	return date
}

const getAddMonthsInDate = (month) => {
	return new Date(new Date().setMonth(new Date().getMonth() + month)) // Test Cases Done
}

const getSubtractMonthsInDate = (month) => {
	return new Date(new Date().setMonth(new Date().getMonth() - month)) // Test Cases Done
}

const addDaysInDate = (days) => {
	return moment(moment().toISOString()).add(days, 'days').toISOString() // Test Cases Done
}

export {
	getCurrentDateTime,
	dateToIso,
	daysBetweenToDates,
	getDatesBetweenDays,
	getAddMonthsInDate,
	addDaysInDate,
	getSubtractMonthsInDate,
}
