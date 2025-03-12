// Statistics functionality for FinPlanner

// DOM Elements for statistics
let statisticsModal;
let statisticsChart;

// Statistics date state
let statisticsDate = new Date();

// Initialize statistics functionality
document.addEventListener('DOMContentLoaded', () => {
  // Create the statistics modal if it doesn't exist
  if (!document.getElementById('statisticsModal')) {
    createStatisticsModal();
  }

  // Initialize year and month dropdowns when DOM is loaded
  initializeYearDropdown();
  initializeMonthDropdown();
});

// Create the statistics modal
function createStatisticsModal() {
  const modalHTML = `
    <div class="modal fade" id="statisticsModal" tabindex="-1" aria-labelledby="statisticsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="statisticsModalLabel">Estatísticas por Categoria</h5>
            <div class="date-navigation d-flex align-items-center ms-auto me-3">
              <div class="btn-group">
                <!-- Month Dropdown -->
                <div class="btn-group">
                  <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" id="statisticsCurrentMonth">
                    Janeiro
                  </button>
                  <ul class="dropdown-menu" id="statisticsMonthDropdown">
                    <!-- Month options will be populated dynamically -->
                  </ul>
                </div>
                
                <!-- Year Dropdown -->
                <button type="button" class="btn btn-primary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                  <span id="statisticsCurrentYear">2025</span>
                  <span class="visually-hidden">Toggle Dropdown</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" id="statisticsYearDropdown">
                  <!-- Year options will be populated dynamically -->
                </ul>
              </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-8 mx-auto">
                <canvas id="categoryChart"></canvas>
              </div>
            </div>
            <div class="row mt-4">
              <div class="col-12">
                <div class="table-responsive">
                  <table class="table table-sm table-hover" id="statisticsTable">
                    <thead>
                      <tr>
                        <th>Categoria</th>
                        <th>Valor</th>
                        <th>Porcentagem</th>
                      </tr>
                    </thead>
                    <tbody id="statisticsTableBody"></tbody>
                  </table>
                </div>
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

  // Append the modal to the body
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild);

  // Initialize the modal
  statisticsModal = new bootstrap.Modal(document.getElementById('statisticsModal'));
}

// Show statistics modal and generate chart
function showStatistics() {
  if (!statisticsModal) {
    createStatisticsModal();
    statisticsModal = new bootstrap.Modal(document.getElementById('statisticsModal'));
  }

  // Sync statistics date with main app date
  statisticsDate = new Date(currentDate);
  updateStatisticsDate();

  // Calculate statistics and show modal
  calculateCategoryStatistics();
  statisticsModal.show();
}

// Update the statistics date display
function updateStatisticsDate() {
  const statisticsMonthElement = document.getElementById('statisticsCurrentMonth');
  const statisticsYearElement = document.getElementById('statisticsCurrentYear');

  if (statisticsMonthElement && statisticsYearElement) {
    statisticsMonthElement.textContent = MONTHS[statisticsDate.getMonth()];
    statisticsYearElement.textContent = statisticsDate.getFullYear();
  }
}

// Change month in statistics view
function changeStatisticsMonth(delta) {
  statisticsDate.setMonth(statisticsDate.getMonth() + delta);
  updateStatisticsDate();
  calculateCategoryStatistics();
}

// Change year in statistics view
function changeStatisticsYear(delta) {
  statisticsDate.setFullYear(statisticsDate.getFullYear() + delta);
  updateStatisticsDate();
  calculateCategoryStatistics();
}

// Set specific year in statistics view
function setStatisticsYear(year) {
  statisticsDate.setFullYear(year);
  updateStatisticsDate();
  calculateCategoryStatistics();
}

// Set specific month in statistics view
function setStatisticsMonth(monthIndex) {
  statisticsDate.setMonth(monthIndex);
  updateStatisticsDate();
  calculateCategoryStatistics();
}

// Initialize month dropdown with options
function initializeMonthDropdown() {
  const dropdown = document.getElementById('statisticsMonthDropdown');
  if (!dropdown) return;

  // Clear existing options
  dropdown.innerHTML = '';

  // Add options for all 12 months
  for (let i = 0; i < MONTHS.length; i++) {
    const option = document.createElement('li');
    const link = document.createElement('a');
    link.classList.add('dropdown-item');
    link.href = '#';
    link.textContent = MONTHS[i];
    link.onclick = function (e) {
      e.preventDefault();
      setStatisticsMonth(i);
    };

    option.appendChild(link);
    dropdown.appendChild(option);
  }
}

// Initialize year dropdown with options
function initializeYearDropdown() {
  const dropdown = document.getElementById('statisticsYearDropdown');
  if (!dropdown) return;

  // Clear existing options
  dropdown.innerHTML = '';

  // Get current year
  const currentYear = new Date().getFullYear();

  // Add options for last 5 years and next 5 years
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    const option = document.createElement('li');
    const link = document.createElement('a');
    link.classList.add('dropdown-item');
    link.href = '#';
    link.textContent = year;
    link.onclick = function (e) {
      e.preventDefault();
      setStatisticsYear(year);
    };

    option.appendChild(link);
    dropdown.appendChild(option);
  }
}

// Calculate statistics by category
function calculateCategoryStatistics() {
  // Get current user ID
  const currentUserId = firebase.auth().currentUser?.uid;
  if (!currentUserId) return;

  // Use the statistics date for calculations

  // Get transactions for the current month and year
  const transactionsRef = firebase.database().ref(`users/${currentUserId}/transactions`);

  transactionsRef.once("value", snapshot => {
    const data = snapshot.val();
    if (!data) {
      showNoDataMessage();
      return;
    }

    // Process transactions
    const categoryTotals = {};
    let totalAmount = 0;

    // Get current month and year as numbers for filtering
    const options = { timeZone: TIMEZONE, month: "numeric", year: "numeric" };
    const dateStr = statisticsDate.toLocaleDateString(LOCALE, options);
    const [currentMonth, currentYear] = dateStr.split("/").map(Number);

    Object.keys(data).forEach(key => {
      const transaction = { id: key, ...data[key] };

      // Use displayDate if available, otherwise use date
      let dateToFilter = transaction.displayDate ? new Date(transaction.displayDate) : new Date(transaction.date);

      const options = { timeZone: TIMEZONE, month: "numeric", year: "numeric" };
      const transactionDateStr = dateToFilter.toLocaleDateString(LOCALE, options);
      const [month, year] = transactionDateStr.split("/").map(Number);

      // Only include transactions from the current month/year
      if (month === currentMonth && year === currentYear) {
        const category = transaction.category;
        const amount = transaction.amount;

        // Add to category total
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        categoryTotals[category] += amount;
        totalAmount += amount;
      }
    });

    // If no transactions found for the current month
    if (totalAmount === 0) {
      showNoDataMessage();
      return;
    }

    // Generate chart data
    generateCategoryChart(categoryTotals, totalAmount);

    // Generate statistics table
    generateStatisticsTable(categoryTotals, totalAmount);
  });
}

// Show message when no data is available
function showNoDataMessage() {
  const chartCanvas = document.getElementById('categoryChart');
  const ctx = chartCanvas.getContext('2d');

  // Clear any existing chart
  if (statisticsChart) {
    statisticsChart.destroy();
  }

  // Clear the canvas
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

  // Display no data message
  ctx.font = '16px "PT Sans Narrow"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#666';
  ctx.fillText('Nenhuma transação encontrada para o mês atual', chartCanvas.width / 2, chartCanvas.height / 2);

  // Clear the statistics table
  document.getElementById('statisticsTableBody').innerHTML = '';
}

// Generate pie chart for category distribution
function generateCategoryChart(categoryTotals, totalAmount) {
  const chartCanvas = document.getElementById('categoryChart');

  // Clear any existing chart
  if (statisticsChart) {
    statisticsChart.destroy();
  }

  // Prepare data for chart
  const categories = Object.keys(categoryTotals);
  const amounts = categories.map(category => categoryTotals[category]);
  const percentages = amounts.map(amount => ((amount / totalAmount) * 100).toFixed(1));

  // Translate category names
  const translatedCategories = categories.map(category => getCategoryTranslation(category));

  // Define colors for chart
  const backgroundColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF'
  ];

  // Create chart
  const ctx = chartCanvas.getContext('2d');
  statisticsChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: translatedCategories,
      datasets: [{
        data: amounts,
        backgroundColor: backgroundColors.slice(0, categories.length),
        hoverBackgroundColor: backgroundColors.slice(0, categories.length),
        hoverBorderColor: 'rgba(234, 236, 244, 1)',
      }],
    },
    options: {
      maintainAspectRatio: false,
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            const dataset = data.datasets[tooltipItem.datasetIndex];
            const currentValue = dataset.data[tooltipItem.index];
            const percentage = percentages[tooltipItem.index];
            return `${data.labels[tooltipItem.index]}: ${formatCurrency(currentValue)} (${percentage}%)`;
          }
        }
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: {
              family: '"PT Sans Narrow"'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const percentage = ((value / totalAmount) * 100).toFixed(1);
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    },
  });
}

// Generate statistics table
function generateStatisticsTable(categoryTotals, totalAmount) {
  const tableBody = document.getElementById('statisticsTableBody');
  tableBody.innerHTML = '';

  // Sort categories by amount (descending)
  const sortedCategories = Object.keys(categoryTotals).sort((a, b) => {
    return categoryTotals[b] - categoryTotals[a];
  });

  // Create table rows
  sortedCategories.forEach(category => {
    const amount = categoryTotals[category];
    const percentage = ((amount / totalAmount) * 100).toFixed(1);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${getCategoryTranslation(category)}</td>
      <td>${formatCurrency(amount)}</td>
      <td>${percentage}%</td>
    `;

    tableBody.appendChild(row);
  });

  // Add total row
  const totalRow = document.createElement('tr');
  totalRow.classList.add('fw-bold');
  totalRow.innerHTML = `
    <td>Total</td>
    <td>${formatCurrency(totalAmount)}</td>
    <td>100%</td>
  `;

  tableBody.appendChild(totalRow);
}