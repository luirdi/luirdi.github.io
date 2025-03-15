// Credit Card Modal functionality

// Constants for localStorage
const CARD_DUE_DATES_KEY = 'cardDueDates';

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
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                  <option value="13">13</option>
                  <option value="14">14</option>
                  <option value="15">15</option>
                  <option value="16">16</option>
                  <option value="17">17</option>
                  <option value="18">18</option>
                  <option value="19">19</option>
                  <option value="20">20</option>
                  <option value="21">21</option>
                  <option value="22">22</option>
                  <option value="23">23</option>
                  <option value="24">24</option>
                  <option value="25">25</option>
                  <option value="26">26</option>
                  <option value="27">27</option>
                  <option value="28">28</option>
                  <option value="29">29</option>
                  <option value="30">30</option>
                  <option value="31">31</option>
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
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                  <option value="4">4x</option>
                  <option value="5">5x</option>
                  <option value="6">6x</option>
                  <option value="7">7x</option>
                  <option value="8">8x</option>
                  <option value="9">9x</option>
                  <option value="10">10x</option>
                  <option value="11">11x</option>
                  <option value="12">12x</option>
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

  // Set up event listeners
  setupCreditCardFormModalListeners();

  // Show the modal
  showCreditCardFormModal();
}

// Function to show the credit card form modal
function showCreditCardFormModal() {
  const modal = document.getElementById('creditCardFormModal');
  if (modal) {
    // Reset form fields to default values
    const cardBankSelect = document.getElementById('cardBank');
    if (cardBankSelect) {
      cardBankSelect.value = ''; // Reset to default "Selecione uma opção"

      // Hide custom card name field
      const customCardNameContainer = document.getElementById('customCardNameContainer');
      if (customCardNameContainer) {
        customCardNameContainer.style.display = 'none';
      }

      // Reset custom card name input
      const customCardNameInput = document.getElementById('modalCustomCardName');
      if (customCardNameInput) {
        customCardNameInput.value = '';
      }
    }

    // Reset due date
    const modalCardDueDate = document.getElementById('modalCardDueDate');
    if (modalCardDueDate) {
      modalCardDueDate.value = '';
    }

    // Reset other fields to defaults
    const modalCardType = document.getElementById('modalCardType');
    if (modalCardType) {
      modalCardType.value = 'titular';
    }

    const modalInstallments = document.getElementById('modalInstallments');
    if (modalInstallments) {
      modalInstallments.value = '1';
    }

    const modalInvoiceClosed = document.getElementById('modalInvoiceClosed');
    if (modalInvoiceClosed) {
      modalInvoiceClosed.checked = false;
    }

    // Show the modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }
}

// Function to set up event listeners for the credit card form modal
function setupCreditCardFormModalListeners() {
  // Show/hide custom card name field based on bank selection
  const cardBankSelect = document.getElementById('cardBank');
  const customCardNameContainer = document.getElementById('customCardNameContainer');
  const modalCardDueDate = document.getElementById('modalCardDueDate');

  if (cardBankSelect && customCardNameContainer) {
    cardBankSelect.addEventListener('change', function () {
      if (this.value === 'outro') {
        customCardNameContainer.style.display = 'block';
        // Reset due date when selecting "outro"
        modalCardDueDate.value = '';
      } else {
        customCardNameContainer.style.display = 'none';
        // Load saved due date for selected bank
        loadSavedDueDate(this.value);
      }
    });
  }

  // Confirm button event listener
  const confirmBtn = document.getElementById('confirmCreditCardBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function () {
      // Get values from modal form
      const cardBank = document.getElementById('cardBank').value;
      const customCardName = document.getElementById('modalCustomCardName').value;
      const cardDueDate = document.getElementById('modalCardDueDate').value;
      const cardType = document.getElementById('modalCardType').value;
      const installments = document.getElementById('modalInstallments').value;
      const invoiceClosed = document.getElementById('modalInvoiceClosed').checked;

      // Validate form
      if (!validateCreditCardForm(cardBank, customCardName, cardDueDate)) {
        return;
      }

      // Save due date for this card bank
      saveDueDate(cardBank, customCardName, cardDueDate);

      // Transfer values to the main form
      transferValuesToMainForm(cardBank, customCardName, cardDueDate, cardType, installments, invoiceClosed);

      // Submit the main form automatically
      document.getElementById('transactionForm').dispatchEvent(new Event('submit'));

      // Close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('creditCardFormModal'));
      if (modal) {
        modal.hide();
      }
    });
  }
}

// Function to validate the credit card form
function validateCreditCardForm(cardBank, customCardName, cardDueDate) {
  if (!cardBank) {
    alert('Por favor, selecione um banco ou administradora.');
    return false;
  }

  if (cardBank === 'outro' && !customCardName) {
    alert('Por favor, digite o nome do cartão.');
    return false;
  }

  if (!cardDueDate) {
    alert('Por favor, selecione o dia de vencimento.');
    return false;
  }

  return true;
}

// Function to save due date for a card bank
function saveDueDate(cardBank, customCardName, dueDate) {
  // Get card identifier
  const cardId = cardBank === 'outro' ? customCardName.trim().toLowerCase() : cardBank;

  // Don't save if no card id or due date
  if (!cardId || !dueDate) return;

  // Get saved due dates
  const savedDueDates = JSON.parse(localStorage.getItem(CARD_DUE_DATES_KEY) || '{}');

  // Save due date for this card
  savedDueDates[cardId] = dueDate;

  // Store in localStorage
  localStorage.setItem(CARD_DUE_DATES_KEY, JSON.stringify(savedDueDates));
}

// Function to load saved due date for a card bank
function loadSavedDueDate(cardId) {
  if (!cardId) return;

  // Get saved due dates
  const savedDueDates = JSON.parse(localStorage.getItem(CARD_DUE_DATES_KEY) || '{}');

  // Get due date select element
  const modalCardDueDate = document.getElementById('modalCardDueDate');

  // Set due date if saved
  if (savedDueDates[cardId]) {
    modalCardDueDate.value = savedDueDates[cardId];
  } else {
    modalCardDueDate.value = '';
  }
}

// Function to transfer values from modal to main form
function transferValuesToMainForm(cardBank, customCardName, cardDueDate, cardType, installments, invoiceClosed) {
  // Set values in the main form
  if (document.getElementById('cardType')) {
    document.getElementById('cardType').value = cardType;
  }

  if (document.getElementById('installments')) {
    document.getElementById('installments').value = installments;
  }

  if (document.getElementById('invoiceClosed')) {
    document.getElementById('invoiceClosed').checked = invoiceClosed;
  }

  if (document.getElementById('cardDueDate')) {
    document.getElementById('cardDueDate').value = cardDueDate;
  }

  // Handle custom card name field
  if (document.getElementById('customCardName')) {
    if (cardBank === 'outro') {
      document.getElementById('customCardName').value = customCardName;
      document.querySelector('.custom-card-name').style.display = 'block';
    } else {
      document.getElementById('customCardName').value = cardBank;
      document.querySelector('.custom-card-name').style.display = 'none';
    }
  }
}