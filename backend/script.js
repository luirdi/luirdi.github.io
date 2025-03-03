const state = {
  expenses: [],
  categories: [
    "Moradia",
    "Transporte",
    "Alimentação",
    "Educação",
    "Saúde",
    "Lazer",
    "Serviços",
    "Impostos",
    "Outros",
  ],
  months: [
    { name: "JANEIRO", number: 0 },
    { name: "FEVEREIRO", number: 1 },
    { name: "MARÇO", number: 2 },
    { name: "ABRIL", number: 3 },
    { name: "MAIO", number: 4 },
    { name: "JUNHO", number: 5 },
    { name: "JULHO", number: 6 },
    { name: "AGOSTO", number: 7 },
    { name: "SETEMBRO", number: 8 },
    { name: "OUTUBRO", number: 9 },
    { name: "NOVEMBRO", number: 10 },
    { name: "DEZEMBRO", number: 11 },
  ],
  selectedMonth: "JANEIRO",
  selectedYear: new Date().getFullYear(),
  totalAmount: 0,
  totalPaid: 0,
};

// Formatar moeda
function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Função para formatar data considerando o fuso GMT-3 (Brasil)
function formatDateToBrazil(dateString) {
  if (!dateString) return "";

  // Criar a data com o valor da string mantendo o formato YYYY-MM-DD
  const dateParts = dateString.split("-");

  // Formatar a data no padrão brasileiro (dd/mm/yyyy)
  return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
}

// Função para criar uma data considerando o fuso GMT-3 (Brasil)
function createDateWithBrazilianTimezone(dateString) {
  if (!dateString) return new Date();

  // Criar a data a partir da string no formato YYYY-MM-DD
  const date = new Date(dateString);

  // Ajustar para o fuso horário do Brasil (GMT-3)
  // Isso garante que a data seja interpretada corretamente no fuso do Brasil
  const brazilOffset = -3 * 60; // GMT-3 em minutos
  const localOffset = date.getTimezoneOffset(); // Offset local em minutos
  const totalOffsetMs = (localOffset - brazilOffset) * 60 * 1000;

  // Criar nova data ajustada
  return new Date(date.getTime() + totalOffsetMs);
}

// Calcular totais apenas para o mês atual, sem carregar para os meses seguintes
function calculateTotals() {
  const filteredExpenses = state.expenses.filter(
    (expense) =>
      expense.month === state.selectedMonth &&
      expense.year === state.selectedYear
  );

  // Total de todas as despesas do mês
  const total = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Total das despesas pagas
  const paid = filteredExpenses
    .filter((expense) => expense.paid)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Dívida restante (apenas do mês atual)
  state.totalAmount = total - paid;
  state.totalPaid = paid;

  // Calculate totals by expense type
  let creditCardTotal = 0;
  let recurringTotal = 0;
  let singlePaymentTotal = 0;

  filteredExpenses.forEach((expense) => {
    if (!expense.paid) {
      if (expense.type === "credit-card") {
        creditCardTotal += expense.amount;
      } else if (expense.type === "recurring") {
        recurringTotal += expense.amount;
      } else if (expense.type === "single-payment") {
        singlePaymentTotal += expense.amount;
      }
    }
  });

  // Update amount cards
  document.getElementById(
    "single-payment-amount"
  ).textContent = `R$ ${formatCurrency(singlePaymentTotal)}`;
  document.getElementById(
    "credit-card-amount"
  ).textContent = `R$ ${formatCurrency(creditCardTotal)}`;
  document.getElementById(
    "recurring-amount"
  ).textContent = `R$ ${formatCurrency(recurringTotal)}`;
}

// Renderizar meses e resumo financeiro
function renderTopSection() {
  const topSection = document.getElementById("top-section");

  // Calcular os totais para o mês selecionado antes de renderizar
  const filteredExpenses = state.expenses.filter(
    (expense) => expense.month === state.selectedMonth
  );
  const total = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const paid = filteredExpenses
    .filter((expense) => expense.paid)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Dívida restante apenas do mês atual
  const currentMonthDebt = total - paid;

  // Gerar anos para seleção (5 anos antes e depois do ano atual)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  topSection.innerHTML = `
    <div class="flex-row">
      <!-- Month and Year selector -->
      <div class="card flex-1">
        <h2 class="card-title">Selecionar Período</h2>
        <div class="period-selector">
          <select id="month-select" class="period-select">
            ${state.months
              .map(
                (month) => `
              <option value="${month.name}" ${
                  state.selectedMonth === month.name ? "selected" : ""
                }>
                ${month.name}
              </option>
            `
              )
              .join("")}
          </select>
          <select id="year-select" class="period-select">
            ${years
              .map(
                (year) => `
              <option value="${year}" ${
                  state.selectedYear === year ? "selected" : ""
                }>
                ${year}
              </option>
            `
              )
              .join("")}
          </select>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="flex-col flex-1 summary-cards">
        <div class="amount-card">
          <h2 class="card-title">Dívida Total</h2>
          <p class="amount-value text-red">R$ ${formatCurrency(
            currentMonthDebt
          )}</p>
        </div>
        <div class="amount-card">
          <h2 class="card-title">Pagamentos Realizados</h2>
          <p class="amount-value text-green">R$ ${formatCurrency(paid)}</p>
        </div>
      </div>
    </div>
  `;

  // Adicionar eventos aos selects
  document.getElementById("month-select").addEventListener("change", (e) => {
    state.selectedMonth = e.target.value;
    renderTopSection();
    renderExpensesTable();
    calculateTotals();
  });

  document.getElementById("year-select").addEventListener("change", (e) => {
    state.selectedYear = parseInt(e.target.value);
    renderTopSection();
    renderExpensesTable();
    calculateTotals();
  });
}

// Renderizar categorias no select
function renderCategories() {
  const categorySelect = document.getElementById("expense-category");
  categorySelect.innerHTML = `
    <option value="">Selecione a categoria</option>
    ${state.categories
      .map(
        (category) => `
      <option value="${category}">${category}</option>
    `
      )
      .join("")}
  `;
}

// Renderizar tabela de despesas
function renderExpensesTable() {
  const tableBody = document.getElementById("expenses-table-body");
  const expensesTitle = document.getElementById("expenses-title");
  expensesTitle.textContent = `${state.selectedMonth} ${state.selectedYear}`;

  const filteredExpenses = state.expenses.filter((expense) => {
    return (
      expense.month === state.selectedMonth &&
      expense.year === state.selectedYear
    );
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

  tableBody.innerHTML = filteredExpenses
    .map(
      (expense) => `
    <tr>
      <td>${expense.description}</td>
      <td>${expense.category}</td>
      <td class="text-center">${formatDateToBrazil(expense.dueDate)}</td>
      <td class="text-right">R$ ${formatCurrency(expense.amount)}</td>
      <td class="text-center">
        <button class="paid-btn ${expense.paid ? "paid" : ""}" data-id="${
        expense.id
      }">
          ${
            expense.paid
              ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>'
              : ""
          }
        </button>
      </td>
      <td class="text-center">
        <button class="action-btn delete-btn" data-id="${
          expense.id
        }" title="Excluir">🗑️</button>
      </td>
    </tr>
  `
    )
    .join("");

  // Adicionar eventos aos botões
  document.querySelectorAll(".paid-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const id = parseInt(button.getAttribute("data-id"));
      togglePaid(id);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const id = parseInt(button.getAttribute("data-id"));
      showDeleteModal(id);
    });
  });
}

// Função para salvar o estado no localStorage
function saveStateToLocalStorage() {
  // Criar uma cópia do estado para armazenar
  const stateToSave = {
    expenses: state.expenses,
    selectedMonth: state.selectedMonth,
    selectedYear: state.selectedYear,
    totalAmount: state.totalAmount,
    totalPaid: state.totalPaid,
  };

  // Salvar no localStorage como string JSON
  localStorage.setItem("financialPlannerState", JSON.stringify(stateToSave));
}

// Função para carregar o estado do localStorage
function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem("financialPlannerState");

  if (savedState) {
    try {
      // Converter a string JSON de volta para objeto
      const parsedState = JSON.parse(savedState);

      // Atualizar o estado com os dados salvos
      state.expenses = parsedState.expenses || [];
      state.selectedMonth = parsedState.selectedMonth || "JANEIRO";
      state.selectedYear = parsedState.selectedYear || new Date().getFullYear();
      state.totalAmount = parsedState.totalAmount || 0;
      state.totalPaid = parsedState.totalPaid || 0;
    } catch (error) {
      console.error("Erro ao carregar dados do localStorage:", error);
    }
  }
}

// Alternar status de pago
function togglePaid(id) {
  state.expenses = state.expenses.map((expense) =>
    expense.id === id ? { ...expense, paid: !expense.paid } : expense
  );
  renderExpensesTable();
  renderTopSection(); // Atualizar também o top section com os novos valores
  calculateTotals();
  saveStateToLocalStorage(); // Salvar alterações no localStorage
}

// Adicionar nova despesa
function addExpense() {
  const description = document.getElementById("expense-description").value;
  const amountStr = document.getElementById("expense-amount").value;
  // Limpar a formatação da moeda para obter apenas o valor numérico
  const cleanedAmountStr = amountStr.replace(/[^\d,]/g, "").replace(",", ".");
  const category = document.getElementById("expense-category").value;
  const dueDate = document.getElementById("expense-due-date").value;

  // Get expense type
  const isCreditCard = document.getElementById(
    "expense-type-credit-card"
  ).checked;
  const isRecurring = document.getElementById("expense-type-recurring").checked;
  const isSinglePayment = document.getElementById(
    "expense-type-single-payment"
  ).checked;

  // Get installment information if applicable
  const installmentSelect = document.getElementById("payment-installments");
  let installments =
    installmentSelect.style.display !== "none" ? installmentSelect.value : "1";

  // Para despesas recorrentes, usar o número de parcelas selecionado
  // Não precisamos mais verificar a data final
  if (isRecurring) {
    // Verificar se um número de parcelas foi selecionado
    if (!installments || installments === "") {
      alert(
        "Por favor, selecione o número de parcelas para despesas recorrentes."
      );
      return;
    }
  }

  // Check if invoice is closed (only applies to credit card)
  const isClosedInvoice = isCreditCard
    ? document.getElementById("closed-invoice-checkbox").checked
    : false;

  // Check if we're editing an expense and get the paid status
  const paidStatusInput = document.getElementById("expense-paid-status");
  const isPaid = paidStatusInput ? paidStatusInput.value === "1" : false;

  if (
    description &&
    amountStr &&
    category &&
    dueDate &&
    (isCreditCard || isRecurring || isSinglePayment)
  ) {
    // Removido a verificação da data final para despesas recorrentes

    const amount = parseFloat(cleanedAmountStr);
    if (!isNaN(amount)) {
      // Extrair o mês da data de vencimento usando a função de timezone brasileiro
      const dueDateObj = createDateWithBrazilianTimezone(dueDate);
      let expenseMonth = state.months[dueDateObj.getMonth()].name;
      let expenseYear = dueDateObj.getFullYear();

      // Ajustar mês e ano para fatura fechada de cartão de crédito
      if (isCreditCard && isClosedInvoice) {
        // Avançar para o próximo mês
        const nextMonth = dueDateObj.getMonth() + 1;
        // Se for dezembro (11), avançar para janeiro do próximo ano
        if (nextMonth > 11) {
          expenseMonth = state.months[0].name; // Janeiro
          expenseYear = expenseYear + 1;
        } else {
          expenseMonth = state.months[nextMonth].name;
        }
      }

      // Determine expense type
      let expenseType = "";
      if (isCreditCard) expenseType = "credit-card";
      else if (isRecurring) expenseType = "recurring";
      else if (isSinglePayment) expenseType = "single-payment";

      const installmentsCount = parseInt(installments) || 1;

      // Para despesas parceladas (cartão de crédito) ou recorrentes, criar múltiplas entradas
      if (
        (isCreditCard && installmentsCount > 1) ||
        (isRecurring && installmentsCount > 1)
      ) {
        // Calcular o valor de cada parcela para cartão de crédito
        // Para despesas recorrentes, mantém o valor original em cada parcela
        const installmentAmount = isCreditCard
          ? amount / installmentsCount
          : amount;

        // Criar uma entrada para cada mês da recorrência/parcela
        for (let i = 0; i < installmentsCount; i++) {
          // Calcular a data de vencimento para cada parcela usando timezone brasileiro
          const currentDueDate = new Date(dueDateObj);
          currentDueDate.setMonth(dueDateObj.getMonth() + i);

          // Obter mês e ano para esta parcela
          const currentMonth = state.months[currentDueDate.getMonth()].name;
          const currentYear = currentDueDate.getFullYear();

          // Formatar a data no formato YYYY-MM-DD para armazenar
          const formattedDueDate = `${currentYear}-${String(
            currentDueDate.getMonth() + 1
          ).padStart(2, "0")}-${String(currentDueDate.getDate()).padStart(
            2,
            "0"
          )}`;

          // Criar ID único para cada parcela
          const newId =
            Math.max(...state.expenses.map((e) => e.id || 0), 0) + 1 + i;

          // Adicionar a parcela ao array de despesas
          state.expenses.push({
            id: newId,
            description: `${description} (${i + 1}/${installmentsCount})`,
            amount: installmentAmount,
            paid: i === 0 ? isPaid : false, // Apenas a primeira parcela mantém o status de pagamento
            month: currentMonth,
            year: currentYear,
            category,
            dueDate: formattedDueDate,
            type: expenseType,
            installments: installmentsCount,
            currentInstallment: i + 1,
            closedInvoice: false,
          });
        }
      } else {
        // Para despesas não recorrentes ou à vista, criar apenas uma entrada
        const newId = Math.max(...state.expenses.map((e) => e.id || 0), 0) + 1;
        state.expenses.push({
          id: newId,
          description,
          amount,
          paid: isPaid, // Usar o status de pagamento preservado
          month: expenseMonth,
          year: expenseYear,
          category,
          dueDate,
          type: expenseType,
          installments: installmentsCount,
          currentInstallment: 1,
          closedInvoice: isClosedInvoice,
        });
      }

      // Limpar o formulário
      document.getElementById("expense-description").value = "";
      document.getElementById("expense-amount").value = "";
      document.getElementById("expense-category").value = "";
      document.getElementById("expense-due-date").value = "";
      document.getElementById("expense-type-credit-card").checked = false;
      document.getElementById("expense-type-recurring").checked = false;
      document.getElementById("expense-type-single-payment").checked = false;
      document.getElementById("installment-options").style.display = "none";
      document.getElementById("closed-invoice-checkbox").checked = false;
      document.getElementById("recurring-end-date").style.display = "none";
      document.getElementById("recurring-end-date-input").value = "";

      // Remover o campo de status de pagamento
      if (paidStatusInput) {
        paidStatusInput.remove();
      }

      // Mudar para o mês e ano da primeira despesa
      state.selectedMonth = expenseMonth;
      state.selectedYear = expenseYear;

      // Atualizar UI
      renderExpensesTable();
      renderTopSection();
      calculateTotals();
      saveStateToLocalStorage(); // Salvar alterações no localStorage
    }
  } else {
    alert(
      "Por favor, preencha todos os campos e selecione um tipo de despesa."
    );
  }
}

// Inicialização da aplicação
function init() {
  // Carregar dados do localStorage
  loadStateFromLocalStorage();

  // // Definir ano atual no footer
  // document.getElementById('current-year').textContent = new Date().getFullYear();

  // Renderizar componentes
  renderTopSection();
  renderCategories();
  renderExpensesTable();
  calculateTotals();

  // Inicializar o campo de valor com formato de moeda vazio
  const expenseAmountInput = document.getElementById("expense-amount");
  expenseAmountInput.value = "";

  // Adicionar evento ao botão de adicionar despesa
  document
    .getElementById("add-expense-btn")
    .addEventListener("click", addExpense);

  // Adicionar eventos aos radio buttons de tipo de despesa
  document
    .getElementById("expense-type-single-payment")
    .addEventListener("change", updateInstallmentOptions);
  document
    .getElementById("expense-type-credit-card")
    .addEventListener("change", updateInstallmentOptions);
  document
    .getElementById("expense-type-recurring")
    .addEventListener("change", updateInstallmentOptions);

  // Inicializar o estado do botão com base no tipo de despesa selecionado
  updateInstallmentOptions();
}

// Função para atualizar as opções de parcelas com base no tipo de despesa selecionado
function updateInstallmentOptions() {
  const expenseType = document.querySelector(
    'input[name="expense-type"]:checked'
  )?.value;
  const installmentOptions = document.getElementById("installment-options");
  const paymentInstallments = document.getElementById("payment-installments");
  const closedInvoiceContainer = document.getElementById(
    "closed-invoice-container"
  );
  const recurringEndDateContainer =
    document.getElementById("recurring-end-date");
  const addButton = document.getElementById("add-expense-btn");

  // Limpar opções existentes
  paymentInstallments.innerHTML = '<option value="">Parcelas</option>';

  // Remover a classe btn-full-width do botão para todos os casos
  addButton.classList.remove("btn-full-width");

  if (expenseType === "credit-card") {
    installmentOptions.style.display = "block";
    recurringEndDateContainer.style.display = "none";
    closedInvoiceContainer.style.display = "block";

    // Adiciona a classe para o botão ocupar duas colunas
    addButton.classList.add("btn-full-width");

    // Adiciona opções de 1 a 12 parcelas para cartão de crédito
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i + "x";
      paymentInstallments.appendChild(option);
    }
  } else if (expenseType === "recurring") {
    installmentOptions.style.display = "block";
    recurringEndDateContainer.style.display = "none";
    closedInvoiceContainer.style.display = "none";

    // Adiciona a classe para o botão ocupar duas colunas
    addButton.classList.add("btn-full-width");

    // Adiciona opções de 2 a 12 parcelas para despesas recorrentes
    for (let i = 2; i <= 12; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i + "x";
      paymentInstallments.appendChild(option);
    }
  } else if (expenseType === "single-payment") {
    // Para pagamento único, não mostrar opções de parcelamento nem data final
    installmentOptions.style.display = "none";
    recurringEndDateContainer.style.display = "none";
  } else {
    installmentOptions.style.display = "none";
    recurringEndDateContainer.style.display = "none";
  }
}

// Iniciar a aplicação quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", init);

// Editar despesa
function editExpense(id) {
  // Encontrar a despesa pelo ID
  const expense = state.expenses.find((expense) => expense.id === id);

  if (expense) {
    // Preencher o formulário com os dados da despesa
    document.getElementById("expense-description").value = expense.description;
    document.getElementById("expense-amount").value = expense.amount;
    document.getElementById("expense-category").value = expense.category;
    document.getElementById("expense-due-date").value = expense.dueDate;

    // Selecionar o tipo de despesa
    if (expense.type === "credit-card") {
      document.getElementById("expense-type-credit-card").checked = true;
    } else if (expense.type === "recurring") {
      document.getElementById("expense-type-recurring").checked = true;
    }

    // Atualizar opções de parcelas
    updateInstallmentOptions();

    // Configurar opções específicas do tipo
    if (expense.type === "credit-card") {
      document.getElementById("payment-installments").value =
        expense.installments || "1";
      document.getElementById("closed-invoice-checkbox").checked =
        expense.closedInvoice || false;
    }

    // Preservar o status de pagamento
    if (!document.getElementById("expense-paid-status")) {
      const paidStatusInput = document.createElement("input");
      paidStatusInput.type = "hidden";
      paidStatusInput.id = "expense-paid-status";
      document.querySelector(".form-grid").appendChild(paidStatusInput);
    }
    document.getElementById("expense-paid-status").value = expense.paid
      ? "1"
      : "0";

    // Remover a despesa atual
    deleteExpense(id, false); // false para não mostrar confirmação

    // Rolar para o formulário
    document.querySelector(".form-grid").scrollIntoView({ behavior: "smooth" });
  }
}

// Excluir despesa
function deleteExpense(id, showConfirmation = true) {
  if (
    showConfirmation &&
    !confirm("Tem certeza que deseja excluir esta despesa?")
  ) {
    return;
  }

  // Filtrar a despesa do array
  state.expenses = state.expenses.filter((expense) => expense.id !== id);

  // Atualizar UI
  renderExpensesTable();
  renderTopSection();
  calculateTotals();
  saveStateToLocalStorage(); // Salvar alterações no localStorage
}

function showDeleteModal(id) {
  // Create modal container
  const modalContainer = document.createElement("div");
  modalContainer.className = "modal-container";
  modalContainer.innerHTML = `
    <div class="modal-content">
      <h2>Excluir Despesa</h2>
      <p>Como você deseja excluir esta despesa?</p>
      <div class="modal-buttons">
        <button class="modal-btn delete-all">Excluir TUDO</button>
        <button class="modal-btn delete-one">Excluir 1</button>
        <button class="modal-btn cancel">Voltar</button>
      </div>
    </div>
  `;

  // Add event listeners
  const deleteAllBtn = modalContainer.querySelector(".delete-all");
  const deleteOneBtn = modalContainer.querySelector(".delete-one");
  const cancelBtn = modalContainer.querySelector(".cancel");

  deleteAllBtn.addEventListener("click", () => {
    const expense = state.expenses.find((e) => e.id === id);
    if (expense) {
      // Delete all related expenses (same description and type)
      state.expenses = state.expenses.filter(
        (e) =>
          !(
            e.description.split(" (")[0] ===
              expense.description.split(" (")[0] && e.type === expense.type
          )
      );
      updateUIAfterDelete();
    }
    document.body.removeChild(modalContainer);
  });

  deleteOneBtn.addEventListener("click", () => {
    state.expenses = state.expenses.filter((e) => e.id !== id);
    updateUIAfterDelete();
    document.body.removeChild(modalContainer);
  });

  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(modalContainer);
  });

  // Add modal to body
  document.body.appendChild(modalContainer);

  // Add fade-in animation
  setTimeout(() => modalContainer.classList.add("show"), 10);
}

function updateUIAfterDelete() {
  renderExpensesTable();
  renderTopSection();
  calculateTotals();
  saveStateToLocalStorage();
}

// Format currency for input
function formatCurrencyInput(value) {
  value = value.replace(/\D/g, "");
  value = (parseInt(value) / 100).toFixed(2);
  value = value.replace(".", ",");
  value = value.replace(/(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${value}`;
}

// Clear currency format
function cleanCurrencyInput(value) {
  return value.replace(/\D/g, "") || "0";
}

// Add events to input
document
  .getElementById("expense-amount")
  .addEventListener("input", function (e) {
    const value = cleanCurrencyInput(e.target.value);
    e.target.value = formatCurrencyInput(value);
  });

document
  .getElementById("expense-amount")
  .addEventListener("focus", function (e) {
    const value = cleanCurrencyInput(e.target.value);
    e.target.value = formatCurrencyInput(value);
  });

document
  .getElementById("expense-amount")
  .addEventListener("blur", function (e) {
    const value = cleanCurrencyInput(e.target.value);
    if (value === "0") {
      e.target.value = "";
    } else {
      e.target.value = formatCurrencyInput(value);
    }
  });
