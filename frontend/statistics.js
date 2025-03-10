// Statistics functionality for FinPlanner

// DOM Elements for statistics
let statisticsModal;
let statisticsChart;

// Initialize statistics functionality
document.addEventListener('DOMContentLoaded', () => {
  // Create the statistics modal if it doesn't exist
  if (!document.getElementById('statisticsModal')) {
    createStatisticsModal();
  }
});

// Create the statistics modal
function createStatisticsModal() {
  const modalHTML = `
    <div class="modal fade" id="statisticsModal" tabindex="-1" aria-labelledby="statisticsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="statisticsModalLabel">Estatísticas por Categoria</h5>
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
  
  // Calculate statistics and show modal
  calculateCategoryStatistics();
  statisticsModal.show();
}

// Calculate statistics by category
function calculateCategoryStatistics() {
  // Get current user ID
  const currentUserId = firebase.auth().currentUser?.uid;
  if (!currentUserId) return;
  
  // Get current month and year
  const currentDate = new Date();
  const currentMonthElement = document.getElementById("currentMonth");
  const currentYearElement = document.getElementById("currentYear");
  
  const monthIndex = MONTHS.indexOf(currentMonthElement.textContent);
  const year = parseInt(currentYearElement.textContent);
  
  // Set the date to the selected month and year
  currentDate.setMonth(monthIndex);
  currentDate.setFullYear(year);
  
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
    const [currentMonth, currentYear] = getCurrentMonthYear();
    
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
    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
    '#6f42c1', '#fd7e14', '#20c9a6', '#5a5c69', '#858796',
    '#5a5c69', '#2c9faf'
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
          label: function(tooltipItem, data) {
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
            label: function(context) {
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