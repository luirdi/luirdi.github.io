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
            <button type="button" class="btn btn-danger" id="deleteCurrentOnlyBtn">Excluir apenas este</button>
            <button type="button" class="btn btn-danger" id="deleteAllRelatedBtn">Excluir este e futuros</button>
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

  // For installment transactions
  if (transaction.isInstallment && transaction.totalInstallments > 1) {
    return transactions
      .filter(t => 
        t.description === transaction.description && 
        t.isInstallment && 
        t.totalInstallments === transaction.totalInstallments &&
        t.installmentNumber >= transaction.installmentNumber
      )
      .map(t => t.id);
  }
  
  // For recurring transactions
  if (transaction.isRecurring && transaction.totalInstallments > 1) {
    return transactions
      .filter(t => 
        t.description === transaction.description && 
        t.isRecurring && 
        t.totalInstallments === transaction.totalInstallments &&
        t.installmentNumber >= transaction.installmentNumber
      )
      .map(t => t.id);
  }

  // If not part of a series, just return the current transaction ID
  return [transaction.id];
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