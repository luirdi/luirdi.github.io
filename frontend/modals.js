// Modal functionality for credit card and checking account cards

document.addEventListener('DOMContentLoaded', function() {
  // Get the card elements
  const creditCardElement = document.getElementById('cartaodecredito');
  const checkingAccountElement = document.getElementById('recorrente');
  
  // Add click event listeners to the cards
  if (creditCardElement) {
    creditCardElement.addEventListener('click', function() {
      showCreditCardModal();
    });
    // Add cursor pointer style to indicate it's clickable
    creditCardElement.style.cursor = 'pointer';
  }
  
  if (checkingAccountElement) {
    checkingAccountElement.addEventListener('click', function() {
      showCheckingAccountModal();
    });
    // Add cursor pointer style to indicate it's clickable
    checkingAccountElement.style.cursor = 'pointer';
  }
});

// Function to show the Credit Card modal
function showCreditCardModal() {
  // Get the modal element
  const modal = document.getElementById('creditCardModal');
  
  // Create a new Bootstrap modal instance if it doesn't exist
  if (!modal) {
    createCreditCardModal();
  } else {
    // Show the modal using Bootstrap's modal method
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }
}

// Function to show the Checking Account modal
function showCheckingAccountModal() {
  // Get the modal element
  const modal = document.getElementById('checkingAccountModal');
  
  // Create a new Bootstrap modal instance if it doesn't exist
  if (!modal) {
    createCheckingAccountModal();
  } else {
    // Show the modal using Bootstrap's modal method
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }
}

// Function to create the Credit Card modal if it doesn't exist
function createCreditCardModal() {
  // Create modal element
  const modalHTML = `
    <div class="modal fade" id="creditCardModal" tabindex="-1" aria-labelledby="creditCardModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning bg-opacity-10">
            <h5 class="modal-title" id="creditCardModalLabel">
              <i class="bi bi-credit-card-fill me-2 text-warning"></i>Detalhes do Cartão de Crédito
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <div class="card mb-3">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted">Resumo do Cartão</h6>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Fatura Atual:</span>
                  <span class="fw-bold text-warning" id="modalCreditCardTotal">R$ 0,00</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Titular:</span>
                  <span class="fw-bold text-success" id="modalCreditCardTitular">R$ 0,00</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Adicional #1:</span>
                  <span class="fw-bold text-warning" id="modalCreditCardAdicional1">R$ 0,00</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <span>Adicional #2:</span>
                  <span class="fw-bold text-primary" id="modalCreditCardAdicional2">R$ 0,00</span>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted">Informações Adicionais</h6>
                <p class="card-text">Clique nos botões de filtro na tabela principal para visualizar transações por tipo de cartão.</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Append modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Show the modal
  const modal = document.getElementById('creditCardModal');
  const modalInstance = new bootstrap.Modal(modal);
  
  // Update modal data
  updateCreditCardModalData();
  
  modalInstance.show();
}

// Function to create the Checking Account modal if it doesn't exist
function createCheckingAccountModal() {
  // Create modal element
  const modalHTML = `
    <div class="modal fade" id="checkingAccountModal" tabindex="-1" aria-labelledby="checkingAccountModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-primary bg-opacity-10">
            <h5 class="modal-title" id="checkingAccountModalLabel">
              <i class="bi bi-bank2 me-2 text-primary"></i>Detalhes da Conta Corrente
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <div class="card mb-3">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted">Resumo da Conta</h6>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Saldo Atual:</span>
                  <span class="fw-bold text-primary" id="modalCheckingAccountTotal">R$ 0,00</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Transações Pendentes:</span>
                  <span class="fw-bold" id="modalCheckingAccountPending">0</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <span>Transações Pagas:</span>
                  <span class="fw-bold text-success" id="modalCheckingAccountPaid">0</span>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted">Informações Adicionais</h6>
                <p class="card-text">Visualize todas as transações da conta corrente na tabela principal.</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Append modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Show the modal
  const modal = document.getElementById('checkingAccountModal');
  const modalInstance = new bootstrap.Modal(modal);
  
  // Update modal data
  updateCheckingAccountModalData();
  
  modalInstance.show();
}

// Function to update Credit Card modal data
function updateCreditCardModalData() {
  // Get the total credit card amount from the main UI
  const totalCreditCardElement = document.getElementById('totalCreditCard');
  const modalTotalElement = document.getElementById('modalCreditCardTotal');
  
  if (totalCreditCardElement && modalTotalElement) {
    modalTotalElement.textContent = totalCreditCardElement.textContent;
  }
  
  // You would typically fetch these values from your data source
  // For now, we'll just use placeholder values or try to get them from the UI
  
  // Get card type subtotals if they exist in the UI
  const cardTypeSubtotalElement = document.getElementById('cardTypeSubtotal');
  if (cardTypeSubtotalElement) {
    // This would depend on your app's structure and how you store this data
    // For now, we'll leave the default values
  }
}

// Function to update Checking Account modal data
function updateCheckingAccountModalData() {
  // Get the total checking account amount from the main UI
  const totalCheckingAccountElement = document.getElementById('totalOtherExpenses');
  const modalTotalElement = document.getElementById('modalCheckingAccountTotal');
  
  if (totalCheckingAccountElement && modalTotalElement) {
    modalTotalElement.textContent = totalCheckingAccountElement.textContent;
  }
  
  // You would typically fetch these values from your data source
  // For now, we'll just use placeholder values
  
  // Count transactions in the transactions list if possible
  const transactionsList = document.getElementById('transactionsList');
  if (transactionsList) {
    const allTransactions = transactionsList.querySelectorAll('tr');
    const paidTransactions = transactionsList.querySelectorAll('tr .text-success');
    
    const pendingElement = document.getElementById('modalCheckingAccountPending');
    const paidElement = document.getElementById('modalCheckingAccountPaid');
    
    if (pendingElement && paidElement) {
      pendingElement.textContent = allTransactions.length - paidTransactions.length;
      paidElement.textContent = paidTransactions.length;
    }
  }
}