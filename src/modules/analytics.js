import Chart from 'chart.js/auto'
import { transactions } from './transactions.js'
import { money } from '../utils/formatters.js'

let monthlyChart
let categoryChart
let savingsChart
let selectedRange = 'all'

const chartText = '#B8C7C9'
const gridColor = 'rgba(184, 199, 201, 0.12)'
const green = '#35D39A'
const red = '#F07878'

// ----------------------------------
// FILTER TRANSACTIONS
// ----------------------------------

function getFilteredTransactions() {
  if (selectedRange === 'all') return [...transactions]

  const days = Number(selectedRange)
  const cutoff = new Date()

  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - days)

  return transactions.filter(item => {
    const date = new Date(`${item.date}T00:00:00`)
    return !Number.isNaN(date.getTime()) && date >= cutoff
  })
}

// ----------------------------------
// MONTHLY DATA
// ----------------------------------

function getMonthlyData() {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - 5 + index)

    return {
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      income: 0,
      expenses: 0
    }
  })

  const monthMap = new Map(months.map(month => [month.key, month]))

  getFilteredTransactions().forEach(item => {
    const month = monthMap.get(String(item.date).slice(0, 7))

    if (!month) return

    if (item.type === 'income') {
      month.income += Number(item.amount) || 0
    } else if (item.type === 'expense') {
      month.expenses += Number(item.amount) || 0
    }
  })

  return months
}

// ----------------------------------
// CATEGORY DATA
// ----------------------------------

function getCategoryData() {
  const totals = {}

  getFilteredTransactions()
    .filter(item => item.type === 'expense')
    .forEach(item => {
      const category = item.category || 'Other'

      totals[category] =
        (totals[category] || 0) + Number(item.amount || 0)
    })

  return Object.entries(totals)
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)
}

// ----------------------------------
// SUMMARY
// ----------------------------------

function getSummary() {
  const items = getFilteredTransactions()

  const income = items
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const expenses = items
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const balance = income - expenses

  const savingsRate = income > 0
    ? Math.round((balance / income) * 100)
    : 0

  return {
    income,
    expenses,
    balance,
    savingsRate,
    count: items.length
  }
}

// ----------------------------------
// DESTROY CHARTS
// ----------------------------------

function destroyCharts() {
  monthlyChart?.destroy()
  categoryChart?.destroy()
  savingsChart?.destroy()

  monthlyChart = undefined
  categoryChart = undefined
  savingsChart = undefined
}

// ----------------------------------
// CHART OPTIONS
// ----------------------------------

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        labels: {
          color: chartText,
          usePointStyle: true,
          padding: 18
        }
      },

      tooltip: {
        callbacks: {
          label(context) {
            return `${context.dataset.label || context.label}: ${money(context.raw)}`
          }
        }
      }
    },

    scales: {
      x: {
        ticks: {
          color: chartText
        },

        grid: {
          display: false
        },

        border: {
          color: gridColor
        }
      },

      y: {
        beginAtZero: true,

        ticks: {
          color: chartText,

          callback(value) {
            return `₹${Number(value).toLocaleString('en-IN')}`
          }
        },

        grid: {
          color: gridColor
        },

        border: {
          display: false
        }
      }
    }
  }
}

// ----------------------------------
// RENDER CHARTS
// ----------------------------------

function renderCharts() {
  destroyAnalyticsCharts()

  const months = getMonthlyData()
  const categories = getCategoryData()

  const monthlyCanvas = document.querySelector('#monthly-analytics-chart')
  const categoryCanvas = document.querySelector('#category-analytics-chart')
  const savingsCanvas = document.querySelector('#savings-analytics-chart')

  // MONTHLY INCOME VS EXPENSES

  if (monthlyCanvas) {
    monthlyChart = new Chart(monthlyCanvas, {
      type: 'bar',

      data: {
        labels: months.map(item => item.label),

        datasets: [
          {
            label: 'Income',
            data: months.map(item => item.income),
            backgroundColor: green,
            borderRadius: 6
          },

          {
            label: 'Expenses',
            data: months.map(item => item.expenses),
            backgroundColor: red,
            borderRadius: 6
          }
        ]
      },

      options: chartOptions()
    })
  }

  // CATEGORY BREAKDOWN

  if (categoryCanvas) {
    categoryChart = new Chart(categoryCanvas, {
      type: 'doughnut',

      data: {
        labels: categories.map(item => item.label),

        datasets: [
          {
            data: categories.map(item => item.amount),

            backgroundColor: [
              '#35D39A',
              '#4DA6FF',
              '#F5B95F',
              '#B18CFF',
              '#F07878',
              '#55C6C8',
              '#A8B5BE'
            ],

            borderColor: '#17232C',
            borderWidth: 3,
            hoverOffset: 7
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: 'bottom',

            labels: {
              color: chartText,
              usePointStyle: true,
              padding: 16
            }
          },

          tooltip: {
            callbacks: {
              label(context) {
                return `${context.label}: ${money(context.raw)}`
              }
            }
          }
        }
      }
    })
  }

  // SAVINGS TREND

  if (savingsCanvas) {
    savingsChart = new Chart(savingsCanvas, {
      type: 'line',

      data: {
        labels: months.map(item => item.label),

        datasets: [
          {
            label: 'Savings',

            data: months.map(item =>
              item.income - item.expenses
            ),

            borderColor: green,
            backgroundColor: 'rgba(53, 211, 154, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: green
          }
        ]
      },

      options: chartOptions()
    })
  }
}

// ----------------------------------
// ANALYTICS PAGE
// ----------------------------------

export function renderAnalyticsPage(app, onNavigate) {
  const summary = getSummary()

  app.innerHTML = `
    <div class="app-layout">

      <!-- SIDEBAR -->

      <aside class="sidebar">

        <div class="brand">
          <span class="brand-icon">₹</span>
          <span>Expense</span>
        </div>

        <div class="sidebar-label">MENU</div>

        <nav class="navigation">

          <button class="nav-link" data-page="Dashboard">
            <span>▦</span> Dashboard
          </button>

          <button class="nav-link" data-page="Transactions">
            <span>⇄</span> Transactions
          </button>

          <button class="nav-link" data-page="Budgets">
            <span>◷</span> Budgets
          </button>

          <button class="nav-link active" data-page="Analytics">
            <span>▥</span> Analytics
          </button>

        </nav>

        <div class="sidebar-bottom">

          <div class="profile">

            <div class="avatar">A</div>

            <div>
              <strong>My Account</strong>
              <small>Personal Finance</small>
            </div>

          </div>

        </div>

      </aside>

      <!-- MAIN CONTENT -->

      <main class="main-content">

        <header class="topbar">

          <div>
            <h1>Analytics</h1>
            <p>
              Understand your financial habits and spending patterns.
            </p>
          </div>

        </header>

        <!-- DATE RANGE -->

        <section class="analytics-toolbar">

          <label for="analytics-range">Date range</label>

          <select id="analytics-range">

            <option
              value="all"
              ${selectedRange === 'all' ? 'selected' : ''}
            >
              All time
            </option>

            <option
              value="30"
              ${selectedRange === '30' ? 'selected' : ''}
            >
              Last 30 days
            </option>

            <option
              value="90"
              ${selectedRange === '90' ? 'selected' : ''}
            >
              Last 90 days
            </option>

            <option
              value="180"
              ${selectedRange === '180' ? 'selected' : ''}
            >
              Last 180 days
            </option>

          </select>

        </section>

        <!-- STAT CARDS -->

        <section class="stats-grid analytics-stats">

          <article class="stat-card">

            <div class="stat-heading">
              <span>Total Income</span>
              <span class="stat-icon income-icon">↙</span>
            </div>

            <h2 class="positive">${money(summary.income)}</h2>

            <small>For selected period</small>

          </article>

          <article class="stat-card">

            <div class="stat-heading">
              <span>Total Expenses</span>
              <span class="stat-icon expense-icon">↗</span>
            </div>

            <h2 class="negative">${money(summary.expenses)}</h2>

            <small>For selected period</small>

          </article>

          <article class="stat-card">

            <div class="stat-heading">
              <span>Net Savings</span>
              <span class="stat-icon savings-icon">₹</span>
            </div>

            <h2>${money(summary.balance)}</h2>

            <small>Income minus expenses</small>

          </article>

          <article class="stat-card">

            <div class="stat-heading">
              <span>Savings Rate</span>
              <span class="stat-icon savings-icon">%</span>
            </div>

            <h2>${summary.savingsRate}%</h2>

            <small>
              ${summary.count} transactions in period
            </small>

          </article>

        </section>

        <!-- ANALYTICS CHARTS -->

        <section class="analytics-grid">

          <!-- INCOME VS EXPENSES -->

          <article class="panel analytics-panel">

            <div class="panel-header">

              <div>
                <h3>Income vs Expenses</h3>
                <p>Monthly comparison for the last six months</p>
              </div>

            </div>

            <div class="analytics-chart-container">
              <canvas id="monthly-analytics-chart"></canvas>
            </div>

          </article>

          <!-- EXPENSE BREAKDOWN -->

          <article class="panel analytics-panel">

            <div class="panel-header">

              <div>
                <h3>Expense Breakdown</h3>
                <p>Spending by category</p>
              </div>

            </div>

            <div class="analytics-chart-container doughnut-container">

              ${
                getCategoryData().length
                  ? '<canvas id="category-analytics-chart"></canvas>'
                  : '<p class="analytics-empty">No expense data for this period.</p>'
              }

            </div>

          </article>

          <!-- SAVINGS TREND -->

          <article class="panel analytics-panel analytics-wide">

            <div class="panel-header">

              <div>
                <h3>Savings Trend</h3>
                <p>Monthly income minus expenses</p>
              </div>

            </div>

            <div class="analytics-chart-container">
              <canvas id="savings-analytics-chart"></canvas>
            </div>

          </article>

        </section>

        <footer class="footer">
          Expense Manager · Manage your money smarter.
        </footer>

      </main>

    </div>
  `

  // DATE RANGE FILTER

  document.querySelector('#analytics-range')
    ?.addEventListener('change', event => {
      selectedRange = event.target.value
      renderAnalyticsPage(app, onNavigate)
    })

  // SIDEBAR NAVIGATION

  document.querySelectorAll('[data-page]').forEach(button => {
    button.addEventListener('click', () => {
      onNavigate(button.dataset.page)
    })
  })

  // RENDER CHARTS

  renderCharts()
}

// ----------------------------------
// DESTROY ANALYTICS CHARTS
// ----------------------------------

export function destroyAnalyticsCharts() {
  monthlyChart?.destroy()
  categoryChart?.destroy()
  savingsChart?.destroy()

  monthlyChart = undefined
  categoryChart = undefined
  savingsChart = undefined
}