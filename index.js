const {fetchGAData} = require('./ga4-data')
const {writeCSV} = require('./generate-csv')

fetchGAData()
  .then(writeCSV)
  .then(() => console.log("CSV file was written successfully"))
  .catch(console.error);
