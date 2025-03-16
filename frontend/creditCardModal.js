// Credit Card Modal functionality

// Constants for localStorage
const CARD_DUE_DATES_KEY = 'cardDueDates';

// DOM Element cache to avoid repeated queries
const domElements = {};

// Function to create and show the credit card form modal
function createCreditCardFormModal() {
  // Create modal element if it doesn't exist
  if (document.getElementById('creditCardFormModal')) {
    return showCreditCardFormModal();
  }

  const modalHTML = `
    <div class="modal fade" id="creditCardFormModal" tabindex="-1" aria-labelledby="creditCardFormModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning bg-opacity-10">
            <h5 class="modal-title" id="creditCardFormModalLabel">
              <i class="bi bi-credit-card-fill me-2 text-warning"></i>Informações do Cartão de Crédito
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <form id="creditCardFormModalForm">
              <div class="mb-3">
                <label for="cardBank" class="form-label">Banco</label>
                <select class="form-select" id="cardBank">
                  <option value="" selected>Selecione uma opção</option>
                        <option value="banco_do_brasil">BB</option>
                        <option value="bradesco">Bradesco</option>
                        <option value="btg_pactual">BTG Pactual</option>
                        <option value="c6_bank">C6 Bank</option>
                        <option value="caixa">CEF</option>
                        <option value="banco_inter">Inter</option>
                        <option value="itau">Itaú</option>
                        <option value="nubank">Nubank</option>
                        <option value="santander">Santander</option>
                        <option value="outro">Outro</option>
                </select>
              </div>                       
              <div class="mb-3" id="customCardNameContainer" style="display: none;">
                <label for="modalCustomCardName" class="form-label">Nome do Cartão</label>
                <input type="text" class="form-control" id="modalCustomCardName" placeholder="Digite o nome do cartão">
              </div>
              <div class="mb-3">
                <label for="modalCardDueDate" class="form-label">Vencimento</label>
                <select class="form-select" id="modalCardDueDate">
                  <option value="" disabled selected>Dia do vencimento</option>
                  ${generateDueDateOptions()}
                </select>
              </div>
              <div class="mb-3">
                <label for="modalCardType" class="form-label">Tipo de Cartão</label>
                <select class="form-select" id="modalCardType">
                  <option value="titular">Titular</option>
                  <option value="adicional1">Adicional #1</option>
                  <option value="adicional2">Adicional #2</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="modalInstallments" class="form-label">Parcelas</label>
                <select class="form-select" id="modalInstallments">
                  ${generateInstallmentOptions()}
                </select>
              </div>
              <div class="mb-3 form-check">
                <input class="form-check-input" type="checkbox" id="modalInvoiceClosed">
                <label class="form-check-label" for="modalInvoiceClosed">
                  Fatura Fechada
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="confirmCreditCardBtn">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Append modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Cache DOM elements for better performance
  cacheDOMElements();
  
  // Set up event listeners
  setupCreditCardFormModalListeners();

  // Show the modal
  showCreditCardFormModal();
}

// Helper function to generate due date options
function generateDueDateOptions() {
  let options = '';
  for (let i = 1; i <= 31; i++) {
    options += `<option value="${i}">${i}</option>`;
  }
  return options;
}

// Helper function to generate installment options
function generateInstallmentOptions() {
  let options = '';
  for (let i = 1; i <= 12; i++) {
    options += `<option value="${i}">${i}x</option>`;
  }
  return options;
}

// Cache DOM elements for better performance
function cacheDOMElements() {
  const elements = [
    'creditCardFormModal', 'cardBank', 'customCardNameContainer', 
    'modalCustomCardName', 'modalCardDueDate', 'modalCardType', 
    'modalInstallments', 'modalInvoiceClosed', 'confirmCreditCardBtn'
  ];
  
  elements.forEach(id => {
    domElements[id] = document.getElementById(id);
  });
}

// Function to show the credit card form modal
function showCreditCardFormModal() {
  if (!domElements.creditCardFormModal) {
    cacheDOMElements();
  }
  
  if (domElements.creditCardFormModal) {
    // Reset form to default state
    resetCreditCardForm();
    
    // Show the modal
    const modalInstance = new bootstrap.Modal(domElements.creditCardFormModal);
    modalInstance.show();
  }
}

// Function to reset the credit card form to default values
function resetCreditCardForm() {
  if (domElements.cardBank) {
    domElements.cardBank.value = '';
  }
  
  if (domElements.customCardNameContainer) {
    domElements.customCardNameContainer.style.display = 'none';
  }
  
  if (domElements.modalCustomCardName) {
    domElements.modalCustomCardName.value = '';
  }
  
  if (domElements.modalCardDueDate) {
    domElements.modalCardDueDate.value = '';
  }
  
  if (domElements.modalCardType) {
    domElements.modalCardType.value = 'titular';
  }
  
  if (domElements.modalInstallments) {
    domElements.modalInstallments.value = '1';
  }
  
  if (domElements.modalInvoiceClosed) {
    domElements.modalInvoiceClosed.checked = false;
  }
}

// Function to set up event listeners for the credit card form modal
function setupCreditCardFormModalListeners() {
  if (!domElements.cardBank) {
    cacheDOMElements();
  }
  
  // Show/hide custom card name field based on bank selection
  if (domElements.cardBank && domElements.customCardNameContainer) {
    domElements.cardBank.addEventListener('change', handleCardBankChange);
  }

  // Confirm button event listener
  if (domElements.confirmCreditCardBtn) {
    domElements.confirmCreditCardBtn.addEventListener('click', handleConfirmButtonClick);
  }
}

// Handler for card bank change event
function handleCardBankChange() {
  const selectedBank = domElements.cardBank.value;
  
  if (selectedBank === 'outro') {
    domElements.customCardNameContainer.style.display = 'block';
    // Reset due date when selecting "outro"
    domElements.modalCardDueDate.value = '';
  } else {
    domElements.customCardNameContainer.style.display = 'none';
    // Load saved due date for selected bank
    loadSavedDueDate(selectedBank);
  }
}

// Handler for confirm button click
function handleConfirmButtonClick() {
  // Get form data
  const formData = getFormData();
  
  // Validate form
  if (!validateCreditCardForm(formData)) {
    return;
  }

  // Save due date for this card bank
  saveDueDate(formData.cardBank, formData.customCardName, formData.cardDueDate);

  // Transfer values to the main form
  transferValuesToMainForm(formData);

  // Submit the main form automatically
  document.getElementById('transactionForm')?.dispatchEvent(new Event('submit'));

  // Close the modal
  closeModal();
}

// Function to get form data
function getFormData() {
  return {
    cardBank: domElements.cardBank.value,
    customCardName: domElements.modalCustomCardName.value,
    cardDueDate: domElements.modalCardDueDate.value,
    cardType: domElements.modalCardType.value,
    installments: domElements.modalInstallments.value,
    invoiceClosed: domElements.modalInvoiceClosed.checked
  };
}

// Function to close the modal
function closeModal() {
  const modal = bootstrap.Modal.getInstance(domElements.creditCardFormModal);
  if (modal) {
    modal.hide();
  }
}

// Function to validate the credit card form
function validateCreditCardForm(formData) {
  const { cardBank, customCardName, cardDueDate } = formData;
  
  if (!cardBank) {
    showValidationError('Por favor, selecione um banco ou administradora.');
    return false;
  }

  if (cardBank === 'outro' && !customCardName) {
    showValidationError('Por favor, digite o nome do cartão.');
    return false;
  }

  if (!cardDueDate) {
    showValidationError('Por favor, selecione o dia de vencimento.');
    return false;
  }

  return true;
}

// Function to show validation error
function showValidationError(message) {
  alert(message); // Could be improved with a more user-friendly notification
}

// Function to save due date for a card bank
function saveDueDate(cardBank, customCardName, dueDate) {
  // Get card identifier
  const cardId = cardBank === 'outro' ? customCardName.trim().toLowerCase() : cardBank;

  // Don't save if no card id or due date
  if (!cardId || !dueDate) return;

  // Get saved due dates
  const savedDueDates = getStoredDueDates();

  // Save due date for this card
  savedDueDates[cardId] = dueDate;

  // Store in localStorage
  localStorage.setItem(CARD_DUE_DATES_KEY, JSON.stringify(savedDueDates));
}

// Function to get stored due dates
function getStoredDueDates() {
  try {
    return JSON.parse(localStorage.getItem(CARD_DUE_DATES_KEY) || '{}');
  } catch (e) {
    console.error('Error parsing stored due dates:', e);
    return {};
  }
}

// Function to load saved due date for a card bank
function loadSavedDueDate(cardId) {
  if (!cardId) return;

  // Get saved due dates
  const savedDueDates = getStoredDueDates();

  // Set due date if saved
  if (savedDueDates[cardId]) {
    domElements.modalCardDueDate.value = savedDueDates[cardId];
  } else {
    domElements.modalCardDueDate.value = '';
  }
}

// Function to transfer values from modal to main form
function transferValuesToMainForm(formData) {
  const { cardBank, customCardName, cardDueDate, cardType, installments, invoiceClosed } = formData;
  
  // Set values in the main form
  setFormFieldValue('cardType', cardType);
  setFormFieldValue('installments', installments);
  setFormFieldCheckbox('invoiceClosed', invoiceClosed);
  setFormFieldValue('cardDueDate', cardDueDate);

  // Handle custom card name field
  const customCardNameField = document.getElementById('customCardName');
  const customCardNameContainer = document.querySelector('.custom-card-name');
  
  if (customCardNameField && customCardNameContainer) {
    if (cardBank === 'outro') {
      customCardNameField.value = customCardName;
      customCardNameContainer.style.display = 'block';
    } else {
      // Get the display text of the selected bank instead of its value
      const selectedBankText = domElements.cardBank.options[domElements.cardBank.selectedIndex].text;
      customCardNameField.value = selectedBankText;
      customCardNameContainer.style.display = 'none';
    }
  }
}

// Helper function to set form field value
function setFormFieldValue(fieldId, value) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.value = value;
  }
}

// Helper function to set form field checkbox
function setFormFieldCheckbox(fieldId, checked) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.checked = checked;
  }
}