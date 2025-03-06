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
const auth = firebase.auth();

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
let currentUserId = null;

// Constants
const TIMEZONE = "America/Sao_Paulo";
const LOCALE = "pt-BR";
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Get current date in local timezone (Brazil)
let currentDate = new Date();

// Auth state observer
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;
    dashboardContainer.classList.remove("d-none");
    updateCurrentDate();
    loadTransactions();
  } else {
    window.location.href = '/login.html';
  }
});

// Event Listeners
transactionForm.addEventListener("submit", addTransaction);

// Add event listener to show/hide credit card fields based on transaction type
document.getElementById("type").addEventListener("change", function() {
  const creditCardFields = document.querySelectorAll(".credit-card-fields");
  const isVisible = this.value === "credit_card";
  creditCardFields.forEach(field => field.style.display = isVisible ? "block" : "none");
});

// Setup input capitalization
document.addEventListener("DOMContentLoaded", () => {
  const descriptionInput = document.getElementById("description");
  if (descriptionInput) {
    descriptionInput.addEventListener("input", function() {
      if (this.value.length > 0) {
        this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1);
      }
    });
  }
});

// Date handling functions
function updateCurrentDate() {
  currentMonthElement.textContent = MONTHS[currentDate.getMonth()];
  currentYearElement.textContent = currentDate.getFullYear();
}

function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  updateCurrentDate();
  loadTransactions();
}

function changeYear(delta) {
  currentDate.setFullYear(currentDate.getFullYear() + delta);
  updateCurrentDate();
  loadTransactions();
}

// Format date to local string
function formatLocalDate(date) {
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE
  });
}

// Get current month and year as numbers
function getCurrentMonthYear() {
  const options = { timeZone: TIMEZONE, month: "numeric", year: "numeric" };
  const dateStr = currentDate.toLocaleDateString(LOCALE, options);
  return dateStr.split("/").map(Number);
}

// Load transactions from Firebase
function loadTransactions() {
  if (!currentUserId) return;
  
  const transactionsRef = database.ref(`users/${currentUserId}/transactions`);

  transactionsRef.on("value", (snapshot) => {
    transactions = [];
    transactionsList.innerHTML = "";
    creditCardTransactionsList.innerHTML = "";

    const data = snapshot.val();
    if (data) {
      const [currentMonth, currentYear] = getCurrentMonthYear();
      
      Object.keys(data).forEach((key) => {
        const transaction = { id: key, ...data[key] };
        
        // For credit card installments, use displayDate for filtering if available
        let dateToFilter = transaction.displayDate ? new Date(transaction.displayDate) : new Date(transaction.date);
        
        const options = { timeZone: TIMEZONE, month: "numeric", year: "numeric" };
        const transactionDateStr = dateToFilter.toLocaleDateString(LOCALE, options);
        const [month, year] = transactionDateStr.split("/").map(Number);
        
        if (month === currentMonth && year === currentYear) {
          transactions.push(transaction);
        }
      });

      // Sort transactions by date (newest first)
      transactions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });

      renderTransactions();
      updateFinancialSummary();
    } else {
      updateFinancialSummary();
    }
  });
}

// Add new transaction
function addTransaction(e) {
  e.preventDefault();

  if (!currentUserId) {
    alert("Por favor, faça login para adicionar transações.");
    return;
  }

  const formData = {
    description: document.getElementById("description").value,
    amount: parseFloat(document.getElementById("amount").value),
    type: document.getElementById("type").value,
    category: document.getElementById("category").value,
    date: document.getElementById("date").value
  };

  if (!validateTransactionForm(formData)) {
    return;
  }

  const transactionsRef = database.ref(`users/${currentUserId}/transactions`);
  
  if (formData.type === "credit_card") {
    addCreditCardTransaction(formData, transactionsRef);
  } else {
    addRegularTransaction(formData, transactionsRef);
  }
}

// Validate transaction form
function validateTransactionForm(formData) {
  if (!formData.description || isNaN(formData.amount) || formData.amount <= 0 || !formData.date || !formData.category) {
    alert("Por favor, preencha todos os campos corretamente.");
    return false;
  }
  return true;
}

// Add credit card transaction with installments
function addCreditCardTransaction(formData, transactionsRef) {
  const installments = parseInt(document.getElementById("installments").value);
  const invoiceClosed = document.getElementById("invoiceClosed").checked;
  const installmentAmount = formData.amount / installments;
  
  const installmentPromises = [];
  
  for (let i = 0; i < installments; i++) {
    // Original purchase date
    const originalDate = new Date(formData.date + "T00:00:00-03:00");
    
    // Display date for filtering in UI
    const displayDate = new Date(formData.date + "T00:00:00-03:00");
    const monthsToAdd = invoiceClosed ? i + 1 : i;
    displayDate.setMonth(displayDate.getMonth() + monthsToAdd);
    
    const installmentTransaction = {
      description: formData.description,
      amount: installmentAmount,
      type: "credit_card",
      category: formData.category,
      date: originalDate.toISOString(),
      displayDate: displayDate.toISOString(),
      isInstallment: true,
      installmentNumber: i + 1,
      totalInstallments: installments,
      invoiceClosed
    };
    
    installmentPromises.push(transactionsRef.push(installmentTransaction));
  }
  
  Promise.all(installmentPromises)
    .then(() => {
      transactionForm.reset();
      alert(`Transação adicionada com sucesso em ${installments} parcelas.`);
    })
    .catch((error) => {
      alert("Erro ao adicionar transação: " + error.message);
    });
}

// Add regular transaction
function addRegularTransaction(formData, transactionsRef) {
  const newTransaction = {
    description: formData.description,
    amount: formData.amount,
    type: formData.type,
    category: formData.category,
    date: new Date(formData.date + "T00:00:00-03:00").toISOString()
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

// Delete transaction
function deleteTransaction(id) {
  if (!currentUserId) {
    alert("Por favor, faça login para excluir transações.");
    return;
  }

  if (confirm("Tem certeza que deseja excluir esta transação?")) {
    const transactionRef = database.ref(`users/${currentUserId}/transactions/${id}`);
    transactionRef.remove().catch((error) => {
      alert("Erro ao excluir transação: " + error.message);
    });
  }
}

// Render transactions list
function renderTransactions() {
  transactionsList.innerHTML = "";
  creditCardTransactionsList.innerHTML = "";

  transactions.forEach((transaction) => {
    const row = createTransactionRow(transaction);

    if (transaction.type === "credit_card") {
      creditCardTransactionsList.appendChild(row);
    } else {
      transactionsList.appendChild(row);
    }
  });
}

// Create transaction row
function createTransactionRow(transaction) {
  const row = document.createElement("tr");
  const formattedDate = formatLocalDate(transaction.date);
  const formattedAmount = formatNumberWithoutCurrency(transaction.amount);
  
  // Get description with installment info if applicable
  let displayDescription = transaction.description;
  if (transaction.isInstallment) {
    const baseDescription = transaction.description.split(" (")[0];
    displayDescription = `${baseDescription} (${transaction.installmentNumber}/${transaction.totalInstallments})`;
  }

  row.innerHTML = `
    <td>${formattedDate}</td>
    <td>${displayDescription}</td>
    <td>${getCategoryTranslation(transaction.category)}</td>
    <td class="transaction-expense">
        ${formattedAmount}
    </td>
    <td class="action-buttons">
        <button class="btn-link-p-0" onclick="deleteTransaction('${transaction.id}')" title="Excluir">
          <img src="/icons/lixo_96-96.png" alt="Excluir" width="20" height="20">
        </button>
    </td>
  `;

  return row;
}

// Translate category
function getCategoryTranslation(category) {
  const categoryTranslations = {
    combustivel_estacionamento: "Combustível/Estacionamento",
    cuidados_pessoais: "Cuidados Pessoais",
    educacao_qualificacao: "Educação/Qualificação",
    eletronicos_brinquedos: "Eletrônicos/Brinquedos",
    estorno_pagamento: "Estorno/Pagamento",
    farmacia: "Farmácia",
    manutencao_carro_moto: "Manutenção Carro/Moto",
    mercado_refeicao: "Mercado/Refeição",
    outros: "Outros",
    presente: "Presente",
    uber: "Uber",
    utensilios_casa: "Utensílios p/ Casa",
    vestuario: "Vestuário"
  };
  return categoryTranslations[category] || category;
}

// Update financial summary
function updateFinancialSummary() {
  let expenses = 0;
  let creditCardTotal = 0;
  let otherPaymentsTotal = 0;

  transactions.forEach((transaction) => {
    expenses += transaction.amount;

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
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Format number without currency symbol
function formatNumberWithoutCurrency(value) {
  return new Intl.NumberFormat(LOCALE, {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
