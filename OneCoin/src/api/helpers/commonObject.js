// eslint-disable-next-line import/no-named-default
import { default as common, CustomChain } from '@ethereumjs/common'

const Common = common.default

const ethCommon = {
	PolygonMumbai: Common.custom(CustomChain.PolygonMumbai),

	// PolygonMainnet: Common.custom({ chainId: 1234 }),
}

export default ethCommon
