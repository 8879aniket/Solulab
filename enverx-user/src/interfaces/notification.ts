export interface NotificationInterface {
	id: string
	title: string
	body: string
	redirectionId?: string
	notificationType?: string
	isRead?: boolean
	userId: string
}
