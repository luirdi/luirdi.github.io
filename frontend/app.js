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
const totalPaidExpenses = document.getElementById("totalPaidExpenses");
const currentMonthElement = document.getElementById("currentMonth");
const currentYearElement = document.getElementById("currentYear");

// State variables
let transactions = [];
let currentUserId = null;

// Constants
const TIMEZONE = "America/Sao_Paulo";
const LOCALE = "pt-BR";
const MONTHS = [
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
    window.location.href = "/login.html";
  }
});

// Event Listeners
transactionForm.addEventListener("submit", addTransaction);

// Event listener for payment type changes
document.getElementById("type").addEventListener("change", function (e) {
  const creditCardFields = document.querySelectorAll(".credit-card-fields");
  const recurringPaymentFields = document.querySelectorAll(
    ".recurring-payment-fields"
  );

  if (e.target.value === "credit_card") {
    creditCardFields.forEach((field) => (field.style.display = "block"));
    recurringPaymentFields.forEach((field) => (field.style.display = "none"));
    // Set default values for credit card payments
    document.getElementById("installments").value = "1";
    document.getElementById("cardType").value = "titular";
    // Removed automatic checking of invoiceClosed
  } else if (e.target.value === "other_") {
    creditCardFields.forEach((field) => (field.style.display = "none"));
    recurringPaymentFields.forEach((field) => (field.style.display = "block"));
  } else {
    creditCardFields.forEach((field) => (field.style.display = "none"));
    recurringPaymentFields.forEach((field) => (field.style.display = "none"));
  }
});

// No longer needed expiration date picker functions as we're using dropdown for recurring payments

// Setup input capitalization and form defaults
document.addEventListener("DOMContentLoaded", () => {
  const descriptionInput = document.getElementById("description");
  if (descriptionInput) {
    descriptionInput.addEventListener("input", function () {
      if (this.value.length > 0) {
        this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1);
      }
    });
  }

  // Set default values for credit card if it's pre-selected
  const paymentTypeSelect = document.getElementById("type");
  if (paymentTypeSelect && paymentTypeSelect.value === "credit_card") {
    document.getElementById("installments").value = "1";
    document.getElementById("cardType").value = "titular";
    // Removed automatic checking of invoiceClosed
    document
      .querySelectorAll(".credit-card-fields")
      .forEach((field) => (field.style.display = "block"));
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
    timeZone: TIMEZONE,
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

  transactionsRef.on(
    "value",
    (snapshot) => {
      transactions = [];
      
      // Transaction lists are now in modals, no need to clear them here
      // They will be updated in updateModalData()

      const data = snapshot.val();
      if (data) {
        const [currentMonth, currentYear] = getCurrentMonthYear();

        Object.keys(data).forEach((key) => {
          const transaction = { id: key, ...data[key] };

          let dateToFilter = transaction.displayDate
            ? new Date(transaction.displayDate)
            : new Date(transaction.date);

          const options = {
            timeZone: TIMEZONE,
            month: "numeric",
            year: "numeric",
          };
          const transactionDateStr = dateToFilter.toLocaleDateString(
            LOCALE,
            options
          );
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
    },
    (error) => {
      console.error("Failed to load transactions:", error);
    }
  );
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
    date: document.getElementById("date").value,
    isPaid: false, // Default payment status is false (not paid)
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
  if (
    !formData.description ||
    isNaN(formData.amount) ||
    formData.amount <= 0 ||
    !formData.date ||
    !formData.category
  ) {
    alert("Por favor, preencha todos os campos corretamente.");
    return false;
  }
  return true;
}

// Add credit card transaction with installments
function addCreditCardTransaction(formData, transactionsRef) {
  const installments = parseInt(document.getElementById("installments").value);
  const invoiceClosed = document.getElementById("invoiceClosed").checked;
  const cardType = document.getElementById("cardType").value;
  const installmentAmount = formData.amount / installments;

  const installmentPromises = [];

  for (let i = 0; i < installments; i++) {
    const originalDate = new Date(formData.date + "T00:00:00-03:00");
    const displayDate = new Date(formData.date + "T00:00:00-03:00");
    const monthsToAdd = invoiceClosed ? i + 1 : i;

    // Store the original day before modifying the date
    const originalDay = displayDate.getDate();

    // Add months to the display date
    displayDate.setMonth(displayDate.getMonth() + monthsToAdd);

    // Check if the day changed (indicating the month doesn't have that day)
    if (displayDate.getDate() !== originalDay) {
      // Set to the last day of the previous month
      displayDate.setDate(0);
    }

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
      invoiceClosed,
      cardType: cardType,
      isPaid: false, // Default payment status is false (not paid)
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
      console.error("Failed to add credit card transaction:", error);
    });
}

// Add regular transaction
function addRegularTransaction(formData, transactionsRef) {
  const newTransaction = {
    description: formData.description,
    amount: formData.amount,
    type: formData.type,
    category: formData.category,
    date: new Date(formData.date + "T00:00:00-03:00").toISOString(),
    isPaid: false, // Default payment status is false (not paid)
  };

  if (formData.type === "other_") {
    const recurringInstallments = parseInt(
      document.getElementById("recurringInstallments").value
    );
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
          totalInstallments: recurringInstallments,
          isPaid: false, // Default payment status is false (not paid)
        };
        transactionPromises.push(transactionsRef.push(transactionCopy));
      }

      Promise.all(transactionPromises)
        .then(() => {
          transactionForm.reset();
        })
        .catch((error) => {
          alert("Erro ao adicionar transações recorrentes: " + error.message);
          console.error("Failed to add recurring transactions:", error);
        });
      return;
    }
  }

  transactionsRef
    .push(newTransaction)
    .then(() => {
      transactionForm.reset();
    })
    .catch((error) => {
      alert("Erro ao adicionar transação: " + error.message);
      console.error("Failed to add regular transaction:", error);
    });
}

// Update payment status
function updatePaymentStatus(transactionId, isPaid) {
  if (!currentUserId) {
    alert("Por favor, faça login para atualizar o status de pagamento.");
    return;
  }

  const transactionRef = database.ref(
    `users/${currentUserId}/transactions/${transactionId}`
  );

  transactionRef
    .update({ isPaid })
    .then(() => {
      console.log(
        `Status de pagamento atualizado: ${isPaid ? "Pago" : "Não pago"}`
      );
    })
    .catch((error) => {
      alert("Erro ao atualizar status de pagamento: " + error.message);
      console.error("Failed to update payment status:", error);
    });
}

// Variables to track selected transactions
let selectedTransactions = [];
// Map to track transaction types by ID
let transactionTypesMap = {};

// Select transaction
function selectTransaction(id) {
  // Find the transaction
  const transaction = transactions.find((t) => t.id === id);
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
      row.classList.add("selected-row"); // Adiciona a classe para fundo cinza
    }
  } else {
    // Remove from selection
    selectedTransactions.splice(index, 1);
    if (row) {
      row.classList.remove("selected-row"); // Remove a classe para fundo cinza
    }
  }

  // Update delete buttons based on selections
  updateDeleteButtons();
}

// Update delete buttons based on current selections
function updateDeleteButtons() {
  const hasRegularTransactions = selectedTransactions.some(
    (id) => transactionTypesMap[id] !== "credit_card"
  );
  const hasCreditCardTransactions = selectedTransactions.some(
    (id) => transactionTypesMap[id] === "credit_card"
  );

  // Update modal delete buttons
  const modalRegularBtn = document.getElementById("deleteRegularTransactionBtn");
  const modalCreditBtn = document.getElementById("deleteCreditCardTransactionBtn");
  
  if (modalRegularBtn) {
    modalRegularBtn.disabled = !hasRegularTransactions;
    modalRegularBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Excluir';
  }
  
  if (modalCreditBtn) {
    modalCreditBtn.disabled = !hasCreditCardTransactions;
    modalCreditBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Excluir';
  }
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
  if (buttonId === "deleteRegularTransactionBtn") {
    transactionsToDelete = selectedTransactions.filter(
      (id) => transactionTypesMap[id] !== "credit_card"
    );
  } else if (buttonId === "deleteCreditCardTransactionBtn") {
    transactionsToDelete = selectedTransactions.filter(
      (id) => transactionTypesMap[id] === "credit_card"
    );
  }

  if (transactionsToDelete.length === 0) {
    return;
  }

  // If there's only one transaction to delete, use the delete confirmation modal
  if (transactionsToDelete.length === 1) {
    // Use the existing delete confirmation modal
    showDeleteConfirmation(transactionsToDelete[0]);
  } else {
    // For multiple transactions, show a simple confirmation
    const confirmMessage = `Tem certeza que deseja excluir estas ${transactionsToDelete.length} transações?`;
    
    if (confirm(confirmMessage)) {
      // Get the type of the first transaction (assuming all are the same type)
      const firstTransaction = transactions.find(t => t.id === transactionsToDelete[0]);
      const transactionType = firstTransaction ? firstTransaction.type : null;
      
      // Use the performDelete function from deleteConfirmation.js
      performDelete(transactionsToDelete, transactionType);
    }
  }
}

// Legacy delete transaction function (kept for compatibility)
// The deleteTransaction function is now implemented in deleteConfirmation.js
// This is just a reference to maintain compatibility with existing code
function deleteTransaction(id) {
  showDeleteConfirmation(id);
}

// Render transactions list
function renderTransactions() {
  // Build transaction types map for quick access
  transactionTypesMap = {};
  transactions.forEach((transaction) => {
    transactionTypesMap[transaction.id] = transaction.type;
  });

  // Update modal data to refresh the transaction lists in modals
  updateModalData();
  
  // Update delete buttons to reflect current selections
  updateDeleteButtons();
}

// Create transaction row
// Function to capitalize the first letter of each word in a string
function capitalizeWords(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function createTransactionRow(transaction) {
  const row = document.createElement("tr");
  row.dataset.id = transaction.id;
  row.classList.add("transaction-row");
  const formattedDate = formatLocalDate(transaction.date);
  const formattedAmount = formatNumberWithoutCurrency(transaction.amount);

  // Capitalize the description
  let displayDescription = capitalizeWords(transaction.description);
  
  // Add card type identifier for additional cards
  if (transaction.type === "credit_card" && transaction.cardType) {
    if (transaction.cardType === "adicional1") {
      displayDescription = `${displayDescription} #A1`;
    } else if (transaction.cardType === "adicional2") {
      displayDescription = `${displayDescription} #A2`;
    }
  }
  
  if (transaction.isInstallment) {
    const baseDescription = displayDescription.split(" (")[0];
    // Only show installment information if there's more than 1 installment
    if (transaction.totalInstallments > 1) {
      displayDescription = `${baseDescription} (${transaction.installmentNumber}/${transaction.totalInstallments})`;
    }
  } else if (
    transaction.isRecurring &&
    transaction.installmentNumber &&
    transaction.totalInstallments
  ) {
    // Only show installment information if there's more than 1 installment
    if (transaction.totalInstallments > 1) {
      displayDescription = `${displayDescription} (${transaction.installmentNumber}/${transaction.totalInstallments})`;
    }
  }

  // Add Bootstrap classes for better styling
  if (transaction.type === "credit_card") {
    // For credit card transactions, don't include the payment checkbox column
    row.innerHTML = `
      <td data-id="${transaction.id}">${formattedDate}</td>
      <td data-id="${
        transaction.id
      }" class="text-truncate" style="max-width: 150px;">${displayDescription}</td>
      <td data-id="${transaction.id}">${getCategoryTranslation(
      transaction.category
    )}</td>
      <td class="transaction-expense fw-medium" data-id="${
        transaction.id
      }" data-value="${transaction.amount}">
          ${formattedAmount}
      </td>
    `;
  } else {
    // For regular transactions, include the payment checkbox column
    row.innerHTML = `
      <td data-id="${transaction.id}">${formattedDate}</td>
      <td data-id="${
        transaction.id
      }" class="text-truncate" style="max-width: 150px;">${displayDescription}</td>
      <td data-id="${transaction.id}">${getCategoryTranslation(
      transaction.category
    )}</td>
      <td class="transaction-expense fw-medium" data-id="${
        transaction.id
      }" data-value="${transaction.amount}">
          ${formattedAmount}
      </td>
      <td data-id="${transaction.id}" class="text-center">
        <div class="form-check form-switch d-inline-block">
          <input class="form-check-input payment-checkbox" type="checkbox" role="switch" id="payment-${
            transaction.id
          }" 
            ${transaction.isPaid ? "checked" : ""} data-id="${transaction.id}">
        </div>
      </td>
    `;
  }

  // Add click event to select the row
  row.addEventListener("click", function (e) {
    // Don't select the row if clicking on the checkbox
    if (e.target.classList.contains("payment-checkbox")) {
      e.stopPropagation();
      return;
    }
    selectTransaction(transaction.id);
  });

  // Add event listener for the payment checkbox if it exists
  const checkbox = row.querySelector(".payment-checkbox");
  if (checkbox) {
    checkbox.addEventListener("change", function (e) {
      e.stopPropagation(); // Prevent row selection
      updatePaymentStatus(transaction.id, this.checked);
    });
  }

  return row;
}

// Translate category
function getCategoryTranslation(category) {
  const categoryTranslations = {
    alimentacao: "Alimentação",
    man_parking_fuel: "Carro/Moto",
    cuidados_pessoais: "Cuidados Pessoais",
    educacao_qualificacao: "Educação",
    loan: "Empréstimo",
    estorno_pagamento: "Estorno/Pagamento",
    health: "Saúde",
    outros: "Outros",
    presente: "Presente",
    servicos: "Servicos Essenciais",
    servicos_not: "Serviços",
    streaming_internet_tv: "Streaming/Internet/TV",
    uber: "Uber",
    utensilios_casa: "Casa",
    vestuario: "Vestuário",
  };
  return categoryTranslations[category] || category;
}

// Update financial summary
function updateFinancialSummary() {
  let expenses = 0;
  let creditCardTotal = 0;
  let otherPaymentsTotal = 0;
  let paidExpenses = 0;

  transactions.forEach((transaction) => {
    expenses += transaction.amount;

    if (transaction.type === "credit_card") {
      creditCardTotal += transaction.amount;
      if (transaction.isPaid) {
        paidExpenses += transaction.amount;
      }
    } else if (transaction.type === "other_") {
      otherPaymentsTotal += transaction.amount;
      if (transaction.isPaid) {
        paidExpenses += transaction.amount;
      }
    }
  });

  totalExpenses.textContent = formatCurrency(expenses - paidExpenses);
  totalPaidExpenses.textContent = formatCurrency(paidExpenses);
  totalCreditCard.textContent = formatCurrency(creditCardTotal);
  totalOtherExpenses.textContent = formatCurrency(otherPaymentsTotal);
  
  // Initialize card filters after updating the financial summary
  // This ensures the filters work properly after changing months
  setTimeout(() => {
    initCardFilters();
  }, 0);
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

// Sort state variables
let currentSortColumn = null;
let isAscending = true;

// Function to sort transactions
function sortTransactions(column) {
  if (currentSortColumn === column) {
    isAscending = !isAscending;
  } else {
    currentSortColumn = column;
    isAscending = true;
  }

  transactions.sort((a, b) => {
    let valueA, valueB;

    switch (column) {
      case 'date':
        valueA = new Date(a.date);
        valueB = new Date(b.date);
        break;
      case 'description':
        valueA = a.description.toLowerCase();
        valueB = b.description.toLowerCase();
        break;
      case 'category':
        valueA = getCategoryTranslation(a.category).toLowerCase();
        valueB = getCategoryTranslation(b.category).toLowerCase();
        break;
      case 'amount':
        valueA = a.amount;
        valueB = b.amount;
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return isAscending ? -1 : 1;
    if (valueA > valueB) return isAscending ? 1 : -1;
    return 0;
  });

  renderTransactions();
}

// Function to add sort event listeners to table headers
function addSortEventListeners() {
  const tables = document.querySelectorAll('.table');
  tables.forEach(table => {
    const headers = table.querySelectorAll('th');
    headers.forEach((header, index) => {
      if (index < 4) { // Skip the 'Pago' column
        header.style.cursor = 'pointer';
        header.addEventListener('dblclick', () => {
          const column = ['date', 'description', 'category', 'amount'][index];
          sortTransactions(column);
        });
      }
    });
  });
}

// Add event listeners after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  addSortEventListeners();
});
