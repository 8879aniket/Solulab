export interface TransactionInterface {
	id: string
	transaction_id?: string
	transaction_type?: 'TRANSFER' | 'PAYMENT' | 'PAYOUT' | 'DEPOSIT_TRANSFER'
	tracking_ref?: string
	source_wallet_type?: string
	source_wallet_id?: string
	destination_wallet_type?: string
	destination_wallet_id?: string
	amount: number
	amountRecived?: number
	currency: string
	status: string
	internalStatus: string
	bankName?: string
	tokenTransferedStatus?: string
	// isInvestmentSuccess?: boolean
	// investmentTransactionHash?: string
	userId?: string
}
