import { Logger } from '@config/logger'
import helloSign from 'hellosign-sdk'
import Config from '@config/config'

const hellosign = new helloSign({ key: Config.HELLO_SIGN.KEY })

interface payload { email: string, name: string }

const createSignature = async (data: payload) => {
    const opts = {
        test_mode: 1,
        clientId: Config.HELLO_SIGN.CLIENT_ID,
        template_id: Config.HELLO_SIGN.TEMPLATE_ID,
        signers: [{
            email_address: data.email,
            name: data.name,
            role: 'User'
        }],

    }

    const res = await hellosign.signatureRequest.createEmbeddedWithTemplate(
        opts
    )
    if (!res) {
        return false
    }
    return res
}

export const createSignUrl = async (input: payload) => {
    Logger.info('Inside createSignUrl helloSign helper')

    const data = await createSignature(input)
    if (!data) {
        return false
    }
    const signature = data.signature_request.signatures[0]
    const signatureId = signature.signature_id

    const response = await hellosign.embedded.getSignUrl(signatureId)
    if (!response) {
        return false
    }
    return { url: response.embedded.sign_url, signatureId: data.signature_request.signature_request_id }
}

export const downloadDoc = async (signatureRequestId: string) => {
    const doc = await hellosign.signatureRequest.download(signatureRequestId, { file_type: 'pdf', get_data_uri: true })
    const file = Buffer.from(doc.data_uri.split(',')[1], 'base64')
    return file
}