const Model = require('../models/userModel');
const { ObjectId } = require('mongoose').Types;
const config = require('../config/config');

var axios = require('axios');
var truliooApiKey = config.trulioo.apiKey;
var truliooUrl = config.trulioo.url;
var truliooMode = config.trulioo.mode;
var truliooConfigurationName = config.trulioo.configurationName;
const instance = axios.create();
instance.defaults.headers.common['x-trulioo-api-key'] = truliooApiKey;

module.exports.getConsents = async () => {
    try {
        const response = await instance.get(truliooUrl + `/configuration/v1/consents/${truliooConfigurationName}/AU`);
        if(response.status == 200) {
            return response.data
        }
    } catch (error) {
        throw error;
    }
};

module.exports.getCountryCodes = async () => {
    try {
        const response = await instance.get(truliooUrl + `/configuration/v1/countrycodes/${truliooConfigurationName}`);
        if(response.status == 200) {
            return response.data
        }
    } catch (error) {
        throw error;
    }
};


