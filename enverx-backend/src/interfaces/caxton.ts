interface CaxtonDefaultInterface {
	userEmail: string
	password: string
	userAPIToken: string
	userTokenExpire: string
	deviceId: string
	device: string
	operatingSystem: string
}

export interface PotInterface extends CaxtonDefaultInterface {
	currency: string
}

export interface CreateCurrencyPotInterface extends PotInterface {
	potPrefix: string
}

export interface MainPotBalanceInterface extends PotInterface {}

export interface CurrencyPotBalanceInterface extends CreateCurrencyPotInterface {}

export interface PotTransferInterface extends CaxtonDefaultInterface {}
export interface GetAllCurrencyPotBalance {
	userEmail: string
	password: string
	userAPIToken: string
	userTokenExpire: string
	deviceId: string
	device: string
	operatingSystem: string
}

export interface PotTransferInterface {
	userEmail: string
	password: string
	userAPIToken: string
	userTokenExpire: string
	deviceId: string
	device: string
	operatingSystem: string
	fromCurrencyPot: string
	toCurrencyPot: string
	amount: number
	projectId: number
	projectTitle: string
}

export interface AccountTransferInterface extends CaxtonDefaultInterface {
	caxtonUserId: string
	sendCurrency: string
	amount: number
	projectId: number
	projectTitle: string
}

export interface PotBalanceResponseInterface {
	Balance: number
	CcyCode: string
	BaseCcyCode: string
	Description: string
	NumericCode: string
	AlphabeticCode: string
	Symbol: string
	caxtonExpireDate: string
	caxtonUserApiToken: string
}
