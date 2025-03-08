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

// DOM Elements - Cache all DOM elements for better performance
const dashboardContainer = document.getElementById("dashboardContainer");
const transactionForm = document.getElementById("transactionForm");
const transactionsList = document.getElementById("transactionsList");
const creditCardTransactionsList = document.getElementById("creditCardTransactionsList");
const totalExpenses = document.getElementById("totalExpenses");
const totalCreditCard = document.getElementById("totalCreditCard");
const totalOtherExpenses = document.getElementById("totalOtherExpenses");
const currentMonthElement = document.getElementById("currentMonth");
const currentYearElement = document.getElementById("currentYear");
const typeSelect = document.getElementById('type');
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("date");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const installmentsSelect = document.getElementById("installments");
const recurringInstallmentsSelect = document.getElementById("recurringInstallments");
const invoiceClosedCheckbox = document.getElementById("invoiceClosed");

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
    // Set default values for credit card payments
    document.getElementById('installments').value = '1';
    // Removed automatic checking of invoiceClosed
  } else if (e.target.value === 'other_payments') {
    creditCardFields.forEach(field => field.style.display = 'none');
    recurringPaymentFields.forEach(field => field.style.display = 'block');
  } else {
    creditCardFields.forEach(field => field.style.display = 'none');
    recurringPaymentFields.forEach(field => field.style.display = 'none');
  }
});

// No longer needed expiration date picker functions as we're using dropdown for recurring payments

// Setup input capitalization and form defaults
document.addEventListener("DOMContentLoaded", () => {
  const descriptionInput = document.getElementById("description");
  if (descriptionInput) {
    descriptionInput.addEventListener("input", function() {
      if (this.value.length > 0) {
        this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1);
      }
    });
  }
  
  // Set default values for credit card if it's pre-selected
  const paymentTypeSelect = document.getElementById('type');
  if (paymentTypeSelect && paymentTypeSelect.value === 'credit_card') {
    document.getElementById('installments').value = '1';
    // Removed automatic checking of invoiceClosed
    document.querySelectorAll('.credit-card-fields').forEach(field => field.style.display = 'block');
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
    const recurringInstallments = parseInt(document.getElementById('recurringInstallments').value);
    if (recurringInstallments > 0) {
      const startDate = new Date(formData.date + "T00:00:00-03:00");
      const transactionPromises = [];
      
      // Create a transaction for each installment
      for (let i = 0; i < recurringInstallments; i++) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(currentDate.getMonth() + i);
        
        const transactionCopy = {
          ...newTransaction,
          date: new Date(currentDate).toISOString(),
          isRecurring: true,
          installmentNumber: i + 1,
          totalInstallments: recurringInstallments
        };
        transactionPromises.push(transactionsRef.push(transactionCopy));
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


// Variables to track selected transactions
let selectedTransactions = [];
// Map to track transaction types by ID
let transactionTypesMap = {};

// Select transaction
function selectTransaction(id) {
  // Find the transaction
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;
  
  // Store transaction type in the map for quick access
  transactionTypesMap[id] = transaction.type;
  
  // Toggle selection
  const index = selectedTransactions.indexOf(id);
  const row = document.querySelector(`tr[data-id="${id}"]`);
  
  if (index === -1) {
    // Add to selection
    selectedTransactions.push(id);
    if (row) {
      row.classList.add('selected-row'); // Adiciona a classe para fundo cinza
    }
  } else {
    // Remove from selection
    selectedTransactions.splice(index, 1);
    if (row) {
      row.classList.remove('selected-row'); // Remove a classe para fundo cinza
    }
  }
  
  // Update delete buttons based on selections
  updateDeleteButtons();
}

// Update delete buttons based on current selections
function updateDeleteButtons() {
  const hasRegularTransactions = selectedTransactions.some(id => transactionTypesMap[id] !== 'credit_card');
  const hasCreditCardTransactions = selectedTransactions.some(id => transactionTypesMap[id] === 'credit_card');
  
  document.getElementById('deleteRegularTransactionBtn').disabled = !hasRegularTransactions;
  document.getElementById('deleteCreditCardTransactionBtn').disabled = !hasCreditCardTransactions;
  
  const regularBtn = document.getElementById('deleteRegularTransactionBtn');
  const creditBtn = document.getElementById('deleteCreditCardTransactionBtn');
  
  regularBtn.textContent = 'Excluir Selecionado';
  creditBtn.textContent = 'Excluir Selecionado';
}

// Delete selected transactions
function deleteSelectedTransaction(event) {
  if (selectedTransactions.length === 0 || !currentUserId) {
    alert("Nenhuma transação selecionada ou usuário não está logado.");
    return;
  }
  
  // Determine which button was clicked
  const buttonId = event.currentTarget.id;
  let transactionsToDelete = [];
  
  // Filter transactions based on the button clicked
  if (buttonId === 'deleteRegularTransactionBtn') {
    transactionsToDelete = selectedTransactions.filter(id => transactionTypesMap[id] !== 'credit_card');
  } else if (buttonId === 'deleteCreditCardTransactionBtn') {
    transactionsToDelete = selectedTransactions.filter(id => transactionTypesMap[id] === 'credit_card');
  }
  
  if (transactionsToDelete.length === 0) {
    return;
  }

  const confirmMessage = transactionsToDelete.length > 1 
    ? `Tem certeza que deseja excluir estas ${transactionsToDelete.length} transações?` 
    : "Tem certeza que deseja excluir esta transação?";

  if (confirm(confirmMessage)) {
    const deletePromises = transactionsToDelete.map(id => {
      return database.ref(`users/${currentUserId}/transactions/${id}`).remove();
    });
    
    Promise.all(deletePromises)
      .then(() => {
        // Remove deleted transactions from selection
        selectedTransactions = selectedTransactions.filter(id => !transactionsToDelete.includes(id));
        
        // Update delete buttons
        updateDeleteButtons();
      })
      .catch(error => {
        alert("Erro ao excluir transações: " + error.message);
        console.error('Failed to delete transactions:', error);
      });
  }
}

// Legacy delete transaction function (kept for compatibility)
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

  // Build transaction types map for quick access
  transactionTypesMap = {};
  transactions.forEach(transaction => {
    transactionTypesMap[transaction.id] = transaction.type;
  });

  transactions.forEach(transaction => {
    const row = createTransactionRow(transaction);

    // Maintain selected state when re-rendering
    if (selectedTransactions.includes(transaction.id)) {
      row.classList.add('selected-row');
      row.style.backgroundColor = '#c9c9c9'; // Add background color for selected rows
    }

    if (transaction.type === "credit_card") {
      creditCardTransactionsList.appendChild(row);
    } else {
      transactionsList.appendChild(row);
    }
  });
  
  // Clear any existing delete buttons
  const existingRegularDeleteBtn = document.getElementById('deleteRegularTransactionBtn');
  const existingCreditDeleteBtn = document.getElementById('deleteCreditCardTransactionBtn');
  
  if (existingRegularDeleteBtn) existingRegularDeleteBtn.remove();
  if (existingCreditDeleteBtn) existingCreditDeleteBtn.remove();
  
  // Add delete button for regular transactions
  const regularTableContainer = document.querySelector('#transactionsList').closest('.card-body');
  const regularDeleteBtn = document.createElement('button');
  regularDeleteBtn.id = 'deleteRegularTransactionBtn';
  regularDeleteBtn.className = 'btn btn-danger mt-3';
  regularDeleteBtn.textContent = 'Excluir Selecionado';
  regularDeleteBtn.disabled = true;
  regularDeleteBtn.addEventListener('click', function(event) {
    deleteSelectedTransaction(event);
  });
  regularTableContainer.appendChild(regularDeleteBtn);
  
  // Add delete button for credit card transactions
  const creditCardTableContainer = document.querySelector('#creditCardTransactionsList').closest('.card-body');
  const creditCardDeleteBtn = document.createElement('button');
  creditCardDeleteBtn.id = 'deleteCreditCardTransactionBtn';
  creditCardDeleteBtn.className = 'btn btn-danger mt-3';
  creditCardDeleteBtn.textContent = 'Excluir Selecionado';
  creditCardDeleteBtn.disabled = true;
  creditCardDeleteBtn.addEventListener('click', function(event) {
    deleteSelectedTransaction(event);
  });
  creditCardTableContainer.appendChild(creditCardDeleteBtn);
  
  // Update delete buttons to reflect current selections
  updateDeleteButtons();
}


// Create transaction row
function createTransactionRow(transaction) {
  const row = document.createElement("tr");
  row.dataset.id = transaction.id;
  row.classList.add('transaction-row');
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
    <td data-id="${transaction.id}">${formattedDate}</td>
    <td data-id="${transaction.id}">${displayDescription}</td>
    <td data-id="${transaction.id}">${getCategoryTranslation(transaction.category)}</td>
    <td class="transaction-expense" data-id="${transaction.id}" data-value="${transaction.amount}">
        ${formattedAmount}
    </td>
  `;
  
  // Add click event to select the row
  row.addEventListener('click', function() {
    selectTransaction(transaction.id);
  });
  
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
