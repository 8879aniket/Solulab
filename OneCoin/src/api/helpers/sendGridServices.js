import config from '../config/config.js'
import { sgClient, sgMail } from './sendgridConfig.js'

const addContactToList = async (email, listID) => {
	const data = {
		list_ids: [listID],
		contacts: [
			{
				email,
			},
		],
	}
	const request = {
		url: `/v3/marketing/contacts`,
		method: 'PUT',
		body: data,
	}
	return sgClient.request(request)
}

const getListID = async (listName) => {
	const request = {
		url: `/v3/marketing/lists`,
		method: 'GET',
	}
	const response = await sgClient.request(request)
	const allLists = response[1].result
	return allLists.find((x) => x.name === listName).id
}

const getContactByEmail = async (email) => {
	const data = {
		emails: [email],
	}
	const request = {
		url: `/v3/marketing/contacts/search/emails`,
		method: 'POST',
		body: data,
	}
	const response = await sgClient.request(request)
	// eslint-disable-next-line security/detect-object-injection
	if (response[1].result[email]) return response[1].result[email].contact
	return null
}

const deleteContactFromList = async (listID, contact) => {
	const request = {
		url: `/v3/marketing/lists/${listID}/contacts`,
		method: 'DELETE',
		qs: {
			contact_ids: contact.id,
		},
	}
	await sgClient.request(request)
}

const sendNewsletterToList = async (headers, protocol, body, htmlNewsletter, listID) => {
	const data = {
		query: `CONTAINS(list_ids, '${listID}')`,
	}

	const request = {
		url: `/v3/marketing/contacts/search`,
		method: 'POST',
		body: data,
	}

	const response = await sgClient.request(request)
	// eslint-disable-next-line no-restricted-syntax
	for (const subscriber of response[1].result) {
		const params = new URLSearchParams({
			email: subscriber.email,
		})
		const unsubscribeURL = `${protocol}://${headers.host}/api/v1/user/unsubscribeNewsletter?${params}`
		const msg = {
			to: subscriber.email,
			from: config.sendgrid.mail, // Change to your verified sender
			subject: body.subject,
			html: `${htmlNewsletter}<a href="${unsubscribeURL}"> Unsubscribe here</a>`,
		}
		sgMail.send(msg)
	}
}

export {
	addContactToList,
	getListID,
	getContactByEmail,
	deleteContactFromList,
	sendNewsletterToList,
}
