import sgClient from '@sendgrid/client'
import sgMail from '@sendgrid/mail'
import config from '../config/config.js'

sgClient.setApiKey(config.sendgrid.api_key)

sgMail.setApiKey(config.sendgrid.api_key)

export { sgClient, sgMail }
