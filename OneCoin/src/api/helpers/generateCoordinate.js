import Blockchain from '../components/fragment/blockchainModel.js'
import Coordinate from '../components/fragment/coordinateModel.js'
import logger from '../config/logger.js'

const generateCoordinate = async () => {
	const coordinateArray = []
	let position = 1
	for (let i = 0; i < 50; i++) {
		for (let j = 0; j < 50; j++) {
			for (let k = 0; k < 50; k++) {
				coordinateArray.push({ x: i + 1, y: j + 1, z: k + 1, position })
				position++
			}
		}
	}
	await Coordinate.insertMany(coordinateArray)
	return coordinateArray
}

const updateCoordinate = async (x, y, z) => {
	try {
		logger.info('updateCoordinate Function ')
		const MintData = await Blockchain.findOne()
		const coordinate = await Coordinate.find().sort({ position: -1 }).limit(1)
		if (!coordinate.length) {
			logger.info('coordinate not found')
		}
		const coordinateArray = coordinate[0]
		// eslint-disable-next-line prefer-const
		let swapCords = await Coordinate.findOne({ x, y, z })
		if (!swapCords) {
			logger.info('Swap Cords not found')
		}
		const testData = {
			x: coordinateArray.x,
			y: coordinateArray.y,
			z: coordinateArray.z,
		}
		await Coordinate.findOneAndUpdate(
			{ x: coordinateArray.x, y: coordinateArray.y, z: coordinateArray.z },
			{ x: swapCords.x, y: swapCords.y, z: swapCords.z }
		)
		swapCords.x = testData.x
		swapCords.y = testData.y
		swapCords.z = testData.z
		await swapCords.save()
		MintData.lastMintedFragment = swapCords.position
		await MintData.save()
		await Coordinate.findOneAndDelete({
			position: coordinateArray.position,
		})
	} catch (err) {
		logger.error(err)
	}
}

const addCoordinates = async (lastPosition) => {
	try {
		// const MintData = await Blockchain.findOne()
		// let lastUsedIndex = MintData.lastMintedFragment
		let lastUsedIndex = lastPosition
		const countDocs = await Coordinate.countDocuments()
		const lastUsedCoordinate = await Coordinate.findOne({ position: lastUsedIndex })
		let index = true
		let swapData
		while (index) {
			let swapIndex = Math.floor(Math.random() * 1000) + (lastUsedIndex - 500) // this is done to find in 1000 range for lastUsedIndex
			const randomIndex = Math.round(Math.random() * 10) - 5 // -5 to 5
			swapIndex += randomIndex
			// eslint-disable-next-line no-await-in-loop
			swapData = await Coordinate.findOne({ position: swapIndex })
			if (swapIndex <= countDocs) {
				if (lastUsedIndex === -500000) {
					lastUsedIndex = swapIndex
					index = false
					if (!swapData) {
						logger.info('Swap Data not found')
						index = true
					}
					// updateCoordinate(swapData.x, swapData.y, swapData.z)
				} else if (
					lastUsedIndex - swapIndex <= 5 &&
					lastUsedIndex - swapIndex >= -5 &&
					lastUsedCoordinate.x - swapData.x <= 5 &&
					lastUsedCoordinate.x - swapData.x >= -5 &&
					lastUsedCoordinate.y - swapData.y <= 5 &&
					lastUsedCoordinate.y - swapData.y >= -5 &&
					lastUsedCoordinate.z - swapData.z <= 5 &&
					lastUsedCoordinate.z - swapData.z >= -5
				) {
					index = false
					if (!swapData) {
						logger.info('Swap Data not found')
						index = true
					}
					// updateCoordinate(swapData.x, swapData.y, swapData.z)
				}
			}
		}
		return swapData
	} catch (err) {
		logger.error(err)
	}
}

const newAddCoordinates = async (lastPosition) => {
	try {
		// eslint-disable-next-line eqeqeq
		if (lastPosition == -500000) {
			lastPosition = Math.round(Math.random() * 125000) + 1
		}
		let lastUsedIndex = lastPosition
		const countDocs = await Coordinate.countDocuments()
		const lastUsedCoordinate = await Coordinate.findOne({ position: lastUsedIndex })
		let index = true
		let swapData
		while (index) {
			const xIndex = Math.round(Math.random() * 10) + (lastUsedCoordinate.x - 5)
			const yIndex = Math.round(Math.random() * 10) + (lastUsedCoordinate.y - 5)
			const zIndex = Math.round(Math.random() * 10) + (lastUsedCoordinate.z - 5)
			const swapIndex = {
				x: xIndex,
				y: yIndex,
				z: zIndex,
			}
			// eslint-disable-next-line no-await-in-loop
			swapData = await Coordinate.findOne(swapIndex)
			if (!swapData) {
				// eslint-disable-next-line no-continue
				continue
			}
			if (lastUsedCoordinate.position <= countDocs) {
				if (lastUsedIndex === -500000) {
					lastUsedIndex = swapIndex
					index = false
					if (!swapData) {
						logger.info('Swap Data not found')
						index = true
					}
					// updateCoordinate(swapData.x, swapData.y, swapData.z)
				} else if (
					lastUsedCoordinate.x - swapData.x <= 5 &&
					lastUsedCoordinate.x - swapData.x >= -5 &&
					lastUsedCoordinate.y - swapData.y <= 5 &&
					lastUsedCoordinate.y - swapData.y >= -5 &&
					lastUsedCoordinate.z - swapData.z <= 5 &&
					lastUsedCoordinate.z - swapData.z >= -5
				) {
					index = false
					if (!swapData) {
						logger.info('Swap Data not found')
						index = true
					}
					// updateCoordinate(swapData.x, swapData.y, swapData.z)
				}
			}
		}
		return swapData
	} catch (err) {
		logger.error(err)
	}
}

export { generateCoordinate, addCoordinates, updateCoordinate, newAddCoordinates }
