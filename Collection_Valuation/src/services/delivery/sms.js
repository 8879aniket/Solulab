const twilio = require('twilio');
const { accountSid, authToken, fromNumber } = require('../../config/config').twilio;

const client = twilio(accountSid, authToken);


module.exports = async ({ metadata, deliveryInfo: { sms } }) => {
    await client.messages.create({ body: metadata.body, from: fromNumber, to: sms }).then(message => message);
};
