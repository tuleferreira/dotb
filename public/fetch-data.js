const groupingMap = {
  Social: ["youtube", "facebook", "instagram", "linkedin", "tiktok", "social"],
  "Midia Paga": ["adwords", "cpc", "ppc", "Campanhas"],
  Organico: [
    "organic",
    "search",
    "google",
    "direct",
    "(direct)",
    "none",
    "Organico",
    "(not set)"
  ],
  CRM: ["email", "e-mails", "newsletter"],
  "Inside Sales": ["coldcall", "sales_team"],
  Referral: ["referral"],
  Outros: [],
};

document
  .getElementById("GA4Form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const propertyID = document.getElementById("propertyID").value;

    const response = await fetch("/fetchGAData", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startDate, endDate, propertyID }),
    });

    const rawData = await response.json();
    const groupedData = groupData(rawData); // Agrupa os dados antes de construir a tabela
    const generalTotals = calculateTotals(rawData);
    buildTable(groupedData, generalTotals); // Passa os dados agrupados para construir a tabela
  });

let currentSort = {
  column: null,
  ascending: true,
};

function groupData(data) {
  return data.map((row) => {
    let group = "Outros"; // Grupo padrão se nenhum outro for encontrado
    for (const [groupName, sources] of Object.entries(groupingMap)) {
      if (
        sources
          .map((source) => source.toLowerCase())
          .includes(row.sessionSource.toLowerCase()) ||
        sources
          .map((source) => source.toLowerCase())
          .includes(row.sessionMedium.toLowerCase())
      ) {
        group = groupName;
        break;
      }
    }
    return { ...row, group }; // Retorna um novo objeto com a adição do grupo
  });
}

function buildTable(data, generalTotals) {
  const results = document.getElementById("results");
  results.innerHTML = ""; // Limpar resultados anteriores

  const headers = Object.keys(data[0]).concat([
    "Average Ticket",
    "Revenue %",
    "Add to Cart %",
    "Transactions %",
    "Traffic %",
  ]);

  const tooltips = {
    sessionSource: "The origin of the session.",
    sessionMedium: "The medium of the session (e.g., organic, referral).",
    sessions: "Total number of sessions.",
    engagedSessions: "Total number of engaged sessions.",
    transactions: "Total number of transactions.",
    checkouts: "Total number of checkouts.",
    addToCarts: "Total number of times items were added to cart.",
    purchaseRevenue: "Total revenue from purchases.",
    "Average Ticket": "Average revenue per transaction.",
    "Revenue %": "Percentage of total revenue contributed by this row.",
    "Add to Cart %": "Percentage of sessions that resulted in adding to cart.",
    "Transactions %":
      "Percentage of total transactions contributed by this row.",
    "Traffic %":
      "Percentage of total traffic (sessions) contributed by this row.",
  };

  // Cria um botão de exportação de CSV
  const exportBtn = createExportButton();

  Object.keys(groupingMap).forEach((group) => {
    const groupData = data.filter((row) => row.group === group);

    if (groupData.length > 0) {
      // Cria e adiciona o título do grupo
      const groupTitle = document.createElement("h2");
      groupTitle.textContent = group;
      groupTitle.className = "text-xl font-bold my-4";
      results.appendChild(groupTitle);
      console.log('Raw Data:', data);
      console.log('General Totals:', generalTotals);
      const groupTotal = calculateGroupTotals(groupData, headers, generalTotals)[group] || {};

      const table = createTable(
        groupData,
        headers,
        tooltips,
        groupTotal,
        generalTotals
      );
      table.id = `table-${group}`; // Certifique-se de que este ID seja único
      results.appendChild(table);
    }
  });

  results.appendChild(exportBtn); // Adiciona o botão de exportação após as tabelas
}

function createExportButton() {
  const exportBtn = document.createElement("button");
  exportBtn.className = "px-4 py-2 my-2 bg-blue-500 hover:bg-blue-700 rounded-md text-white font-bold";
  exportBtn.textContent = "Exportar CSV";
  exportBtn.addEventListener("click", () =>
    exportTableToCSV("dados_exportados.csv")
  );
  return exportBtn;
}

function createTable(groupData, headers, tooltips, groupTotal, generalTotals) {
  const table = document.createElement("table");
  table.className = "table-auto w-full text-sm text-left text-gray-500";

  // Cabeçalho da tabela
  const thead = createTableHeader(headers, tooltips);
  table.appendChild(thead);

  // Corpo da tabela com os dados
  const tbody = document.createElement("tbody");
  tbody.className = "bg-white divide-y divide-gray-200";

  console.log(groupTotal);

  // Linha de totais do grupo
  const totalRow = createTotalRow(groupTotal, headers);
  tbody.appendChild(totalRow);

  // Linhas de dados do grupo
  groupData.forEach((rowData) => {
    const row = createDataRow(rowData, headers, groupTotal, generalTotals);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  return table;
}

function createTableHeader(headers, tooltips) {
  const thead = document.createElement("thead");
  thead.className = "text-xs text-gray-700 uppercase bg-gray-50";
  const headerRow = document.createElement("tr");

  headers.forEach((headerText) => {
    const header = document.createElement("th");
    header.textContent = headerText; // Supondo que 'headers' é um array de strings simples
    header.className = "px-6 py-3";
    if (tooltips[headerText]) {
      header.setAttribute("title", tooltips[headerText]);
    }
    headerRow.appendChild(header);
  });

  thead.appendChild(headerRow);
  return thead;
}

function createTotalRow(groupTotal, headers) {
  const tr = document.createElement("tr");
  tr.className = "bg-blue-100"; // Uma classe para destacar a linha de totais
  console.log(headers);
  headers.forEach((header) => {
    const td = document.createElement("td");
    td.className = "px-6 py-4 font-medium";
    const value = groupTotal[header];
    // Se nao tiver o valor, deixa a celula em branco
    td.textContent = value || "";
    tr.appendChild(td);
  });
  return tr;
}

function createDataRow(rowData, headers, groupTotal, generalTotals) {
  const tr = document.createElement("tr");
  headers.forEach((header) => {
    const td = document.createElement("td");
    td.className = "px-6 py-4";

    switch (header) {
      case "Average Ticket":
        td.textContent =
          rowData.transactions > 0
            ? (rowData.purchaseRevenue / rowData.transactions).toFixed(2)
            : "0";
        break;
      case "Revenue %":
        td.textContent =
          generalTotals.purchaseRevenue > 0
            ? (
                (rowData.purchaseRevenue / generalTotals.purchaseRevenue) *
                100
              ).toFixed(0) + "%"
            : "0%";
        break;
      case "Transactions %":
        td.textContent =
          generalTotals.transactions > 0
            ? (
                (rowData.transactions / generalTotals.transactions) *
                100
              ).toFixed(0) + "%"
            : "0%";
        break;
      case "Traffic %":
        td.textContent =
          generalTotals.sessions > 0
            ? ((rowData.sessions / generalTotals.sessions) * 100).toFixed(0) +
              "%"
            : "0%";
        break;
      default:
        td.textContent = rowData[header] || "0";
    }
    tr.appendChild(td);
  });
  return tr;
}

function calculateTotals(data) {
  const totals = {
    sessions: 0,
    transactions: 0,
    purchaseRevenue: 0,
  };

  data.forEach((row) => {
    totals.sessions += parseInt(row.sessions, 10) || 0;
    totals.transactions += parseInt(row.transactions, 10) || 0;
    totals.purchaseRevenue += parseFloat(row.purchaseRevenue, 10) || 0;
  });

  return totals;
}

function getSortableValue(row, key, totals) {
  // A função agora aceita 'totals' como um parâmetro e utiliza esse valor.
  switch (key) {
    case "Average Ticket":
      return parseInt(row.transactions, 10) === 0
        ? 0
        : parseFloat(row.purchaseRevenue) / parseInt(row.transactions, 10);
    case "Revenue %":
      return parseFloat(row.purchaseRevenue) / totals.purchaseRevenue;
    case "Add to Cart %":
      return parseInt(row.addToCarts, 10) / parseInt(row.sessions, 10);
    case "Transactions %":
      return parseInt(row.transactions, 10) / totals.transactions;
    case "Traffic %":
      return parseInt(row.sessions, 10) / totals.sessions;
    default:
      return isNaN(+row[key]) ? row[key] : +row[key];
  }
}

function addSortingListeners(groupData, tableId, headers, tooltips) {
  const tableHeaders = document.querySelectorAll(`#${tableId} thead th`);

  tableHeaders.forEach((headerElement, index) => {
    if (index < headers.length) {
      // Evita adicionar ouvintes a cabeçalhos que não correspondem aos dados
      headerElement.addEventListener("click", () => {
        const header = headers[index];
        const ascending =
          currentSort.column === header && !currentSort.ascending;
        currentSort = { column: header, ascending };

        // Ordenar os dados com base na coluna e direção
        const sortedData = sortData([...groupData], header, ascending);

        // Recriar a tabela com os dados ordenados
        rebuildTable(sortedData, tableId, headers, tooltips);
      });
    }
  });
}

function rebuildTable(sortedGroupData, tableId, headers, tooltips) {
  // Seleciona a tabela existente e armazena seu contêiner pai e o próximo elemento irmão
  const existingTable = document.getElementById(tableId);
  const parent = existingTable.parentNode;
  const nextSibling = existingTable.nextSibling;

  // Remove a tabela existente do DOM
  parent.removeChild(existingTable);

  const group = tableId.replace("table-", "");
  const resultsContainer = document.getElementById("results");
  const oldTable = document.getElementById(tableId);
  if (oldTable) {
    resultsContainer.removeChild(oldTable);
  }

  // Calcula os totais do grupo para os dados ordenados
  const groupTotal =
    calculateGroupTotals(sortedGroupData, headers)[group] || {};

  const newTable = createTable(sortedGroupData, headers, tooltips, groupTotal);
  newTable.id = tableId;

  if (nextSibling) {
    parent.insertBefore(newTable, nextSibling);
  } else {
    parent.appendChild(newTable);
  }

  // Atualiza os ouvintes de evento para a nova tabela, passando também os tooltips
  addSortingListeners(sortedGroupData, tableId, headers, tooltips);
}

function sortData(data, key, ascending = true, totals) {
  // 'totals' agora é passado para 'getSortableValue'.
  return data.sort((a, b) => {
    const aValue = getSortableValue(a, key, totals);
    const bValue = getSortableValue(b, key, totals);

    if (aValue < bValue) return ascending ? -1 : 1;
    if (aValue > bValue) return ascending ? 1 : -1;
    return 0;
  });
}

function exportTableToCSV(filename) {
  const csv = [];
  const rows = document.querySelectorAll("table tr");

  for (let i = 0; i < rows.length; i++) {
    const row = [],
      cols = rows[i].querySelectorAll("td, th");

    for (let j = 0; j < cols.length; j++) {
      // Limpar o texto para evitar problemas com vírgulas e quebras de linha
      const text = cols[j].innerText
        .replace(/,/g, "")
        .replace(/(\r\n|\n|\r)/gm, "");
      row.push('"' + text + '"'); // Envolver o dado com aspas duplas para manejar dados que contém vírgulas
    }

    csv.push(row.join(",")); // Juntar os dados com vírgulas
  }

  // Criar um link para download do CSV
  const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });

  // Criar um link escondido para download
  const downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = "none";

  // Adicionar o link ao DOM e clicar nele (isso fará o download do arquivo)
  document.body.appendChild(downloadLink);
  downloadLink.click();
}

function calculateGroupTotals(data, headers, generalTotals) {
    const groupTotals = {};
  
    // Initialize group totals with default values
    Object.keys(groupingMap).forEach(group => {
      groupTotals[group] = {
        sessions: 0,
        transactions: 0,
        purchaseRevenue: 0,
        engagedSessions: 0,
        "checkouts": 0,
        "addToCarts": 0,
        "Average Ticket": 0,
        // Initialize other properties if needed
      };
    });
  
    // Sum values for each group
    data.forEach(row => {
      const group = row.group || "Outros"; // Default to "Outros" if group is not defined
      if (!groupTotals[group]) {
        groupTotals[group] = {
          sessions: 0,
          transactions: 0,
          purchaseRevenue: 0,
          engagedSessions: 0,
          "checkouts": 0,
          "addToCarts": 0,
          "Average Ticket": 0,
        //   "averageTicketCounter": 0,
          // Initialize other properties if needed
        };
      }
  
      groupTotals[group].sessions += parseInt(row.sessions, 10) || 0;
      groupTotals[group].transactions += parseInt(row.transactions, 10) || 0;
      groupTotals[group].purchaseRevenue += parseFloat(row.purchaseRevenue) || 0;
      groupTotals[group].engagedSessions += parseFloat(row.engagedSessions) || 0;
      groupTotals[group].checkouts += parseInt(row.checkouts, 10) || 0;
      groupTotals[group].addToCarts += parseInt(row.addToCarts, 10) || 0;
    });
  
    // Calculate percentages after summing totals
    Object.keys(groupTotals).forEach(group => {
      groupTotals[group]["Revenue %"] = generalTotals.purchaseRevenue > 0
        ? ((groupTotals[group].purchaseRevenue / generalTotals.purchaseRevenue) * 100).toFixed(2) + "%"
        : "0%";
      groupTotals[group]["Transactions %"] = generalTotals.transactions > 0
        ? ((groupTotals[group].transactions / generalTotals.transactions) * 100).toFixed(2) + "%"
        : "0%";
      groupTotals[group]["Traffic %"] = generalTotals.sessions > 0
        ? ((groupTotals[group].sessions / generalTotals.sessions) * 100).toFixed(2) + "%"
        : "0%";
        groupTotals[group]["Average Ticket"] = groupTotals[group].transactions > 0
        ? "R$ " + (groupTotals[group].purchaseRevenue / groupTotals[group].transactions).toFixed(2)
        : "0%";
        groupTotals[group]["Add to Cart %"] = groupTotals[group].addToCarts > 0
        ? ((groupTotals[group].sessions) / (groupTotals[group].addToCarts * 100)).toFixed(2) + "%"
        : "0%";
    });
  
    return groupTotals;
  }
  
