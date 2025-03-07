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
auth.onAuthStateChanged(user => {
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

// Event listener for payment type changes
document.getElementById('type').addEventListener('change', function(e) {
  const creditCardFields = document.querySelectorAll('.credit-card-fields');
  const recurringPaymentFields = document.querySelectorAll('.recurring-payment-fields');
  
  if (e.target.value === 'credit_card') {
    creditCardFields.forEach(field => field.style.display = 'block');
    recurringPaymentFields.forEach(field => field.style.display = 'none');
    document.getElementById('expirationDate').removeAttribute('required');
  } else if (e.target.value === 'other_payments') {
    creditCardFields.forEach(field => field.style.display = 'none');
    recurringPaymentFields.forEach(field => field.style.display = 'block');
    document.getElementById('expirationDate').setAttribute('required', 'required');
    // Initialize expiration date picker with current date + 1 year
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    document.getElementById('expirationMonth').textContent = MONTHS[nextYear.getMonth()];
    document.getElementById('expirationYear').textContent = nextYear.getFullYear();
    updateExpirationDateValue();
  } else {
    creditCardFields.forEach(field => field.style.display = 'none');
    recurringPaymentFields.forEach(field => field.style.display = 'none');
    document.getElementById('expirationDate').removeAttribute('required');
  }
});

// Expiration date picker functions
let expirationDate = new Date();
expirationDate.setFullYear(expirationDate.getFullYear() + 1); // Default to next year

function changeExpirationMonth(delta) {
  expirationDate.setMonth(expirationDate.getMonth() + delta);
  document.getElementById('expirationMonth').textContent = MONTHS[expirationDate.getMonth()];
  updateExpirationDateValue();
}

function changeExpirationYear(delta) {
  expirationDate.setFullYear(expirationDate.getFullYear() + delta);
  document.getElementById('expirationYear').textContent = expirationDate.getFullYear();
  updateExpirationDateValue();
}

function updateExpirationDateValue() {
  // Format as YYYY-MM for the hidden input
  const month = (expirationDate.getMonth() + 1).toString().padStart(2, '0');
  const year = expirationDate.getFullYear();
  document.getElementById('expirationDate').value = `${year}-${month}`;
}

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

  transactionsRef.on("value", snapshot => {
    transactions = [];
    transactionsList.innerHTML = "";
    creditCardTransactionsList.innerHTML = "";

    const data = snapshot.val();
    if (data) {
      const [currentMonth, currentYear] = getCurrentMonthYear();
      
      Object.keys(data).forEach(key => {
        const transaction = { id: key, ...data[key] };
        
        let dateToFilter = transaction.displayDate ? new Date(transaction.displayDate) : new Date(transaction.date);
        
        const options = { timeZone: TIMEZONE, month: "numeric", year: "numeric" };
        const transactionDateStr = dateToFilter.toLocaleDateString(LOCALE, options);
        const [month, year] = transactionDateStr.split("/").map(Number);
        
        if (month === currentMonth && year === currentYear) {
          transactions.push(transaction);
        }
      });

      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      renderTransactions();
      updateFinancialSummary();
    } else {
      updateFinancialSummary();
    }
  }, error => {
    console.error('Failed to load transactions:', error);
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
    const originalDate = new Date(formData.date + "T00:00:00-03:00");
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
    .catch(error => {
      alert("Erro ao adicionar transação: " + error.message);
      console.error('Failed to add credit card transaction:', error);
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
  
  if (formData.type === 'other_payments') {
    const expirationDateValue = document.getElementById('expirationDate').value;
    if (expirationDateValue) {
      const startDate = new Date(formData.date + "T00:00:00-03:00");
      const endDate = new Date(expirationDateValue + "-01T00:00:00-03:00");
      const transactionPromises = [];
      
      let currentDate = new Date(startDate);
      let installmentNumber = 1;
      
      // Calculate total number of installments
      const totalInstallments = Math.floor(
        (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
        (endDate.getMonth() - startDate.getMonth()) + 1
      );
      
      while (currentDate <= endDate) {
        const transactionCopy = {
          ...newTransaction,
          date: new Date(currentDate).toISOString(),
          expirationDate: expirationDateValue,
          isRecurring: true,
          installmentNumber: installmentNumber,
          totalInstallments: totalInstallments
        };
        transactionPromises.push(transactionsRef.push(transactionCopy));
        currentDate.setMonth(currentDate.getMonth() + 1);
        installmentNumber++;
      }
      
      Promise.all(transactionPromises)
        .then(() => {
          transactionForm.reset();
        })
        .catch(error => {
          alert("Erro ao adicionar transações recorrentes: " + error.message);
          console.error('Failed to add recurring transactions:', error);
        });
      return;
    }
  }
  
  transactionsRef
    .push(newTransaction)
    .then(() => {
      transactionForm.reset();
    })
    .catch(error => {
      alert("Erro ao adicionar transação: " + error.message);
      console.error('Failed to add regular transaction:', error);
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
    transactionRef.remove()
      .catch(error => {
        alert("Erro ao excluir transação: " + error.message);
        console.error('Failed to delete transaction:', error);
      });
  }
}

// Render transactions list
function renderTransactions() {
  transactionsList.innerHTML = "";
  creditCardTransactionsList.innerHTML = "";

  transactions.forEach(transaction => {
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
  
  let displayDescription = transaction.description;
  if (transaction.isInstallment) {
    const baseDescription = transaction.description.split(" (")[0];
    displayDescription = `${baseDescription} (${transaction.installmentNumber}/${transaction.totalInstallments})`;
  } else if (transaction.isRecurring && transaction.installmentNumber && transaction.totalInstallments) {
    displayDescription = `${transaction.description} (${transaction.installmentNumber}/${transaction.totalInstallments})`;
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
    alimentacao: "Alimentação",
    man_parking_fuel: "Carro/Moto",
    cuidados_pessoais: "Cuidados Pessoais",
    educacao_qualificacao: "Educação",
    estorno_pagamento: "Estorno/Pagamento",
    farmacia: "Farmácia",
    outros: "Outros",
    presente: "Presente",
    uber: "Uber",
    utensilios_casa: "Casa",
    vestuario: "Vestuário"
  };
  return categoryTranslations[category] || category;
}

// Update financial summary
function updateFinancialSummary() {
  let expenses = 0;
  let creditCardTotal = 0;
  let otherPaymentsTotal = 0;

  transactions.forEach(transaction => {
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
