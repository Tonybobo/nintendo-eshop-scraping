require('dotenv').config;
const {
	getGamesAmerica,
	getGamesEurope,
	getGamesJapan
} = require('nintendo-switch-eshop');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 15);
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.URL;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1
});

exports.scrapeGame = async (req, res) => {
	await client.connect();
	const db = client.db('eshop');
	const collection = db.collection('games');
	console.log('db connected');
	try {
		const gamesAmerica = await getGamesAmerica();
		const americaGames = gamesAmerica.map(async (item) => {
			const result = await collection.findOneAndUpdate(
				{ id: item.objectID },
				{
					$set: {
						title: item.title,
						description: item.description,
						msrp: item.msrp,
						publishers: item.publishers.join(),
						currentPrice: item.salePrice,
						lowestPrice: item.lowestPrice,
						imageUrl: item.boxart,
						releaseDate: item.releaseDateDisplay,
						currency: 'usd'
					}
				},
				{ upsert: true }
			);
		});

		const gamesEurope = await getGamesEurope();
		const europeGames = gamesEurope.map(async (item) => {
			const result = await collection.findOneAndUpdate(
				{ id: item.fs_id },
				{
					$set: {
						title: item.title,
						description: item.product_catalog_description_s,
						msrp: item.price_regular_f,
						publishers: item.publisher,
						currentPrice: item.price_lowest_f,
						lowestPrice: item.price_lowest_f,
						imageUrl: item.image_url,
						releaseDate: item.dates_released_dts,
						currency: 'euro'
					}
				},
				{ upsert: true }
			);
		});

		const gamesJapan = await getGamesJapan();
		const japanGames = gamesJapan.map(async (item) => {
			const result = await collection.findOneAndUpdate(
				{ title: item.TitleName, imageUrl: item.ScreenshotImgURL },
				{
					$set: {
						id: nanoid(),
						description: null,
						msrp: parseInt(item.Price.replace('円(税込)', '')),
						publishers: item.MakerName,
						currentPrice: parseInt(item.Price.replace('円(税込)', '')),
						lowestPrice: null,
						releaseDate: item.Price,
						currency: 'yen'
					}
				},
				{ upsert: true }
			);
		});
		console.log('data posted');
		res.send('function executed');
	} catch (error) {
		console.log(error);
	}
};
