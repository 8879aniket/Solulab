import axios from 'axios'

const fetchGas = async () => {
	const gasPrice = await axios.get('https://gasstation-mumbai.matic.today/v2')
	return gasPrice.data
}
export default fetchGas
