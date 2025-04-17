// Card Payment Modal functionality

// Function to create and show the card payment modal
function createCardPaymentModal() {
          // Create modal element if it doesn't exist
          if (document.getElementById('cardPaymentModal')) {
                    return showCardPaymentModal();
          }

          const modalHTML = `
    <div class="modal fade" id="cardPaymentModal" tabindex="-1" aria-labelledby="cardPaymentModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-success bg-opacity-10">
            <h5 class="modal-title" id="cardPaymentModalLabel">
              <i class="bi bi-check-circle-fill me-2 text-success"></i>Marcar Cartões como Pagos
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <i class="bi bi-info-circle-fill me-2"></i>
              Selecione os cartões que foram pagos neste mês. Isso ajudará a manter seu controle financeiro atualizado.
            </div>
            <div id="cardPaymentList" class="row g-3">
              <!-- Card groups will be dynamically inserted here -->
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-success" id="confirmCardPaymentBtn">
              <i class="bi bi-check-lg me-2"></i>Confirmar Pagamentos
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

          // Append modal to body
          document.body.insertAdjacentHTML('beforeend', modalHTML);

          // Set up event listeners
          setupCardPaymentModalListeners();

          // Show the modal
          showCardPaymentModal();
}

// Function to show the card payment modal
function showCardPaymentModal() {
          const modal = document.getElementById('cardPaymentModal');
          if (modal) {
                    // Populate the modal with card data before showing it
                    populateCardPaymentModal();

                    // Show the modal
                    const modalInstance = new bootstrap.Modal(modal);
                    modalInstance.show();
          }
}

// Function to set up event listeners for the card payment modal
function setupCardPaymentModalListeners() {
          // Confirm button event listener
          const confirmBtn = document.getElementById('confirmCardPaymentBtn');
          if (confirmBtn) {
                    confirmBtn.addEventListener('click', handleCardPaymentConfirm);
          }

          // Add event listeners to checkboxes for real-time visual feedback
          setTimeout(() => {
                    const checkboxes = document.querySelectorAll('#cardPaymentList input[type="checkbox"]');
                    checkboxes.forEach(checkbox => {
                              checkbox.addEventListener('change', updateCardVisualStatus);
                    });
          }, 100);
}

// Function to populate the card payment modal with card data
function populateCardPaymentModal() {
          const cardPaymentList = document.getElementById('cardPaymentList');
          if (!cardPaymentList) return;

          // Clear existing content
          cardPaymentList.innerHTML = '';

          // Make sure the global transactions array exists and is accessible
          if (typeof transactions === 'undefined' || !Array.isArray(transactions)) {
                    cardPaymentList.innerHTML = '<div class="col-12"><div class="alert alert-warning">Não foi possível carregar os dados dos cartões.</div></div>';
                    return;
          }

          // Get credit card transactions for the current month
          const creditCardTransactions = transactions.filter(t => t.type === 'credit_card');

          // Group transactions by card issuer (bank)
          const cardGroups = {};

          creditCardTransactions.forEach(transaction => {
                    const cardName = transaction.customCardName || 'Outro';

                    if (!cardGroups[cardName]) {
                              cardGroups[cardName] = {
                                        name: cardName,
                                        total: 0,
                                        transactions: [],
                                        allPaid: true // Inicializa como true e será alterado para false se alguma transação não estiver paga
                              };
                    }

                    cardGroups[cardName].total += transaction.amount;
                    cardGroups[cardName].transactions.push(transaction);

                    // Se alguma transação não estiver paga, marca o grupo como não pago completamente
                    if (transaction.isPaid !== true) {
                              cardGroups[cardName].allPaid = false;
                    }
          });

          // Armazenar os grupos de cartões para uso posterior
          window.cardPaymentGroups = cardGroups;

          // Create card group elements
          Object.values(cardGroups).forEach(group => {
                    const cardGroupElement = document.createElement('div');
                    cardGroupElement.className = 'col-md-6 col-lg-6';

                    // Check if all transactions in this group are paid
                    const allPaid = group.transactions.every(t => t.isPaid === true);

                    cardGroupElement.innerHTML = `
      <div class="card h-100">
        <div class="card-header d-flex justify-content-between align-items-center ${group.allPaid ? 'bg-success bg-opacity-10' : ''}">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="card-${group.name.replace(/\s+/g, '-').toLowerCase()}" 
                   data-card-name="${group.name}" data-card-total="${group.total}" ${group.allPaid ? 'checked' : ''}>
            <label class="form-check-label fw-bold" for="card-${group.name.replace(/\s+/g, '-').toLowerCase()}">
              ${group.name} ${group.allPaid ? '<i class="bi bi-check-circle-fill text-success ms-1"></i>' : ''}
            </label>
          </div>
          <span class="badge ${group.allPaid ? 'bg-success' : 'bg-danger'}">${formatCurrency(group.total)}</span>
        </div>
        <div class="card-body">
          <ul class="list-group list-group-flush">
            ${group.transactions.slice(0, 5).map(t => `
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <small class="text-truncate" style="max-width: 70%;">${capitalizeWords(t.description)}</small>
                <small>${formatCurrency(t.amount)}</small>
              </li>
            `).join('')}
            ${group.transactions.length > 5 ? `
              <li class="list-group-item text-center text-muted">
                <small>+ ${group.transactions.length - 5} transações</small>
              </li>
            ` : ''}
          </ul>
        </div>
      </div>
    `;

                    cardPaymentList.appendChild(cardGroupElement);
          });

          // If no cards found
          if (Object.keys(cardGroups).length === 0) {
                    cardPaymentList.innerHTML = '<div class="col-12"><div class="alert alert-info">Não há cartões de crédito para o mês atual.</div></div>';
          }
}

// Function to update card visual status when checkbox is changed
function updateCardVisualStatus(event) {
          const checkbox = event.target;
          const cardName = checkbox.dataset.cardName;
          const cardTotal = parseFloat(checkbox.dataset.cardTotal || 0);
          const cardElement = checkbox.closest('.card');
          const cardHeader = cardElement.querySelector('.card-header');
          const cardLabel = cardElement.querySelector('.form-check-label');
          const cardBadge = cardElement.querySelector('.badge');

          // Atualizar o valor da dívida atual no dashboard
          const totalExpensesElement = document.getElementById('totalExpenses');
          const totalPaidExpensesElement = document.getElementById('totalPaidExpenses');
          const totalCreditCardElement = document.getElementById('totalCreditCard');

          if (checkbox.checked) {
                    // Marcado como pago
                    cardHeader.classList.add('bg-success', 'bg-opacity-10');
                    cardBadge.classList.remove('bg-danger');
                    cardBadge.classList.add('bg-success');

                    // Adicionar ícone de verificação se não existir
                    if (!cardLabel.querySelector('.bi-check-circle-fill')) {
                              cardLabel.innerHTML = `${cardName} <i class="bi bi-check-circle-fill text-success ms-1"></i>`;
                    }

                    // Atualizar valores no dashboard (simulação visual até confirmação)
                    if (totalPaidExpensesElement && totalExpensesElement && totalCreditCardElement) {
                              // Obter valores atuais
                              const currentPaidValue = parseFloat(totalPaidExpensesElement.dataset.value || 0);
                              const currentExpensesValue = parseFloat(totalExpensesElement.dataset.value || 0);
                              const currentCreditCardValue = parseFloat(totalCreditCardElement.dataset.value || 0);

                              // Adicionar o valor do cartão às despesas pagas
                              const newPaidValue = currentPaidValue + cardTotal;
                              totalPaidExpensesElement.dataset.value = newPaidValue.toString();
                              totalPaidExpensesElement.textContent = formatCurrency(newPaidValue);

                              // Atualizar o visual do dashboard
                              updateDashboardVisuals();
                    }
          } else {
                    // Desmarcado como não pago
                    cardHeader.classList.remove('bg-success', 'bg-opacity-10');
                    cardBadge.classList.remove('bg-success');
                    cardBadge.classList.add('bg-danger');

                    // Remover ícone de verificação
                    cardLabel.innerHTML = cardName;

                    // Atualizar valores no dashboard (simulação visual até confirmação)
                    if (totalPaidExpensesElement && totalExpensesElement && totalCreditCardElement) {
                              // Obter valores atuais
                              const currentPaidValue = parseFloat(totalPaidExpensesElement.dataset.value || 0);
                              const currentExpensesValue = parseFloat(totalExpensesElement.dataset.value || 0);
                              const currentCreditCardValue = parseFloat(totalCreditCardElement.dataset.value || 0);

                              // Remover o valor do cartão das despesas pagas
                              const newPaidValue = Math.max(0, currentPaidValue - cardTotal);
                              totalPaidExpensesElement.dataset.value = newPaidValue.toString();
                              totalPaidExpensesElement.textContent = formatCurrency(newPaidValue);

                              // Atualizar o visual do dashboard
                              updateDashboardVisuals();
                    }
          }
}

// Função auxiliar para atualizar os visuais do dashboard
function updateDashboardVisuals() {
          // Atualiza os elementos visuais do dashboard com base nos valores atuais
          const totalExpensesElement = document.getElementById('totalExpenses');
          const totalPaidExpensesElement = document.getElementById('totalPaidExpenses');
          const totalCreditCardElement = document.getElementById('totalCreditCard');

          if (totalExpensesElement && totalPaidExpensesElement && totalCreditCardElement) {
                    // Obter valores atuais
                    const paidValue = parseFloat(totalPaidExpensesElement.dataset.value || 0);
                    const expensesValue = parseFloat(totalExpensesElement.dataset.value || 0);
                    const creditCardValue = parseFloat(totalCreditCardElement.dataset.value || 0);

                    // Atualizar o texto dos elementos
                    totalPaidExpensesElement.textContent = formatCurrency(paidValue);

                    // Se todas as despesas estiverem pagas, atualizar o estilo
                    if (paidValue >= expensesValue) {
                              totalExpensesElement.classList.remove('text-danger');
                              totalExpensesElement.classList.add('text-success');
                    } else {
                              totalExpensesElement.classList.remove('text-success');
                              totalExpensesElement.classList.add('text-danger');
                    }

                    // Atualizar a visualização do valor total de cartões de crédito
                    // Se todos os cartões estiverem pagos, mostrar em verde
                    const allCardCheckboxes = document.querySelectorAll('#cardPaymentList input[type="checkbox"]');
                    const allChecked = Array.from(allCardCheckboxes).every(checkbox => checkbox.checked);

                    if (allChecked && allCardCheckboxes.length > 0) {
                              totalCreditCardElement.classList.remove('text-danger');
                              totalCreditCardElement.classList.add('text-success');
                    } else {
                              totalCreditCardElement.classList.remove('text-success');
                              totalCreditCardElement.classList.add('text-danger');
                    }
          }
}

// Function to handle card payment confirmation
function handleCardPaymentConfirm() {
          if (!currentUserId) {
                    alert('Por favor, faça login para atualizar o status de pagamento.');
                    return;
          }

          // Get all card checkboxes
          const allCardCheckboxes = document.querySelectorAll('#cardPaymentList input[type="checkbox"]');

          if (allCardCheckboxes.length === 0) {
                    alert('Não há cartões disponíveis para atualizar.');
                    return;
          }

          // Separate checked and unchecked cards
          const checkedCards = [];
          const uncheckedCards = [];

          allCardCheckboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                              checkedCards.push(checkbox);
                    } else {
                              uncheckedCards.push(checkbox);
                    }
          });

          // Update payment status for all transactions
          const updatePromises = [];
          const transactionsRef = database.ref(`users/${currentUserId}/transactions`);

          // Filter transactions for the current month
          const [currentMonth, currentYear] = getCurrentMonthYear();

          // Process checked cards (mark as paid)
          if (checkedCards.length > 0) {
                    const paidCardNames = Array.from(checkedCards).map(checkbox => checkbox.dataset.cardName);

                    const transactionsToMarkPaid = transactions.filter(transaction => {
                              // Check if transaction is a credit card transaction
                              if (transaction.type !== 'credit_card') return false;

                              // Check if the card name matches one of the selected cards
                              if (!paidCardNames.includes(transaction.customCardName)) return false;

                              // Check if the transaction is for the current month
                              const dateToCheck = transaction.displayDate ? new Date(transaction.displayDate) : new Date(transaction.date);
                              const options = { timeZone: TIMEZONE, month: 'numeric', year: 'numeric' };
                              const transactionDateStr = dateToCheck.toLocaleDateString(LOCALE, options);
                              const [month, year] = transactionDateStr.split('/').map(Number);

                              return month === currentMonth && year === currentYear;
                    });

                    transactionsToMarkPaid.forEach(transaction => {
                              if (transaction.isPaid !== true) { // Só atualiza se não estiver pago
                                        updatePromises.push(
                                                  transactionsRef.child(transaction.id).update({ isPaid: true })
                                        );
                              }
                    });
          }

          // Process unchecked cards (mark as unpaid)
          if (uncheckedCards.length > 0) {
                    const unpaidCardNames = Array.from(uncheckedCards).map(checkbox => checkbox.dataset.cardName);

                    const transactionsToMarkUnpaid = transactions.filter(transaction => {
                              // Check if transaction is a credit card transaction
                              if (transaction.type !== 'credit_card') return false;

                              // Check if the card name matches one of the unselected cards
                              if (!unpaidCardNames.includes(transaction.customCardName)) return false;

                              // Check if the transaction is for the current month
                              const dateToCheck = transaction.displayDate ? new Date(transaction.displayDate) : new Date(transaction.date);
                              const options = { timeZone: TIMEZONE, month: 'numeric', year: 'numeric' };
                              const transactionDateStr = dateToCheck.toLocaleDateString(LOCALE, options);
                              const [month, year] = transactionDateStr.split('/').map(Number);

                              return month === currentMonth && year === currentYear;
                    });

                    transactionsToMarkUnpaid.forEach(transaction => {
                              if (transaction.isPaid === true) { // Só atualiza se estiver pago
                                        updatePromises.push(
                                                  transactionsRef.child(transaction.id).update({ isPaid: false })
                                        );
                              }
                    });
          }

          // Process all updates
          Promise.all(updatePromises)
                    .then(() => {
                              alert(`Status de pagamento dos cartões atualizado com sucesso.`);
                              // Close the modal
                              const modal = bootstrap.Modal.getInstance(document.getElementById('cardPaymentModal'));
                              if (modal) {
                                        modal.hide();
                              }
                    })
                    .catch(error => {
                              alert('Erro ao atualizar status de pagamento: ' + error.message);
                              console.error('Failed to update payment status:', error);
                    });

}

// Add a button to the credit card modal to open the card payment modal
function addPaymentButtonToCreditCardModal() {
          // Check if the credit card modal exists
          const creditCardModal = document.getElementById('creditCardModal');
          if (!creditCardModal) return;

          // Check if the button container already exists
          let buttonContainer = creditCardModal.querySelector('.modal-footer .payment-button-container');

          if (!buttonContainer) {
                    // Create button container
                    buttonContainer = document.createElement('div');
                    buttonContainer.className = 'payment-button-container me-auto';

                    // Create payment button
                    const paymentButton = document.createElement('button');
                    paymentButton.type = 'button';
                    paymentButton.className = 'btn btn-success';
                    paymentButton.innerHTML = '<i class="bi bi-check-circle me-2"></i>Marcar Cartões como Pagos';
                    paymentButton.addEventListener('click', function () {
                              // Close the credit card modal
                              const creditCardModalInstance = bootstrap.Modal.getInstance(creditCardModal);
                              if (creditCardModalInstance) {
                                        creditCardModalInstance.hide();
                              }

                              // Open the card payment modal
                              setTimeout(() => {
                                        createCardPaymentModal();
                              }, 500); // Small delay to ensure the first modal is closed
                    });

                    // Add button to container
                    buttonContainer.appendChild(paymentButton);

                    // Add container to modal footer
                    const modalFooter = creditCardModal.querySelector('.modal-footer');
                    if (modalFooter) {
                              modalFooter.prepend(buttonContainer);
                    }
          }
}

// Modify the createCreditCardModal function to add the payment button
const originalCreateCreditCardModal = window.createCreditCardModal;
window.createCreditCardModal = function () {
          // Call the original function
          originalCreateCreditCardModal();

          // Add the payment button
          setTimeout(addPaymentButtonToCreditCardModal, 100);
};

// Also add the payment button when the modal data is updated
const originalUpdateCreditCardModalData = window.updateCreditCardModalData;
window.updateCreditCardModalData = function () {
          // Call the original function
          originalUpdateCreditCardModalData();

          // Add the payment button
          setTimeout(addPaymentButtonToCreditCardModal, 100);
};