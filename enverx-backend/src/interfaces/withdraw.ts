export default interface WithdrawInterface {
	id: string
	requestAmount: number
	dateOfRequest: Date
	withdrawDocuments?: string[]
	withdrawReason?: string
	requestStatus: 'PENDING' | 'APPROVED' | 'REJECT'
	rejectTitle?: string
	rejectReason?: string
	receivedDate?: Date
	receivedAmount?: number
	projectId: number
	userId: string
	projectWalletId: string
	userWalletId: string
}
