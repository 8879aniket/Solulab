// get total page count
const getTotalPage = (totalItem, itemPerPage) => Math.ceil(totalItem / itemPerPage)
// get total page count
const getSkipCount = (itemPerPage, pageNumber) => Math.ceil(itemPerPage * pageNumber - itemPerPage)

// get random integer
const getRandomInt = (max) => {
	return Math.floor(Math.random() * Math.floor(max))
}
// Get the Slug for URL
const getSlug = (title) => {
	return title.replace(/\W+/g, '-').toLowerCase()
}

const filterObj = (obj, ...allowedFields) => {
	const newObj = {}
	const string = JSON.stringify(obj)
	const objectValue = JSON.parse(string)
	Object.keys(obj).forEach((el) => {
		// eslint-disable-next-line security/detect-object-injection
		if (el && objectValue[el] !== '' && allowedFields.includes(el)) newObj[el] = obj[el]
	})
	return newObj
}

export { getTotalPage, getSkipCount, getRandomInt, getSlug, filterObj }
