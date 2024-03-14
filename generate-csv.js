const { createObjectCsvWriter } = require('csv-writer');

async function writeCSV(records) {
  const csvWriter = createObjectCsvWriter({
    path: "ga_data.csv",
    header: [
      // Cabeçalhos
      { id: "sessionSource", title: "Source" },
      { id: "sessionMedium", title: "Medium" }
    ],
  });

  await csvWriter.writeRecords(records);
}

module.exports = {writeCSV}
