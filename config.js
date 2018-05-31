module.exports = {
	priceRefreshInterval: "300",  //in seconds (at least 300 recommended longer for a bigger database of channels)
	downloadPath: "./downloads", //the path to where downloads should be stored (eg ./downloads) make sure this file exists
	fileExtension: "mp4",
	logging : {
		databaseConnection: true, //(log when the script connects to the database)
		videoDownloading: true //(log when a video has started downloading and finished, can get quite messy)
	}
}