const express = require('express');
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;
const analyticsDataClient = new BetaAnalyticsDataClient();
const credentialsJSON = process.env.GOOGLE_APPLICATION_CREDENTIALS;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

analyticsDataClient.auth.fromJSON(require(credentialsJSON));
analyticsDataClient.auth.scopes = ["https://www.googleapis.com/auth/analytics.readonly"];

app.post('/fetchGAData', async (req, res) => {
  const { startDate, endDate, propertyID } = req.body;
  await analyticsDataClient.auth.getClient();
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [
      { name: "sessions" },
      { name: "engagedSessions" },
      { name: "transactions" },
      { name: "checkouts" },
      { name: "addToCarts" },
      { name: "purchaseRevenue" },
    ],
  });

  const records = response.rows.map((row) => {
    let record = {};
    row.dimensionValues.forEach((dim, index) => {
      record[response.dimensionHeaders[index].name] = dim.value;
    });
    row.metricValues.forEach((met, index) => {
      record[response.metricHeaders[index].name] = met.value;
    });
    return record;
  });

  res.json(records);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
