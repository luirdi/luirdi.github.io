// Card filter functionality

// Global variables to track current filter
let currentCardFilter = 'all';

// Initialize card filter functionality
function initCardFilters() {
  // Add event listeners to filter buttons
  document.getElementById('cardFilterAll').addEventListener('click', () => filterCardTransactions('all'));
  document.getElementById('cardFilterTitular').addEventListener('click', () => filterCardTransactions('titular'));
  document.getElementById('cardFilterAdicional1').addEventListener('click', () => filterCardTransactions('adicional1'));
  document.getElementById('cardFilterAdicional2').addEventListener('click', () => filterCardTransactions('adicional2'));

  // Set initial filter to 'all'
  filterCardTransactions('all');
}

// Filter credit card transactions by card type
function filterCardTransactions(cardType) {
  currentCardFilter = cardType;

  // Update active button state
  const buttons = [
    document.getElementById('cardFilterAll'),
    document.getElementById('cardFilterTitular'),
    document.getElementById('cardFilterAdicional1'),
    document.getElementById('cardFilterAdicional2')
  ];

  // Make sure all buttons exist before proceeding
  if (buttons.some(btn => !btn)) {
    console.error('Card filter buttons not found in the DOM');
    return;
  }

  buttons.forEach(btn => btn.classList.remove('active'));

  // Set active class on selected button
  switch (cardType) {
    case 'all':
      document.getElementById('cardFilterAll').classList.add('active');
      break;
    case 'titular':
      document.getElementById('cardFilterTitular').classList.add('active');
      break;
    case 'adicional1':
      document.getElementById('cardFilterAdicional1').classList.add('active');
      break;
    case 'adicional2':
      document.getElementById('cardFilterAdicional2').classList.add('active');
      break;
  }

  // Filter transactions
  const rows = document.querySelectorAll('#creditCardTransactionsList tr');
  let subtotal = 0;

  // Make sure the global transactions array exists and is accessible
  if (typeof transactions === 'undefined' || !Array.isArray(transactions)) {
    console.error('Transactions array is not available');
    return;
  }

  rows.forEach(row => {
    const transactionId = row.dataset.id;
    const transaction = transactions.find(t => t.id === transactionId);

    if (!transaction) return;

    if (cardType === 'all' || transaction.cardType === cardType) {
      row.style.display = '';
      subtotal += transaction.amount;
    } else {
      row.style.display = 'none';
    }
  });

  // Update subtotal display
  updateCardSubtotal(subtotal, cardType);
}

// Update card subtotal display
function updateCardSubtotal(amount, cardType) {
  const subtotalElement = document.getElementById('cardTypeSubtotal');
  let cardTypeLabel = '';

  switch (cardType) {
    case 'all':
      cardTypeLabel = 'Todos os cartões';
      break;
    case 'titular':
      cardTypeLabel = 'Cartão Titular';
      break;
    case 'adicional1':
      cardTypeLabel = 'Cartão Adicional #1';
      break;
    case 'adicional2':
      cardTypeLabel = 'Cartão Adicional #2';
      break;
  }

  subtotalElement.textContent = `${cardTypeLabel}: ${formatCurrency(amount)}`;
}

// Call initCardFilters after DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  // We'll initialize this after transactions are loaded
  // The main initialization happens in updateFinancialSummary() in app.js
  // This ensures filters work when changing months

  // Add a listener for month/year changes to ensure filters are reapplied
  document.querySelectorAll('.month-selector button, .year-selector button').forEach(button => {
    button.addEventListener('click', function () {
      // Re-apply the current filter after a short delay to ensure DOM is updated
      setTimeout(() => {
        if (currentCardFilter) {
          filterCardTransactions(currentCardFilter);
        }
      }, 100);
    });
  });
});