class APIFeatures {
	constructor(query, queryString) {
		this.query = query
		this.queryString = queryString
	}

	filter() {
		const queryObj = { ...this.queryString }
		const excludedFields = ['page', 'sort', 'limit', 'fields', 'sortOrder']
		// eslint-disable-next-line security/detect-object-injection
		excludedFields.forEach((el) => delete queryObj[el])

		// 1B) Advanced filtering
		let queryStr = JSON.stringify(queryObj)
		queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)
		queryStr = JSON.parse(queryStr)
		// for search
		if (this.queryString.searchKey && this.queryString.searchValue) {
			// eslint-disable-next-line security/detect-non-literal-regexp
			queryStr[this.queryString.searchKey] = new RegExp(this.queryString.searchValue, 'gi')
		}
		this.query = this.query.find(queryStr)

		return this
	}

	sort() {
		if (this.queryString.sort) {
			const sortBy = this.queryString.sort.split(',').join(' ')
			this.query = this.query.sort(sortBy)
		} else {
			this.query = this.query.sort('-createdAt')
		}

		return this
	}

	limitFields() {
		if (this.queryString.fields) {
			const fields = this.queryString.fields.split(',').join(' ')
			this.query = this.query.select(fields)
		} else {
			this.query = this.query.select('-__v')
		}

		return this
	}

	paginate() {
		const page = this.queryString.page * 1 || 1
		const limit = this.queryString.limit * 1 || 100
		const skip = (page - 1) * limit

		this.query = this.query.skip(skip).limit(limit)

		return this
	}
}
export default APIFeatures
