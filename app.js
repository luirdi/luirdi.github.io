// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDNipGBlG1w1FlCVknNxA3WYv8TMYL85bs",
    authDomain: "finpla-c575c.firebaseapp.com",
    databaseURL: "https://finpla-c575c-default-rtdb.firebaseio.com",
    projectId: "finpla-c575c",
    storageBucket: "finpla-c575c.firebasestorage.app",
    messagingSenderId: "417838979466",
    appId: "1:417838979466:web:91481c276febd368075073",
    measurementId: "G-KS97CRRJ11"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// References
const database = firebase.database();

// DOM Elements
const dashboardContainer = document.getElementById('dashboardContainer');
const transactionForm = document.getElementById('transactionForm');
const transactionsList = document.getElementById('transactionsList');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpenses = document.getElementById('totalExpenses');
const totalCreditCard = document.getElementById('totalCreditCard');
const totalOtherPayments = document.getElementById('totalOtherPayments');

// State variables
let transactions = [];

// Event Listeners
transactionForm.addEventListener('submit', addTransaction);

// Initialize dashboard
dashboardContainer.classList.remove('d-none');
loadTransactions();

// Load transactions from Firebase
function loadTransactions() {
    const transactionsRef = database.ref('transactions');
    
    transactionsRef.on('value', snapshot => {
        transactions = [];
        transactionsList.innerHTML = '';
        
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                const transaction = {
                    id: key,
                    ...data[key]
                };
                transactions.push(transaction);
            });
            
            // Sort transactions by date (newest first)
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Render transactions
            renderTransactions();
            
            // Update summary
            updateFinancialSummary();
        } else {
            updateFinancialSummary();
        }
    });
}

// Add new transaction
function addTransaction(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    
    if (!description || isNaN(amount) || amount <= 0 || !date) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    const transactionsRef = database.ref('transactions');
    const newTransaction = {
        description,
        amount,
        type,
        category,
        date: new Date(date).toISOString()
    };
    
    transactionsRef.push(newTransaction)
        .then(() => {
            transactionForm.reset();
        })
        .catch(error => {
            alert('Erro ao adicionar transação: ' + error.message);
        });
}

// Render transactions list
function renderTransactions() {
    transactionsList.innerHTML = '';
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        // Format amount
        const formattedAmount = formatCurrency(transaction.amount);
        
        // Translate category
        const categoryTranslations = {
            'food': 'Alimentação',
            'transport': 'Transporte',
            'housing': 'Moradia',
            'others': 'Outros'
        };
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.description}</td>
            <td>${categoryTranslations[transaction.category] || transaction.category}</td>
            <td class="transaction-expense">
                - ${formattedAmount}
            </td>
            <td class="action-buttons">
                <button class="btn btn-link p-0" onclick="deleteTransaction('${transaction.id}')" title="Excluir">🗑️</button>
            </td>
        `;
        
        transactionsList.appendChild(row);
    });
}

// Delete transaction
function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        const transactionRef = database.ref(`transactions/${id}`);
        transactionRef.remove()
            .catch(error => {
                alert('Erro ao excluir transação: ' + error.message);
            });
    }
}

// Update financial summary
function updateFinancialSummary() {
    let expenses = 0;
    let creditCardTotal = 0;
    let otherPaymentsTotal = 0;
    
    transactions.forEach(transaction => {
        expenses += transaction.amount;
        
        // Calculate totals by transaction type
        if (transaction.type === 'credit_card') {
            creditCardTotal += transaction.amount;
        } else if (transaction.type === 'other_payments') {
            otherPaymentsTotal += transaction.amount;
        }
    });
    
    totalExpenses.textContent = formatCurrency(expenses);
    totalCreditCard.textContent = formatCurrency(creditCardTotal);
    totalOtherPayments.textContent = formatCurrency(otherPaymentsTotal);
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}