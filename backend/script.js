const state = {
  expenses: [],
  categories: [
    'Moradia', 
    'Transporte', 
    'Alimentação', 
    'Educação', 
    'Saúde', 
    'Lazer', 
    'Serviços', 
    'Impostos',
    'Outros'
  ],
  months: [
    { name: 'JANEIRO', number: 0 },
    { name: 'FEVEREIRO', number: 1 },
    { name: 'MARÇO', number: 2 },
    { name: 'ABRIL', number: 3 },
    { name: 'MAIO', number: 4 },
    { name: 'JUNHO', number: 5 },
    { name: 'JULHO', number: 6 },
    { name: 'AGOSTO', number: 7 },
    { name: 'SETEMBRO', number: 8 },
    { name: 'OUTUBRO', number: 9 },
    { name: 'NOVEMBRO', number: 10 },
    { name: 'DEZEMBRO', number: 11 }
  ],
  selectedMonth: 'JANEIRO',
  selectedYear: new Date().getFullYear(),
  totalAmount: 0,
  totalPaid: 0
};

// Formatar moeda
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Função para formatar data considerando o fuso GMT-3 (Brasil)
function formatDateToBrazil(dateString) {
  if (!dateString) return '';
  
  // Criar a data com o valor da string mantendo o formato YYYY-MM-DD
  const dateParts = dateString.split('-');
  
  // Formatar a data no padrão brasileiro (dd/mm/yyyy)
  return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
}

// Calcular totais apenas para o mês atual, sem carregar para os meses seguintes
function calculateTotals() {
  const filteredExpenses = state.expenses.filter(expense => expense.month === state.selectedMonth && expense.year === state.selectedYear);
  
  // Total de todas as despesas do mês
  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Total das despesas pagas
  const paid = filteredExpenses
    .filter(expense => expense.paid)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  // Dívida restante (apenas do mês atual)
  state.totalAmount = total - paid;
  state.totalPaid = paid;
  
  // Remove references to tfoot elements since they've been removed from HTML
  // document.getElementById('total-debt').textContent = `R$ ${formatCurrency(state.totalAmount)}`;
  // document.getElementById('total-paid').textContent = `R$ ${formatCurrency(state.totalPaid)}`;
}

// Renderizar meses e resumo financeiro
function renderTopSection() {
  const topSection = document.getElementById('top-section');
  
  // Calcular os totais para o mês selecionado antes de renderizar
  const filteredExpenses = state.expenses.filter(expense => expense.month === state.selectedMonth);
  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paid = filteredExpenses
    .filter(expense => expense.paid)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  // Dívida restante apenas do mês atual
  const currentMonthDebt = total - paid;
  
  // Gerar anos para seleção (5 anos antes e depois do ano atual)
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 11}, (_, i) => currentYear - 5 + i);
  
  topSection.innerHTML = `
    <div class="flex-row">
      <!-- Month and Year selector -->
      <div class="card flex-1">
        <h2 class="card-title">Selecionar Período</h2>
        <div class="period-selector">
          <select id="month-select" class="period-select">
            ${state.months.map(month => `
              <option value="${month.name}" ${state.selectedMonth === month.name ? 'selected' : ''}>
                ${month.name}
              </option>
            `).join('')}
          </select>
          <select id="year-select" class="period-select">
            ${years.map(year => `
              <option value="${year}" ${state.selectedYear === year ? 'selected' : ''}>
                ${year}
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="flex-col flex-1 summary-cards">
        <div class="amount-card">
          <h2 class="card-title">Dívida Total</h2>
          <p class="amount-value text-red">R$ ${formatCurrency(currentMonthDebt)}</p>
        </div>
        <div class="amount-card">
          <h2 class="card-title">Pagamentos Realizados</h2>
          <p class="amount-value text-green">R$ ${formatCurrency(paid)}</p>
        </div>
      </div>
    </div>
  `;

  // Adicionar eventos aos selects
  document.getElementById('month-select').addEventListener('change', (e) => {
    state.selectedMonth = e.target.value;
    renderTopSection();
    renderExpensesTable();
    calculateTotals();
  });

  document.getElementById('year-select').addEventListener('change', (e) => {
    state.selectedYear = parseInt(e.target.value);
    renderTopSection();
    renderExpensesTable();
    calculateTotals();
  });
}

// Renderizar categorias no select
function renderCategories() {
  const categorySelect = document.getElementById('expense-category');
  categorySelect.innerHTML = `
    <option value="">Selecione a categoria</option>
    ${state.categories.map(category => `
      <option value="${category}">${category}</option>
    `).join('')}
  `;
}

// Renderizar tabela de despesas
function renderExpensesTable() {
  const tableBody = document.getElementById('expenses-table-body');
  const expensesTitle = document.getElementById('expenses-title');
  expensesTitle.textContent = `${state.selectedMonth} ${state.selectedYear}`;
  
  const filteredExpenses = state.expenses.filter(expense => {
    return expense.month === state.selectedMonth && expense.year === state.selectedYear;
  });
  
  if (filteredExpenses.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="color: #6b7280;">
          Nenhuma despesa cadastrada para este período
        </td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = filteredExpenses.map(expense => `
    <tr>
      <td>${expense.description}</td>
      <td>${expense.category}</td>
      <td class="text-center">${formatDateToBrazil(expense.dueDate)}</td>
      <td class="text-right">R$ ${formatCurrency(expense.amount)}</td>
      <td class="text-center">
        <button class="paid-btn ${expense.paid ? 'paid' : ''}" data-id="${expense.id}">
          ${expense.paid ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>' : ''}
        </button>
      </td>
    </tr>
  `).join('');

  // Adicionar eventos aos botões de pago
  document.querySelectorAll('.paid-btn').forEach(button => {
    button.addEventListener('click', () => {
      const id = parseInt(button.getAttribute('data-id'));
      togglePaid(id);
    });
  });
}

// Alternar status de pago
function togglePaid(id) {
  state.expenses = state.expenses.map(expense => 
    expense.id === id ? { ...expense, paid: !expense.paid } : expense
  );
  renderExpensesTable();
  renderTopSection(); // Atualizar também o top section com os novos valores
  calculateTotals();
}

// Adicionar nova despesa
function addExpense() {
  const description = document.getElementById('expense-description').value;
  const amountStr = document.getElementById('expense-amount').value;
  const category = document.getElementById('expense-category').value;
  const dueDate = document.getElementById('expense-due-date').value;
  
  if (description && amountStr && category && dueDate) {
    const amount = parseFloat(amountStr);
    if (!isNaN(amount)) {
      // Extrair o mês da data de vencimento
      const dueDateObj = new Date(dueDate);
      const expenseMonth = state.months[dueDateObj.getMonth()].name;
      const expenseYear = dueDateObj.getFullYear();
      
      const newId = Math.max(...state.expenses.map(e => e.id), 0) + 1;
      state.expenses.push({
        id: newId,
        description,
        amount,
        paid: false,
        month: expenseMonth,
        year: expenseYear,
        category,
        dueDate
      });
      
      // Limpar formulário
      document.getElementById('expense-description').value = '';
      document.getElementById('expense-amount').value = '';
      document.getElementById('expense-category').value = '';
      document.getElementById('expense-due-date').value = '';
      
      // Mudar para o mês e ano da despesa
      state.selectedMonth = expenseMonth;
      state.selectedYear = expenseYear;
      
      // Atualizar UI
      renderExpensesTable();
      renderTopSection();
      calculateTotals();
    }
  }
}

// Inicialização da aplicação
function init() {
  // Definir ano atual no footer
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // Renderizar componentes
  renderTopSection();
  renderCategories();
  renderExpensesTable();
  calculateTotals();
  
  // Adicionar evento ao botão de adicionar despesa
  document.getElementById('add-expense-btn').addEventListener('click', addExpense);

  // Adicionar eventos aos radio buttons de tipo de despesa
  document.getElementById('expense-type-credit-card').addEventListener('change', updateInstallmentOptions);
  document.getElementById('expense-type-recurring').addEventListener('change', updateInstallmentOptions);
  document.getElementById('expense-type-seasonal').addEventListener('change', updateInstallmentOptions);
}

// Função para atualizar as opções de parcelas com base no tipo de despesa selecionado
function updateInstallmentOptions() {
  const installmentOptions = document.getElementById('installment-options');
  const installmentSelect = document.getElementById('payment-installments');
  
  // Limpar opções anteriores
  installmentSelect.innerHTML = '';
  
  // Verificar qual tipo de despesa está selecionado
  const isCreditCard = document.getElementById('expense-type-credit-card').checked;
  const isRecurring = document.getElementById('expense-type-recurring').checked;
  const isSeasonal = document.getElementById('expense-type-seasonal').checked;
  
  if (isCreditCard) {
    // Cartão de Crédito: à vista ou 2 a 12x
    installmentSelect.innerHTML = `
      <option value="1">À vista</option>
      ${Array.from({length: 11}, (_, i) => `<option value="${i+2}">${i+2}x</option>`).join('')}
    `;
    installmentOptions.style.display = 'block';
  } else if (isRecurring) {
    // Recorrente: 7 a 12x
    installmentSelect.innerHTML = `
      ${Array.from({length: 6}, (_, i) => `<option value="${i+7}">${i+7}x</option>`).join('')}
    `;
    installmentOptions.style.display = 'block';
  } else if (isSeasonal) {
    // Sazonal: à vista ou 2 a 6x
    installmentSelect.innerHTML = `
      <option value="1">À vista</option>
      ${Array.from({length: 5}, (_, i) => `<option value="${i+2}">${i+2}x</option>`).join('')}
    `;
    installmentOptions.style.display = 'block';
  } else {
    // Nenhum tipo selecionado, esconder opções
    installmentOptions.style.display = 'none';
  }
}

// Iniciar a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
