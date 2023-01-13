const nodemailer = require("nodemailer");
const Logger = require('../../common/middlewares/logger')
const {
  host,
  port,
  secure,
  auth,
} = require('../../config/config').emailSettings;
const templates = require('./templates');

let transporter = nodemailer.createTransport({
  // host,
  // port,
  // secure,
  service: "Mailjet",
  auth: {
    user: auth.user,
    pass: auth.pass,
  },
});


module.exports = async ({
  deliveryInfo: { email }, notificationType, metadata, from, _id: notificationId,
}) => {
  try {
    if (!email || !from) return true;
    const msg = {
      to: email,
      from,
      subject: metadata.subject || notificationType,
      html: templates[notificationType.toString()].email({ ...metadata, notificationId }),
    };


    let body = await transporter.sendMail(msg);    
    return body;
  } catch (error) {
    Logger.error(error)
    Logger.error("Failed to send mail. Check the the email configuration.")
  }
};
