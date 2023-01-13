const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const _ = require('lodash')

const ObjectIdValidationHelper = {
  Validate: async (inputs) => {
    try {
      const objectIds = inputs
      const keys = Object.keys(inputs)

      const valid = {}
      const invalid = {}
      let hasInvalid = false

      for (let index = 0; index < keys.length; index++) {
        const checkAlias = keys[index].split('|')

        const key = checkAlias.length > 1 ? checkAlias[0] : keys[index]
        const alias = checkAlias.length > 1 ? checkAlias[1] : keys[index]
        const objectId = objectIds[keys[index]]

        // Handle if the data is an array
        if (Array.isArray(objectId)) {
          const validObjectIds = []
          const invalidObjectIds = []
          for (let i = 0; i < objectId.length; i++) {
            const subObject = objectId[i]

            if (ObjectId.isValid(subObject.toString())) {
              // If string is a valid mongo id string
              const documentCount = await ObjectIdValidationHelper.checkIfExistsInDatabase(
                key,
                subObject
              )
              if (_.isNumber(documentCount)) {
                if (documentCount > 0) {
                  validObjectIds.push(subObject)
                } else {
                  invalidObjectIds.push(subObject)
                  hasInvalid = true
                }
              } else {
                validObjectIds.push(subObject)
              }
            } else {
              invalidObjectIds.push(subObject)
              hasInvalid = true
            }
          }

          if (validObjectIds.length) {
            valid[alias] = validObjectIds
          }
          if (invalidObjectIds.length) {
            invalid[alias] = invalidObjectIds
          }
        } else {
          if (ObjectId.isValid(objectId.toString())) {
            const documentCount = await ObjectIdValidationHelper.checkIfExistsInDatabase(
              key,
              objectId
            )
            if (_.isNumber(documentCount)) {
              if (documentCount > 0) {
                valid[alias] = objectId
              } else {
                invalid[alias] = objectId
                hasInvalid = true
              }
            } else {
              valid[alias] = objectId
            }
          } else {
            invalid[alias] = objectId
            hasInvalid = true
          }
        }
      }
      return { valid, invalid, hasInvalid }
    } catch (error) {
      Logger.error(error)
    }
    // On Error Return Null
    return null
  },

  checkIfExistsInDatabase: (key, value) => {
    try {
      let Model = null
      let model = null
      if (key.charAt(0) === '_') {
        model = _.capitalize(key.substr(1))
      } else {
        return null
      }


      Model = eval(`App.Models.${model}`)

      let valueInArray = null

      if (_.isArray(value)) {
        valueInArray = value
      } else {
        valueInArray = [value]
      }

      if (Model) {
        const documentCount = await Model.countDocuments({
          _id: { $in: valueInArray },
        })

        return documentCount
      }
    } catch (error) {
      Logger.error(error)
    }
    // On Error Return Null
    return null
  }
}

// All Done
module.exports = ObjectIdValidationHelper
