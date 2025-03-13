// Credit card data storage and management
const CARD_DATA_KEY = 'savedCardData';

// Initialize credit card related fields
const typeSelect = document.getElementById('type');
const bankSelect = document.getElementById('bankSelect');
const customCardName = document.getElementById('customCardName');
const cardDueDate = document.getElementById('cardDueDate');
const creditCardFields = document.querySelectorAll('.credit-card-fields');
const customCardField = document.querySelector('.custom-card-name');
const dueDateField = document.querySelector('.due-date-field');

// Load saved card data from localStorage
let savedCardData = JSON.parse(localStorage.getItem(CARD_DATA_KEY) || '{}');

// Initialize event listeners
function initCreditCardFields() {
          typeSelect.addEventListener('change', handlePaymentTypeChange);
          bankSelect.addEventListener('change', handleBankSelection);
          customCardName.addEventListener('change', handleCustomCardName);
          cardDueDate.addEventListener('change', handleDueDateSelection);
}

// Handle payment type selection
function handlePaymentTypeChange() {
          const isCreditCard = typeSelect.value === 'credit_card';
          creditCardFields.forEach(field => {
                    field.style.display = isCreditCard ? 'block' : 'none';
          });
          if (!isCreditCard) {
                    customCardField.style.display = 'none';
                    dueDateField.style.display = 'none';
          }
}

// Handle bank selection
function handleBankSelection() {
          const selectedBank = bankSelect.value;
          customCardField.style.display = selectedBank === 'outro' ? 'block' : 'none';

          if (selectedBank && selectedBank !== 'outro') {
                    showDueDateField();
                    loadSavedDueDate(selectedBank);
          } else if (selectedBank === 'outro') {
                    customCardName.value = '';
                    dueDateField.style.display = 'none';
          }
}

// Handle custom card name input
function handleCustomCardName() {
          if (customCardName.value.trim()) {
                    showDueDateField();
                    loadSavedDueDate(getCardIdentifier());
          } else {
                    dueDateField.style.display = 'none';
          }
}

// Handle due date selection
function handleDueDateSelection() {
          const cardId = getCardIdentifier();
          if (cardId && cardDueDate.value) {
                    savedCardData[cardId] = cardDueDate.value;
                    localStorage.setItem(CARD_DATA_KEY, JSON.stringify(savedCardData));
          }
}

// Show due date field
function showDueDateField() {
          dueDateField.style.display = 'block';
}

// Load saved due date for a card
function loadSavedDueDate(cardId) {
          if (savedCardData[cardId]) {
                    cardDueDate.value = savedCardData[cardId];
          } else {
                    cardDueDate.value = '';
          }
}

// Get card identifier (bank name or custom card name)
function getCardIdentifier() {
          return bankSelect.value === 'outro' ?
                    customCardName.value.trim().toLowerCase() :
                    bankSelect.value;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCreditCardFields);