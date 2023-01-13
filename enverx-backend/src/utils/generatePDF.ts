import pdf from 'html-pdf'
import { Logger } from '@config/logger'
import Projects from '@projects/projects.model'
import template from '@helpers/projectTemplate'

const generatePDF = async (projectId: number): Promise<Buffer> => {
	Logger.info('Inside generete PDF')
	{
		const projectDetails = await Projects.findByPk(projectId)

		const htmlTemplate = template(projectDetails!)
		return new Promise((resolve, reject) => {
			if (!htmlTemplate) {
				reject(new Error('html template is required'))
			}
			const pdfPromise = pdf.create(htmlTemplate, { format: 'Letter' })

			pdfPromise.toBuffer((err, buff) => {
				if (!err) resolve(buff)
				else reject(err)
			})
		})
	}
}

export default generatePDF
