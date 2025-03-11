// Delete confirmation modal functionality

// Create and append the modal to the document body
function createDeleteConfirmationModal() {
  // Check if modal already exists
  if (document.getElementById('deleteConfirmationModal')) {
    return;
  }

  const modalHTML = `
    <div class="modal fade" id="deleteConfirmationModal" tabindex="-1" aria-labelledby="deleteConfirmationModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteConfirmationModalLabel">Confirmar Exclusão</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <p id="deleteConfirmationMessage">Como deseja excluir esta transação?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" id="deleteCurrentOnlyBtn">Excluir</button>
            <button type="button" class="btn btn-outline-danger" id="deleteAllRelatedBtn">Excluir TUDO!</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild);

  // Initialize the modal
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));

  // Add event listeners to the buttons
  document.getElementById('deleteCurrentOnlyBtn').addEventListener('click', () => {
    const transactionId = deleteModal._element.dataset.transactionId;
    const transactionType = deleteModal._element.dataset.transactionType;
    
    if (transactionId) {
      performDelete([transactionId], transactionType);
      deleteModal.hide();
    }
  });

  document.getElementById('deleteAllRelatedBtn').addEventListener('click', () => {
    const transactionId = deleteModal._element.dataset.transactionId;
    const transactionType = deleteModal._element.dataset.transactionType;
    
    if (transactionId) {
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        const relatedTransactions = findRelatedTransactions(transaction);
        performDelete(relatedTransactions, transactionType);
      }
      deleteModal.hide();
    }
  });

  return deleteModal;
}

// Find related transactions (future installments or recurring payments)
function findRelatedTransactions(transaction) {
  if (!transaction) return [transaction.id];
  
  // Initialize with the current transaction ID
  let relatedIds = [transaction.id];
  
  // For installment or recurring transactions, query the database directly
  if ((transaction.isInstallment || transaction.isRecurring) && transaction.totalInstallments > 1) {
    // Return the current ID immediately, but also start an async process to delete future transactions
    // This ensures the current transaction is deleted right away
    
    // Create a query to find all related transactions across all months
    const transactionsRef = database.ref(`users/${currentUserId}/transactions`);
    
    // Query parameters to match related transactions
    const queryParams = {
      description: transaction.description,
      totalInstallments: transaction.totalInstallments
    };
    
    // Determine if we're dealing with installment or recurring transactions
    if (transaction.isInstallment) {
      queryParams.isInstallment = true;
    } else {
      queryParams.isRecurring = true;
    }
    
    // Execute the query to find all related transactions
    transactionsRef.once('value', (snapshot) => {
      const allTransactions = snapshot.val();
      if (!allTransactions) return;
      
      const relatedTransactionIds = [];
      
      // Filter transactions that match our criteria
      Object.keys(allTransactions).forEach(key => {
        const t = allTransactions[key];
        
        // Check if this is a related transaction with an installment number >= the current one
        if (t.description === queryParams.description && 
            ((queryParams.isInstallment && t.isInstallment) || 
             (queryParams.isRecurring && t.isRecurring)) && 
            t.totalInstallments === queryParams.totalInstallments && 
            t.installmentNumber >= transaction.installmentNumber) {
          
          relatedTransactionIds.push(key);
        }
      });
      
      // If we found related transactions, delete them
      if (relatedTransactionIds.length > 0) {
        performDelete(relatedTransactionIds, transaction.type);
      }
    });
  }
  
  // Return the current transaction ID so it gets deleted immediately
  return relatedIds;
}

// Show the delete confirmation modal
function showDeleteConfirmation(transactionId) {
  if (!currentUserId) {
    alert("Por favor, faça login para excluir transações.");
    return;
  }

  const transaction = transactions.find(t => t.id === transactionId);
  if (!transaction) return;

  // Create the modal if it doesn't exist
  const deleteModal = createDeleteConfirmationModal();
  
  // Set the transaction ID as a data attribute on the modal
  const modalElement = document.getElementById('deleteConfirmationModal');
  modalElement.dataset.transactionId = transactionId;
  modalElement.dataset.transactionType = transaction.type;

  // Update the confirmation message
  let confirmMessage = "Como deseja excluir esta transação?";
  
  // Check if it's part of a series (installment or recurring)
  if ((transaction.isInstallment || transaction.isRecurring) && 
      transaction.totalInstallments > 1 && 
      transaction.installmentNumber < transaction.totalInstallments) {
    
    const remainingCount = transaction.totalInstallments - transaction.installmentNumber;
    const seriesType = transaction.isInstallment ? "parcela" : "pagamento recorrente";
    
    confirmMessage = `Esta transação é parte de um ${seriesType}. ` +
                    `Existem mais ${remainingCount} lançamentos futuros relacionados.`;
    
    // Show both delete buttons
    document.getElementById('deleteCurrentOnlyBtn').style.display = 'block';
    document.getElementById('deleteAllRelatedBtn').style.display = 'block';
  } else {
    // Not part of a series or last in series, hide the "delete all related" button
    document.getElementById('deleteCurrentOnlyBtn').style.display = 'block';
    document.getElementById('deleteAllRelatedBtn').style.display = 'none';
  }
  
  document.getElementById('deleteConfirmationMessage').textContent = confirmMessage;
  
  // Show the modal
  const bsModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
  bsModal.show();
}

// Perform the actual deletion
function performDelete(transactionIds, transactionType) {
  if (!currentUserId || transactionIds.length === 0) return;

  const deletePromises = transactionIds.map(id => {
    return database.ref(`users/${currentUserId}/transactions/${id}`).remove();
  });

  Promise.all(deletePromises)
    .then(() => {
      // Remove deleted transactions from selection if they were selected
      selectedTransactions = selectedTransactions.filter(
        id => !transactionIds.includes(id)
      );

      // Update delete buttons
      updateDeleteButtons();
    })
    .catch(error => {
      alert("Erro ao excluir transações: " + error.message);
      console.error("Failed to delete transactions:", error);
    });
}

// Replace the existing deleteTransaction function
function deleteTransaction(id) {
  showDeleteConfirmation(id);
}