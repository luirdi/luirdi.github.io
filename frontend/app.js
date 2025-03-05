// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNipGBlG1w1FlCVknNxA3WYv8TMYL85bs",
  authDomain: "finpla-c575c.firebaseapp.com",
  databaseURL: "https://finpla-c575c-default-rtdb.firebaseio.com",
  projectId: "finpla-c575c",
  storageBucket: "finpla-c575c.firebasestorage.app",
  messagingSenderId: "417838979466",
  appId: "1:417838979466:web:91481c276febd368075073",
  measurementId: "G-KS97CRRJ11",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// References
const database = firebase.database();

// DOM Elements
const dashboardContainer = document.getElementById("dashboardContainer");
const transactionForm = document.getElementById("transactionForm");
const transactionsList = document.getElementById("transactionsList");
const creditCardTransactionsList = document.getElementById(
  "creditCardTransactionsList"
);
const totalBalance = document.getElementById("totalBalance");
const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");
const totalCreditCard = document.getElementById("totalCreditCard");
const totalOtherExpenses = document.getElementById("totalOtherExpenses");
const currentMonthElement = document.getElementById("currentMonth");
const currentYearElement = document.getElementById("currentYear");

// State variables
let transactions = [];
// Get current date in GMT-3 (UTC-3)
let currentDate = new Date();
currentDate.setUTCHours(currentDate.getUTCHours() - 3);

// Event Listeners
transactionForm.addEventListener("submit", addTransaction);

// Initialize dashboard
dashboardContainer.classList.remove("d-none");
updateCurrentDate();
loadTransactions();

// Update current date display
function updateCurrentDate() {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  currentMonthElement.textContent = months[currentDate.getMonth()];
  currentYearElement.textContent = currentDate.getFullYear();
}

// Change month
function changeMonth(delta) {
  // Change month with UTC adjustment
  currentDate.setUTCMonth(currentDate.getUTCMonth() + delta);
  currentDate.setUTCHours(currentDate.getUTCHours() - 3);
  updateCurrentDate();
  loadTransactions();
}

// Change year
function changeYear(delta) {
  // Change year with UTC adjustment
  currentDate.setUTCFullYear(currentDate.getUTCFullYear() + delta);
  currentDate.setUTCHours(currentDate.getUTCHours() - 3);
  updateCurrentDate();
  loadTransactions();
}

// Load transactions from Firebase
function loadTransactions() {
  const transactionsRef = database.ref("transactions");

  transactionsRef.on("value", (snapshot) => {
    transactions = [];
    transactionsList.innerHTML = "";
    creditCardTransactionsList.innerHTML = "";

    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach((key) => {
        const transaction = {
          id: key,
          ...data[key],
        };
        // Adjust date to GMT-3
        const transactionDate = new Date(transaction.date); // Parse ISO string with correct timezone

        // Filter transactions by current month and year
        const options = {
          timeZone: "America/Sao_Paulo",
          month: "numeric",
          year: "numeric",
        };
        const currentLocalDateStr = currentDate.toLocaleDateString("pt-BR", options);
        const [currentMonth, currentYear] = currentLocalDateStr.split("/").map(Number);
        const transactionLocalDateStr = transactionDate.toLocaleDateString("pt-BR", options);
        const [month, year] = transactionLocalDateStr.split("/").map(Number);
        if (
          month === currentMonth &&
          year === currentYear
        ) {
          transactions.push(transaction);
        }
      });

      // Sort transactions by date (newest first) using GMT-3 dates
      transactions.sort((a, b) => {
        const dateA = new Date(
          new Date(a.date).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })
        );
        const dateB = new Date(
          new Date(b.date).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          })
        );
        return dateB - dateA;
      });

      // Render transactions
      renderTransactions();

      // Update summary
      updateFinancialSummary();
    } else {
      updateFinancialSummary();
    }
  });
}

// Add new transaction
function addTransaction(e) {
  e.preventDefault();

  const description = document.getElementById("description").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  if (!description || isNaN(amount) || amount <= 0 || !date) {
    alert("Por favor, preencha todos os campos corretamente.");
    return;
  }

  const transactionsRef = database.ref("transactions");
  const newTransaction = {
    description,
    amount,
    type,
    category,
    date: new Date(date + "T00:00:00-03:00").toISOString(), // Store with GMT-3 offset
  };

  transactionsRef
    .push(newTransaction)
    .then(() => {
      transactionForm.reset();
    })
    .catch((error) => {
      alert("Erro ao adicionar transação: " + error.message);
    });
}

// Render transactions list
function renderTransactions() {
  transactionsList.innerHTML = "";
  creditCardTransactionsList.innerHTML = "";

  // Translate category function
  const getCategoryTranslation = (category) => {
    const categoryTranslations = {
      food: "Alimentação",
      transport: "Transporte",
      housing: "Moradia",
      others: "Outros",
    };
    return categoryTranslations[category] || category;
  };

  // Create transaction row function
  const createTransactionRow = (transaction) => {
    const row = document.createElement("tr");

    // Format date with GMT-3 timezone
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    // Format amount
    const formattedAmount = formatNumberWithoutCurrency(transaction.amount);

    row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.description}</td>
            <td>${getCategoryTranslation(transaction.category)}</td>
            <td class="transaction-expense">
                ${formattedAmount}
            </td>
            <td class="action-buttons">
                <button class="btn-link-p-0" onclick="deleteTransaction('${
                  transaction.id
                }')" title="Excluir"><img src="/icons/lixo_96-96.png" alt="Excluir" width="20" height="20"></button>
            </td>
        `;

    return row;
  };

  // Filter and render transactions by type
  transactions.forEach((transaction) => {
    const row = createTransactionRow(transaction);

    if (transaction.type === "credit_card") {
      creditCardTransactionsList.appendChild(row);
    } else {
      transactionsList.appendChild(row);
    }
  });
}

// Delete transaction
function deleteTransaction(id) {
  if (confirm("Tem certeza que deseja excluir esta transação?")) {
    const transactionRef = database.ref(`transactions/${id}`);
    transactionRef.remove().catch((error) => {
      alert("Erro ao excluir transação: " + error.message);
    });
  }
}

// Update financial summary
function updateFinancialSummary() {
  let expenses = 0;
  let creditCardTotal = 0;
  let otherPaymentsTotal = 0;

  transactions.forEach((transaction) => {
    expenses += transaction.amount;

    // Calculate totals by transaction type
    if (transaction.type === "credit_card") {
      creditCardTotal += transaction.amount;
    } else if (transaction.type === "other_payments") {
      otherPaymentsTotal += transaction.amount;
    }
  });

  totalExpenses.textContent = formatCurrency(expenses);
  totalCreditCard.textContent = formatCurrency(creditCardTotal);
  totalOtherExpenses.textContent = formatCurrency(otherPaymentsTotal);
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Format number without currency symbol
function formatNumberWithoutCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
