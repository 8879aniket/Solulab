export default interface VCCTransactionInterface {
	id: string
	projectId?: number
	userWalletAddress?: string
	projectTokenId?: number
	txHash?: string
	fromWalletAddress?: string
	toWalletAddress?: string
	tokenQuantity?: number
	eventType?: string
	uri?: string
	startIndex?: string
}
