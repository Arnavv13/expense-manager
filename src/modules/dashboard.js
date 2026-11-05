import { money, escapeHTML } from '../utils/formatters.js'

import {
  transactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getTotals
} from './transactions.js'

import {
  renderAnalyticsPage,
  destroyAnalyticsCharts
} from './analytics.js'

import { renderBudgetsPage } from './budgets.js'

import {
  getCurrentUser,
  clearAuthSession
} from '../services/api.js'

let activeFilter = 'all'
let searchTerm = ''
let categoryFilter = 'all'
let sortOrder = 'newest'
let dateFrom = ''
let dateTo = ''
let editingTransactionId = null

const app = document.querySelector('#app')

// ----------------------------------
// HELPERS
// ----------------------------------

function todayDate() {
  const date = new Date()

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function showToast(message) {
  let toast = document.querySelector('#toast')

  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'toast'
    toast.className = 'toast'
    document.body.appendChild(toast)
  }

  toast.textContent = message
  toast.classList.add('show')

  clearTimeout(showToast.timeout)

  showToast.timeout = setTimeout(() => {
    toast.classList.remove('show')
  }, 2500)
}

// ----------------------------------
// CSV EXPORT
// ----------------------------------

function exportTransactionsCSV(items) {
  if (!items.length) {
    showToast('No transactions available to export.')
    return
  }

  const headers = [
    'Transaction ID',
    'Title',
    'Category',
    'Type',
    'Amount',
    'Date'
  ]

  const escapeCSV = value => {
    const text = String(value ?? '')
    return `"${text.replace(/"/g, '""')}"`
  }

  const rows = items.map(item => [
    item.id,
    item.title,
    item.category,
    item.type,
    item.amount,
    item.date
  ])

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\r\n')

  const blob = new Blob(
    ['\uFEFF' + csvContent],
    { type: 'text/csv;charset=utf-8;' }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `expensee-transactions-${todayDate()}.csv`

  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)

  showToast('CSV exported successfully!')
}

// ----------------------------------
// CENTRAL NAVIGATION
// ----------------------------------

function navigateToPage(page = 'Dashboard') {
  if (page === 'Dashboard') {
    renderDashboard()

    // Always open Dashboard from the top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })

    return
  }

  if (page === 'Transactions') {
    renderDashboard()

    // Open the Transactions section
    requestAnimationFrame(() => {
      document.querySelector('.transactions-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return
  }

  if (page === 'Analytics') {
    destroyAnalyticsCharts()
    renderAnalyticsPage(app, navigateToPage)

    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  if (page === 'Budgets') {
    destroyAnalyticsCharts()
    renderBudgetsPage(app, navigateToPage)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
// ----------------------------------
// DASHBOARD
// ----------------------------------

function renderDashboard() {
  destroyAnalyticsCharts()

  if (!app) {
    console.error('Could not find #app in index.html')
    return
  }

  const { income, expenses, balance, savingsRate } = getTotals()
  const currentUser = getCurrentUser() || {}

const displayName = currentUser.name || 'My Account'
const displayEmail = currentUser.email || 'Personal Finance'
const avatarLetter = displayName.charAt(0).toUpperCase() || 'A'

  const visibleTransactions = transactions
    .filter(item =>
      activeFilter === 'all' || item.type === activeFilter
    )
    .filter(item =>
      categoryFilter === 'all' || item.category === categoryFilter
    )
    .filter(item =>
      !dateFrom || item.date >= dateFrom
    )
    .filter(item =>
      !dateTo || item.date <= dateTo
    )
    .filter(item =>
      `${item.title} ${item.category}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'oldest') {
        return a.date.localeCompare(b.date)
      }

      if (sortOrder === 'highest') {
        return Number(b.amount) - Number(a.amount)
      }

      if (sortOrder === 'lowest') {
        return Number(a.amount) - Number(b.amount)
      }

      return b.date.localeCompare(a.date)
    })

  const monthLabels = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - 5 + index)

    return {
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      year: date.getFullYear(),
      month: String(date.getMonth() + 1).padStart(2, '0')
    }
  })

  const monthlyExpenses = monthLabels.map(month =>
    transactions
      .filter(item =>
        item.type === 'expense' &&
        item.date.startsWith(`${month.year}-${month.month}`)
      )
      .reduce((sum, item) => sum + Number(item.amount), 0)
  )

  const maxExpense = Math.max(...monthlyExpenses, 1)

  // TRANSACTION TABLE

  const transactionRows = visibleTransactions.length
    ? visibleTransactions.map(item => `
        <tr>
          <td>
            <div class="transaction-name">
              <span class="transaction-icon">
                ${item.type === 'income' ? '↙' : '↗'}
              </span>

              <div>
                <strong>${escapeHTML(item.title)}</strong>
                <small>${escapeHTML(item.category)}</small>
              </div>
            </div>
          </td>

          <td>${formatDate(item.date)}</td>

          <td>
            <span class="type-badge ${item.type}">
              ${item.type}
            </span>
          </td>

          <td class="${item.type === 'income' ? 'positive' : 'negative'}">
            ${item.type === 'income' ? '+' : '-'}${money(item.amount)}
          </td>

          <td>
            <button
              class="text-btn"
              data-edit="${escapeHTML(String(item.id))}"
              type="button"
            >
              Edit
            </button>

            <button
              class="delete-btn"
              data-delete="${escapeHTML(String(item.id))}"
              aria-label="Delete transaction"
              type="button"
            >
              ✕
            </button>
          </td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="5" class="empty-state">
            No transactions found.
          </td>
        </tr>
      `

  // DASHBOARD CHART

  const chartBars = monthlyExpenses.map((amount, index) => `
    <div class="chart-column">
      <div
        class="chart-bar"
        style="height:${Math.max((amount / maxExpense) * 100, 3)}%"
      >
        <span class="chart-tooltip">${money(amount)}</span>
      </div>

      <small>${monthLabels[index].label}</small>
    </div>
  `).join('')

  // ----------------------------------
  // HTML
  // ----------------------------------

  app.innerHTML = `
    <div class="app-layout">

      <!-- SIDEBAR -->

      <aside class="sidebar">

        <div class="brand">
          <span class="brand-icon">₹</span>
          <span>Expensee</span>
        </div>

        <div class="sidebar-label">MENU</div>

        <nav class="navigation">

          <button class="nav-link active" data-page="Dashboard">
            <span>▦</span> Dashboard
          </button>

          <button class="nav-link" data-page="Transactions">
            <span>⇄</span> Transactions
          </button>

          <button class="nav-link" data-page="Budgets">
            <span>◷</span> Budgets
          </button>

          <button class="nav-link" data-page="Analytics">
            <span>▥</span> Analytics
          </button>

        </nav>

        <div class="sidebar-bottom">
          <div class="sidebar-bottom">
  <div class="profile">
    <div class="avatar">${escapeHTML(avatarLetter)}</div>

    <div class="profile-details">
      <strong>${escapeHTML(displayName)}</strong>
      <small>${escapeHTML(displayEmail)}</small>
    </div>
  </div>

  <button
    type="button"
    class="secondary-btn logout-btn"
    id="logout-btn"
  >
    ↪ Logout
  </button>
</div>

      </aside>

      <!-- MAIN CONTENT -->

      <main class="main-content">

        <header class="topbar">

          <div>
            <h1>Dashboard</h1>
            <p>Welcome back! Here's your financial overview.</p>
          </div>

          <button class="primary-btn" id="open-form">
            + Add Transaction
          </button>

        </header>

        <!-- STAT CARDS -->

        <section class="stats-grid">

          <article class="stat-card">
            <div class="stat-heading">
              <span>Total Balance</span>
              <span class="stat-icon">₹</span>
            </div>

            <h2>${money(balance)}</h2>
            <small>Your current balance</small>
          </article>

          <article class="stat-card">
            <div class="stat-heading">
              <span>Total Income</span>
              <span class="stat-icon income-icon">↙</span>
            </div>

            <h2 class="positive">${money(income)}</h2>
            <small>All recorded income</small>
          </article>

          <article class="stat-card">
            <div class="stat-heading">
              <span>Total Expenses</span>
              <span class="stat-icon expense-icon">↗</span>
            </div>

            <h2 class="negative">${money(expenses)}</h2>
            <small>All recorded expenses</small>
          </article>

          <article class="stat-card">
            <div class="stat-heading">
              <span>Savings Rate</span>
              <span class="stat-icon savings-icon">%</span>
            </div>

            <h2>${savingsRate}%</h2>
            <small>Income saved after expenses</small>
          </article>

        </section>

        <!-- CHART AND INSIGHTS -->

        <section class="dashboard-grid">

          <article class="panel chart-panel">

            <div class="panel-header">
              <div>
                <h3>Spending Overview</h3>
                <p>Your expenses over the last six months</p>
              </div>

              <span class="panel-tag">Monthly</span>
            </div>

            <div class="chart">
              ${chartBars}
            </div>

          </article>

          <article class="panel insights-panel">

            <div class="panel-header">
              <div>
                <h3>Quick Insights</h3>
                <p>Your financial summary</p>
              </div>
            </div>

            <div class="insight-item">
              <span class="insight-icon">💰</span>

              <div>
                <strong>${money(balance)}</strong>
                <small>Available balance</small>
              </div>
            </div>

            <div class="insight-item">
              <span class="insight-icon">📈</span>

              <div>
                <strong>${savingsRate}%</strong>
                <small>Savings rate</small>
              </div>
            </div>

            <div class="insight-item">
              <span class="insight-icon">🧾</span>

              <div>
                <strong>${transactions.length}</strong>
                <small>Total transactions</small>
              </div>
            </div>

          </article>

        </section>

        <!-- TRANSACTIONS -->

        <section class="panel transactions-panel">

          <div class="panel-header transactions-heading">

            <div>
              <h3>Recent Transactions</h3>
              <p>Manage your income and expenses</p>
            </div>

            <button class="text-btn" id="view-all">
              View all →
            </button>

          </div>

          <!-- SEARCH AND FILTERS -->

          <div class="transaction-controls">

            <input
              type="search"
              id="search-input"
              placeholder="Search transactions..."
              value="${escapeHTML(searchTerm)}"
            />

            <div class="filter-buttons">

              <button
                class="filter-btn ${activeFilter === 'all' ? 'selected' : ''}"
                data-filter="all"
              >
                All
              </button>

              <button
                class="filter-btn ${activeFilter === 'income' ? 'selected' : ''}"
                data-filter="income"
              >
                Income
              </button>

              <button
                class="filter-btn ${activeFilter === 'expense' ? 'selected' : ''}"
                data-filter="expense"
              >
                Expenses
              </button>

            </div>

            <!-- ADVANCED FILTERS -->

            <div class="advanced-transaction-filters">

              <select id="category-filter" aria-label="Filter by category">

                <option value="all">All categories</option>

                ${[...new Set(transactions.map(item => item.category))]
                  .sort()
                  .map(category => `
                    <option
                      value="${escapeHTML(category)}"
                      ${categoryFilter === category ? 'selected' : ''}
                    >
                      ${escapeHTML(category)}
                    </option>
                  `).join('')}

              </select>

              <select id="sort-order" aria-label="Sort transactions">

                <option value="newest" ${sortOrder === 'newest' ? 'selected' : ''}>
                  Newest first
                </option>

                <option value="oldest" ${sortOrder === 'oldest' ? 'selected' : ''}>
                  Oldest first
                </option>

                <option value="highest" ${sortOrder === 'highest' ? 'selected' : ''}>
                  Highest amount
                </option>

                <option value="lowest" ${sortOrder === 'lowest' ? 'selected' : ''}>
                  Lowest amount
                </option>

              </select>

              <input
                type="date"
                id="date-from"
                aria-label="From date"
                value="${escapeHTML(dateFrom)}"
              >

              <input
                type="date"
                id="date-to"
                aria-label="To date"
                value="${escapeHTML(dateTo)}"
              >

              <button class="secondary-btn" id="clear-filters" type="button">
                Clear filters
              </button>

              <button class="secondary-btn" id="export-csv" type="button">
                Export CSV
              </button>

            </div>

          </div>

          <!-- TABLE -->

          <div class="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>TRANSACTION</th>
                  <th>DATE</th>
                  <th>TYPE</th>
                  <th>AMOUNT</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                ${transactionRows}
              </tbody>

            </table>

          </div>

        </section>

        <footer class="footer">
          Expensee Manager · Manage your money smarter.
        </footer>

      </main>

    </div>

    <!-- ADD / EDIT TRANSACTION MODAL -->

    <dialog id="transaction-dialog" class="transaction-dialog">

      <form id="transaction-form">

        <div class="dialog-header">

          <div>
            <h2 id="transaction-dialog-title">Add Transaction</h2>

            <p id="transaction-dialog-description">
              Enter your income or expense details.
            </p>
          </div>

          <button
            type="button"
            id="close-form"
            class="close-btn"
          >
            ✕
          </button>

        </div>

        <label for="title">Transaction Title</label>

        <input
          type="text"
          id="title"
          name="title"
          placeholder="e.g. Monthly Salary"
          maxlength="80"
          required
        />

        <label for="amount">Amount (₹)</label>

        <input
          type="number"
          id="amount"
          name="amount"
          placeholder="Enter amount"
          min="0.01"
          step="0.01"
          required
        />

        <label for="category">Category</label>

        <select id="category" name="category" required>
          <option value="Food">Food</option>
          <option value="Shopping">Shopping</option>
          <option value="Transport">Transport</option>
          <option value="Bills">Bills</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Salary">Salary</option>
          <option value="Freelance">Freelance</option>
          <option value="Other">Other</option>
        </select>

        <label for="type">Transaction Type</label>

        <select id="type" name="type" required>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <label for="date">Date</label>

        <input
          type="date"
          id="date"
          name="date"
          required
        />

        <div class="dialog-actions">

          <button
            type="button"
            id="cancel-form"
            class="secondary-btn"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="primary-btn"
            id="save-transaction-btn"
          >
            Save Transaction
          </button>

        </div>

      </form>

    </dialog>
  `

  attachEvents()
}

// ----------------------------------
// EVENT LISTENERS
// ----------------------------------

function attachEvents() {

    // LOGOUT
document.querySelector('#logout-btn')?.addEventListener('click', () => {
  const confirmed = confirm('Are you sure you want to log out?')

  if (!confirmed) return

  clearAuthSession()
  window.location.reload()
})

  // SIDEBAR NAVIGATION
  document.querySelectorAll('[data-page]').forEach(button => {
    button.addEventListener('click', () => {
      navigateToPage(button.dataset.page)
    })
  })

  const dialog = document.querySelector('#transaction-dialog')
  const form = document.querySelector('#transaction-form')

  // OPEN ADD TRANSACTION MODAL

  document.querySelector('#open-form')?.addEventListener('click', () => {
    editingTransactionId = null

    form.reset()
    form.elements.date.value = todayDate()

    document.querySelector('#transaction-dialog-title').textContent =
      'Add Transaction'

    document.querySelector('#transaction-dialog-description').textContent =
      'Enter your income or expense details.'

    document.querySelector('#save-transaction-btn').textContent =
      'Save Transaction'

    dialog.showModal()
  })

  // CLOSE MODAL

  const closeDialog = () => {
    editingTransactionId = null
    dialog.close()
  }

  document.querySelector('#close-form')
    ?.addEventListener('click', closeDialog)

  document.querySelector('#cancel-form')
    ?.addEventListener('click', closeDialog)

  // ADD OR UPDATE TRANSACTION

  form?.addEventListener('submit', async event => {
    event.preventDefault()

    const saveButton = document.querySelector('#save-transaction-btn')
    const data = new FormData(form)

    const title = String(data.get('title') || '').trim()
    const amount = Number(data.get('amount'))
    const category = data.get('category')
    const type = data.get('type')
    const date = data.get('date')

    if (!title) {
      showToast('Please enter a transaction title.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Please enter a valid amount.')
      return
    }

    if (!date || Number.isNaN(Date.parse(date))) {
      showToast('Please select a valid date.')
      return
    }

    if (!['income', 'expense'].includes(type)) {
      showToast('Please select a valid transaction type.')
      return
    }

    const transactionData = {
      title,
      amount,
      category,
      type,
      date
    }

    saveButton.disabled = true

    try {
      if (editingTransactionId !== null) {
        await updateTransaction(editingTransactionId, transactionData)
        showToast('Transaction updated successfully!')
      } else {
        await addTransaction(transactionData)
        showToast('Transaction saved successfully!')
      }

      editingTransactionId = null
      dialog.close()
      renderDashboard()

    } catch (error) {
      console.error('Transaction save error:', error)
      showToast(error.message || 'Could not save transaction.')

    } finally {
      saveButton.disabled = false
    }
  })

  // EDIT TRANSACTION

  document.querySelectorAll('[data-edit]').forEach(button => {
    button.addEventListener('click', () => {
      const transaction = transactions.find(
        item => String(item.id) === button.dataset.edit
      )

      if (!transaction) return

      editingTransactionId = transaction.id

      form.elements.title.value = transaction.title
      form.elements.amount.value = transaction.amount
      form.elements.category.value = transaction.category
      form.elements.type.value = transaction.type
      form.elements.date.value = transaction.date

      document.querySelector('#transaction-dialog-title').textContent =
        'Edit Transaction'

      document.querySelector('#transaction-dialog-description').textContent =
        'Update your transaction details.'

      document.querySelector('#save-transaction-btn').textContent =
        'Update Transaction'

      dialog.showModal()
    })
  })

  // TYPE FILTER

  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter
      renderDashboard()
    })
  })

  // SEARCH

  document.querySelector('#search-input')?.addEventListener('input', event => {
    searchTerm = event.target.value

    const cursor = event.target.selectionStart

    renderDashboard()

    const input = document.querySelector('#search-input')

    if (input) {
      input.focus()
      input.setSelectionRange(cursor, cursor)
    }
  })

  // CATEGORY FILTER

  document.querySelector('#category-filter')?.addEventListener('change', event => {
    categoryFilter = event.target.value
    renderDashboard()
  })

  // SORTING

  document.querySelector('#sort-order')?.addEventListener('change', event => {
    sortOrder = event.target.value
    renderDashboard()
  })

  // DATE FILTERS

  document.querySelector('#date-from')?.addEventListener('change', event => {
    dateFrom = event.target.value
    renderDashboard()
  })

  document.querySelector('#date-to')?.addEventListener('change', event => {
    dateTo = event.target.value
    renderDashboard()
  })

  // CLEAR FILTERS

  document.querySelector('#clear-filters')?.addEventListener('click', () => {
    activeFilter = 'all'
    searchTerm = ''
    categoryFilter = 'all'
    sortOrder = 'newest'
    dateFrom = ''
    dateTo = ''

    renderDashboard()

    showToast('Filters cleared.')
  })

  // CSV EXPORT

  document.querySelector('#export-csv')?.addEventListener('click', () => {
    exportTransactionsCSV(visibleTransactionsForExport())
  })

  // VIEW ALL

  document.querySelector('#view-all')?.addEventListener('click', () => {
    activeFilter = 'all'
    searchTerm = ''
    categoryFilter = 'all'
    dateFrom = ''
    dateTo = ''

    renderDashboard()
  })

  // DELETE TRANSACTION

  document.querySelectorAll('[data-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      const item = transactions.find(
        transaction => String(transaction.id) === button.dataset.delete
      )

      if (!item) return

      if (!confirm(`Delete "${item.title}"?`)) return

      button.disabled = true

      try {
        const deleted = await deleteTransaction(item.id)

        if (deleted) {
          renderDashboard()
          showToast('Transaction deleted successfully.')
        }

      } catch (error) {
        console.error('Transaction delete error:', error)
        showToast(error.message || 'Could not delete transaction.')
        button.disabled = false
      }
    })
  })
}

// ----------------------------------
// EXPORT FILTERED TRANSACTIONS
// ----------------------------------

function visibleTransactionsForExport() {
  return transactions
    .filter(item =>
      activeFilter === 'all' || item.type === activeFilter
    )
    .filter(item =>
      categoryFilter === 'all' || item.category === categoryFilter
    )
    .filter(item =>
      !dateFrom || item.date >= dateFrom
    )
    .filter(item =>
      !dateTo || item.date <= dateTo
    )
    .filter(item =>
      `${item.title} ${item.category}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'oldest') {
        return a.date.localeCompare(b.date)
      }

      if (sortOrder === 'highest') {
        return Number(b.amount) - Number(a.amount)
      }

      if (sortOrder === 'lowest') {
        return Number(a.amount) - Number(b.amount)
      }

      return b.date.localeCompare(a.date)
    })
}

// ----------------------------------
// START APPLICATION
// ----------------------------------

export { renderDashboard }