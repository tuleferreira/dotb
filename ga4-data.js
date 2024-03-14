const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const analyticsDataClient = new BetaAnalyticsDataClient();

const propertyId = "344874357";
const credentialsJSON = "./credentials.json";

async function fetchGAData() {
  // Autentica com a API
  analyticsDataClient.auth.fromJSON(require(credentialsJSON));
  analyticsDataClient.auth.scopes = [
    "https://www.googleapis.com/auth/analytics.readonly",
  ];
  await analyticsDataClient.auth.getClient();

  // Configura os parâmetros da requisição
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      {
        startDate: "2023-01-01",
        endDate: "today",
      },
    ],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [
      { name: "sessions" },
      { name: "engagedSessions" },
      { name: "transactions" },
      { name: "checkouts" },
      { name: "addToCarts" },
      { name: "purchaseRevenue" },
    ],
    // dimensionFilter: {
    //   andGroup: {
    //     expressions: [
    //       {
    //         filter: {
    //           fieldName: "sessionMedium",
    //           stringFilter: {
    //             matchType: "EXACT",
    //             value: "youtube", //replace
    //           },
    //         },
    //       },
    //       {
    //         filter: {
    //           fieldName: "sessionSource",
    //           stringFilter: {
    //             matchType: "EXACT",
    //             value: "social", //replace
    //           },
    //         },
    //       },
    //     ],
    //   },
    // },
  });

  console.log("Relatório GA4:");
  const records = response.rows.map((row) => {
    let record = {};
    row.dimensionValues.forEach((dim, index) => {
      if (response.dimensionHeaders[index].name === "sessionMedium" && dim.value === "referral") {return}
      record[response.dimensionHeaders[index].name] = dim.value;
    });
    row.metricValues.forEach((met, index) => {
      record[response.metricHeaders[index].name] = met.value;
    });
    return record;
  });
  console.log(records);
  return records;
}

function calculateTotals(data) {
    const totals = {
        purchaseRevenue: 0,
        transactions: 0,
        sessions: 0,
    };
    
    data.forEach(row => {
        totals.purchaseRevenue += parseFloat(row.purchaseRevenue);
        totals.transactions += parseInt(row.transactions, 10);
        totals.sessions += parseInt(row.sessions, 10);
    });

    return totals;
}


module.exports = {fetchGAData}