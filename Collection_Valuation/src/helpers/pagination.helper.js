const Logger = require('../common/middlewares/logger');
const _ = require('lodash')

const PaginationHelper = {
  Paginate: async (inputs) => {
    try {
      const {
        q,
        model,
        populate = null,
        startIndex: _startIndex = 1,
        itemsPerPage: _itemsPerPage = 10,
        query = {},
        sort = { _id: -1 },
        projection = {},
      } = inputs

      const startIndex = _.isNumber(_startIndex) ? parseInt(_startIndex) : 1
      const itemsPerPage = _.isNumber(_itemsPerPage) ? parseInt(_itemsPerPage) : 10

      const Model = model

      const skipCount = startIndex > 0 ? startIndex - 1 : 0

      const perPage =
        itemsPerPage > 0 ? itemsPerPage : 10

      // Wild card search will be handled by fuzzy-search helper
      if (q) {
        // Get wildcard search query
        const fuzzyQuery = { $text: { $search: q } }
        const fuzzyProjection = { confidence: { $meta: 'textScore' } }
        const fuzzySort = { confidence: { $meta: 'textScore' } }

        Object.assign(query, fuzzyQuery)
        Object.assign(projection, fuzzyProjection)
        Object.assign(sort, fuzzySort)
      }

      const totalItems = await Model.countDocuments(query)

      let items = []
      if (populate) {
        items = await Model.find(query, projection)
          .skip(skipCount)
          .limit(itemsPerPage)
          .sort(sort)
          .populate(populate)
          .lean()
      } else {
        items = await Model.find(query, projection)
          .skip(skipCount)
          .limit(itemsPerPage)
          .sort(sort)
          .lean()
      }

      return {
        totalItems,
        startIndex: skipCount + 1,
        itemsPerPage: perPage,
        items,
      }
    } catch (error) {
      Logger.error(error)
    }

    // On Error Return Null
    return null
  }
}

// All Done
module.exports = PaginationHelper
