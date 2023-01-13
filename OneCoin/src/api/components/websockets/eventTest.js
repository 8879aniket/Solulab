// import Web3 from 'web3'
// import fs from 'fs'
// import path from 'path'
// import { fileURLToPath } from 'url'
// import HDWalletProvider from '@truffle/hdwallet-provider'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
// // import mintNFT from '../../../artifacts/contracts/MintNFT.sol/MintNFT.json'

// const privateKey = 'a91dc609634962d2316d3b6f01ce4ebcc6a0fe19b36c8ba5ce76f34bec7c8ac5'

// const provider = new HDWalletProvider(
// 	privateKey,
// 	'https://polygon-mumbai.g.alchemy.com/v2/4B0n1rUOeiQ1ZeMFGx89YD6ABprr2VPc'
// )

// // "Web3.providers.givenProvider" will be set if in an Ethereum supported browser.
// const web3 = new Web3(provider)

// web3.eth.defaultAccount = '0xB7D2FFB669a4F39d81aaF1E6A53708206C9b5795'

// // console.log(`${__dirname}/../../../artifacts/contracts/MintNFT.sol/MintNFT.json`)

// const mintNFT = JSON.parse(
// 	// eslint-disable-next-line security/detect-non-literal-fs-filename
// 	fs.readFileSync(`${__dirname}/../../../artifacts/contracts/MintNFT.sol/MintNFT.json`)
// )

// const contractData = new web3.eth.Contract(
// 	mintNFT.abi,
// 	'0x43633daf51b7020894C18e8AABc77adF0acbB2fA'
// )

// const mint = async () => {
// 	web3.eth.getBalance(web3.eth.defaultAccount).then((data) => {
// 		console.log('Balance', data)
// 	})
// 	const returndata = await contractData.methods
// 		.mint(web3.eth.defaultAccount, 'Test Data', [1], [2], [5])
// 		.send({ from: web3.eth.defaultAccount })

// 	return returndata

// 	// console.log('Balance', web3.eth.getBalance('0x634552A7923200159d5D4f72c2BA916130F73Ad6'))
// }

// export default mint
