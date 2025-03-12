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
  
  // Set up listeners for transaction changes
  setupTransactionChangeListeners();
});

// Function to set up listeners for transaction changes
function setupTransactionChangeListeners() {
  // Listen for changes to the transactions array
  if (typeof database !== 'undefined' && typeof firebase !== 'undefined') {
    // When auth state changes and user is logged in
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        const transactionsRef = database.ref(`users/${user.uid}/transactions`);
        
        // Listen for any changes to transactions
        transactionsRef.on('child_added', updateModalData);
        transactionsRef.on('child_changed', updateModalData);
        transactionsRef.on('child_removed', updateModalData);
      }
    });
  }
}

// Function to update all modal data when transactions change
function updateModalData() {
  // Update both modals if they exist
  const creditCardModal = document.getElementById('creditCardModal');
  const checkingAccountModal = document.getElementById('checkingAccountModal');
  
  if (creditCardModal) {
    updateCreditCardModalData();
  }
  
  if (checkingAccountModal) {
    updateCheckingAccountModalData();
  }
}

// Filter credit card transactions in the modal by card type
function filterModalCardTransactions(cardType) {
  // Update active button state
  const buttons = [
    document.getElementById('modalCardFilterAll'),
    document.getElementById('modalCardFilterTitular'),
    document.getElementById('modalCardFilterAdicional1'),
    document.getElementById('modalCardFilterAdicional2')
  ];
  
  // Make sure all buttons exist before proceeding
  if (buttons.some(btn => !btn)) {
    console.error('Modal card filter buttons not found in the DOM');
    return;
  }
  
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Set active class on selected button
  switch(cardType) {
    case 'all':
      document.getElementById('modalCardFilterAll').classList.add('active');
      break;
    case 'titular':
      document.getElementById('modalCardFilterTitular').classList.add('active');
      break;
    case 'adicional1':
      document.getElementById('modalCardFilterAdicional1').classList.add('active');
      break;
    case 'adicional2':
      document.getElementById('modalCardFilterAdicional2').classList.add('active');
      break;
  }
  
  // Filter transactions
  const rows = document.querySelectorAll('#modalCreditCardTransactionsList tr');
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
  updateModalCardSubtotal(subtotal, cardType);
}

// Update card subtotal display in the modal
function updateModalCardSubtotal(amount, cardType) {
  const subtotalElement = document.getElementById('modalCardTypeSubtotal');
  if (!subtotalElement) return;
  
  let cardTypeLabel = '';
  
  switch(cardType) {
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

// Function to show the Credit Card modal
function showCreditCardModal() {
  // Get the modal element
  const modal = document.getElementById('creditCardModal');
  
  // Create a new Bootstrap modal instance if it doesn't exist
  if (!modal) {
    createCreditCardModal();
  } else {
    // Update modal data before showing it
    updateCreditCardModalData();
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
    // Update modal data before showing it
    updateCheckingAccountModalData();
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
      <div class="modal-dialog modal-dialog-centered modal-lg">
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
                  <span class="fw-bold text-danger" id="modalCreditCardTotal">R$ 0,00</span>
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
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title d-flex align-items-center justify-content-between">
                  <span class="me-2">Transações</span>
                  <div class="btn-group" role="group" aria-label="Filtro de cartões">
                    <button type="button" class="btn btn-sm btn-outline-danger active" id="modalCardFilterAll">Todos</button>
                    <button type="button" class="btn btn-sm btn-outline-success" id="modalCardFilterTitular">Titular</button>
                    <button type="button" class="btn btn-sm btn-outline-warning" id="modalCardFilterAdicional1">Adic#1</button>
                    <button type="button" class="btn btn-sm btn-outline-primary" id="modalCardFilterAdicional2">Adic#2</button>
                  </div>
                </h5>
                <div id="modalCardTypeSubtotal" class="mb-2 text-end fw-bold"></div>
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th scope="col">Data</th>
                        <th scope="col">Descrição</th>
                        <th scope="col">Categoria</th>
                        <th scope="col">Valor</th>
                      </tr>
                    </thead>
                    <tbody id="modalCreditCardTransactionsList" class="align-middle"></tbody>
                  </table>
                </div>
                <div id="modalCreditCardDeleteBtnContainer" class="mt-3 text-center"></div>
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
  
  // Set up filter buttons
  document.getElementById('modalCardFilterAll').addEventListener('click', () => filterModalCardTransactions('all'));
  document.getElementById('modalCardFilterTitular').addEventListener('click', () => filterModalCardTransactions('titular'));
  document.getElementById('modalCardFilterAdicional1').addEventListener('click', () => filterModalCardTransactions('adicional1'));
  document.getElementById('modalCardFilterAdicional2').addEventListener('click', () => filterModalCardTransactions('adicional2'));
  
  // Update modal data
  updateCreditCardModalData();
  
  modalInstance.show();
}

// Function to create the Checking Account modal if it doesn't exist
function createCheckingAccountModal() {
  // Create modal element
  const modalHTML = `
    <div class="modal fade" id="checkingAccountModal" tabindex="-1" aria-labelledby="checkingAccountModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary bg-opacity-10">
            <h5 class="modal-title" id="checkingAccountModalLabel">
              <i class="bi bi-bank2 me-2 text-primary"></i>Detalhes de Outros
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <div class="card mb-3">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted">Resumo das despesas</h6>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span>Saldo Atual:</span>
                  <span class="fw-bold text-danger" id="modalCheckingAccountTotal">R$ 0,00</span>
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
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title">Transações</h5>
                <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th scope="col">Data</th>
                        <th scope="col">Descrição</th>
                        <th scope="col">Categoria</th>
                        <th scope="col">Valor</th>
                        <th scope="col text-center">Pago</th>
                      </tr>
                    </thead>
                    <tbody id="modalTransactionsList" class="align-middle"></tbody>
                  </table>
                </div>
                <div id="modalRegularDeleteBtnContainer" class="mt-3 text-center"></div>
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
  
  // Calculate subtotals for each card type
  let titularTotal = 0;
  let adicional1Total = 0;
  let adicional2Total = 0;
  
  // Make sure the global transactions array exists and is accessible
  if (typeof transactions !== 'undefined' && Array.isArray(transactions)) {
    // Clear the modal transactions list
    const modalCreditCardTransactionsList = document.getElementById('modalCreditCardTransactionsList');
    if (modalCreditCardTransactionsList) {
      modalCreditCardTransactionsList.innerHTML = '';
      
      // Filter and render credit card transactions
      const creditCardTransactions = transactions.filter(t => t.type === 'credit_card');
      
      // Sort transactions by date (newest first)
      creditCardTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Render each transaction in the modal
      creditCardTransactions.forEach(transaction => {
        if (transaction.type === "credit_card") {
          // Add to card type totals
          switch(transaction.cardType) {
            case "titular":
              titularTotal += transaction.amount;
              break;
            case "adicional1":
              adicional1Total += transaction.amount;
              break;
            case "adicional2":
              adicional2Total += transaction.amount;
              break;
          }
          
          // Create transaction row
          const row = createTransactionRow(transaction);
          modalCreditCardTransactionsList.appendChild(row);
        }
      });
      
      // Add delete button for credit card transactions
      const modalCreditCardDeleteBtnContainer = document.getElementById('modalCreditCardDeleteBtnContainer');
      if (modalCreditCardDeleteBtnContainer) {
        modalCreditCardDeleteBtnContainer.innerHTML = '';
        
        const creditCardDeleteBtn = document.createElement('button');
        creditCardDeleteBtn.id = 'deleteCreditCardTransactionBtn';
        creditCardDeleteBtn.className = 'btn btn-danger mt-3 d-flex align-items-center mx-auto';
        creditCardDeleteBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Excluir';
        creditCardDeleteBtn.disabled = true;
        creditCardDeleteBtn.addEventListener('click', function(event) {
          deleteSelectedTransaction(event);
        });
        modalCreditCardDeleteBtnContainer.appendChild(creditCardDeleteBtn);
      }
      
      // Apply current filter
      filterModalCardTransactions('all');
    }
  }
  
  // Update the modal with card type subtotals
  const titularElement = document.getElementById('modalCreditCardTitular');
  const adicional1Element = document.getElementById('modalCreditCardAdicional1');
  const adicional2Element = document.getElementById('modalCreditCardAdicional2');
  
  if (titularElement) {
    titularElement.textContent = formatCurrency(titularTotal);
  }
  
  if (adicional1Element) {
    adicional1Element.textContent = formatCurrency(adicional1Total);
  }
  
  if (adicional2Element) {
    adicional2Element.textContent = formatCurrency(adicional2Total);
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
  
  // Calculate pending and paid transactions
  let pendingCount = 0;
  let paidCount = 0;
  
  // Make sure the global transactions array exists and is accessible
  if (typeof transactions !== 'undefined' && Array.isArray(transactions)) {
    // Clear the modal transactions list
    const modalTransactionsList = document.getElementById('modalTransactionsList');
    if (modalTransactionsList) {
      modalTransactionsList.innerHTML = '';
      
      // Filter and render checking account transactions
      const checkingAccountTransactions = transactions.filter(t => t.type !== 'credit_card');
      
      // Sort transactions by date (newest first)
      checkingAccountTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Render each transaction in the modal
      checkingAccountTransactions.forEach(transaction => {
        if (transaction.type !== 'credit_card') {
          // Count paid and pending transactions
          if (transaction.isPaid) {
            paidCount++;
          } else {
            pendingCount++;
          }
          
          // Create transaction row
          const row = createTransactionRow(transaction);
          modalTransactionsList.appendChild(row);
        }
      });
      
      // Add delete button for regular transactions
      const modalRegularDeleteBtnContainer = document.getElementById('modalRegularDeleteBtnContainer');
      if (modalRegularDeleteBtnContainer) {
        modalRegularDeleteBtnContainer.innerHTML = '';
        
        const regularDeleteBtn = document.createElement('button');
        regularDeleteBtn.id = 'deleteRegularTransactionBtn';
        regularDeleteBtn.className = 'btn btn-danger mt-3 d-flex align-items-center mx-auto';
        regularDeleteBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Excluir';
        regularDeleteBtn.disabled = true;
        regularDeleteBtn.addEventListener('click', function(event) {
          deleteSelectedTransaction(event);
        });
        modalRegularDeleteBtnContainer.appendChild(regularDeleteBtn);
      }
    }
  }
  
  // Update the modal with transaction counts
  const pendingElement = document.getElementById('modalCheckingAccountPending');
  const paidElement = document.getElementById('modalCheckingAccountPaid');
  
  if (pendingElement) {
    pendingElement.textContent = pendingCount;
  }
  
  if (paidElement) {
    paidElement.textContent = paidCount;
  }
}

// Helper function to format currency (copied from app.js)
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: "currency",
    currency: "BRL",
  }).format(value);
}