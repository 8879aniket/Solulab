var AWS = require('aws-sdk');
const { S3: { ACCESSKEYID, SECRETACCESSKEY } } = require('../../config/config');
// Set the region 
AWS.config.update({
  region: 'us-east-2',
  accessKeyId: ACCESSKEYID,
  secretAccessKey: SECRETACCESSKEY,
});
const templates = require('./templates');

module.exports = async ({
  deliveryInfo: { email }, notificationType, metadata, from, _id: notificationId,
}) => {
  try {
    // Create sendTemplatedEmail params 
    var params = {
      Destination: {
        ToAddresses: [
          email,
          /* more To email addresses */
        ]
      },
      Source: 'collectionscanner360@gmail.com', /* required */
      Message: { /* required */
        Body: { /* required */
          Html: {
            Charset: "UTF-8",
            Data: templates[notificationType.toString()].email({ ...metadata, notificationId }),
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: metadata.subject || notificationType
        }
      }
    };


    // Create the promise and SES service object
    var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

    // Handle promise's fulfilled/rejected states
    sendPromise.then(
      function (data) {
        
      }).catch(
        function (err) {
          console.error(err, err.stack);
        });

  } catch (error) {
    throw error;
  }
};
