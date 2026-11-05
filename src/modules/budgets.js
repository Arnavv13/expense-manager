import { transactions } from './transactions.js'
import { money, escapeHTML } from '../utils/formatters.js'
import { getCurrentUser } from '../services/api.js'
const STORAGE_KEY = 'expensee-monthly-budgets'

let monthlyBudgets = {}
let loadedUserKey = null

function getUserStorageKey() {
  const user = getCurrentUser()

  if (!user) {
    throw new Error('No logged-in user found.')
  }

  const userIdentifier = user.email || user._id || user.id

  if (!userIdentifier) {
    throw new Error('Could not identify the logged-in user.')
  }

  return `${STORAGE_KEY}:${String(userIdentifier).toLowerCase()}`
}

const categories = [
  'Food',
  'Shopping',
  'Transport',
  'Bills',
  'Entertainment',
  'Education',
  'Health',
  'Travel',
  'Other'
]

function getMonthKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    })
}

function loadBudgets(storageKey) {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return {}

    const parsed = JSON.parse(saved)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return parsed
  } catch (error) {
    console.error('Could not load budgets:', error)
    return {}
  }
}

function ensureUserBudgetsLoaded() {
  const storageKey = getUserStorageKey()

  if (loadedUserKey !== storageKey) {
    monthlyBudgets = loadBudgets(storageKey)
    loadedUserKey = storageKey
  }
}

function saveBudgets() {
  ensureUserBudgetsLoaded()

  localStorage.setItem(
    loadedUserKey,
    JSON.stringify(monthlyBudgets)
  )
}

// Automatically carries forward the previous month's budget limits.
// Spending is never carried forward.
function ensureCurrentMonth() {
  ensureUserBudgetsLoaded()

  const currentMonth = getMonthKey()

  if (monthlyBudgets[currentMonth]) {
    return currentMonth
  }

  const previousMonths = Object.keys(monthlyBudgets)
    .filter(month => month < currentMonth)
    .sort()

  const latestPreviousMonth = previousMonths.at(-1)

  monthlyBudgets[currentMonth] = latestPreviousMonth
    ? { ...monthlyBudgets[latestPreviousMonth] }
    : {}

  saveBudgets()

  return currentMonth
}

function getCurrentBudgets() {
  const month = ensureCurrentMonth()
  return monthlyBudgets[month]
}

function getCategorySpending(month, category) {
  return transactions
    .filter(item =>
      item.type === 'expense' &&
      item.category === category &&
      String(item.date).startsWith(month)
    )
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
}

function getBudgetStatus(spent, limit) {
  const percentage = limit > 0
    ? (spent / limit) * 100
    : 0

  if (percentage >= 100) {
    return {
      label: 'Budget exceeded',
      className: 'over-budget',
      percentage: 100
    }
  }

  if (percentage >= 80) {
    return {
      label: 'Almost at limit',
      className: 'warning-budget',
      percentage
    }
  }

  return {
    label: 'Within budget',
    className: 'good-budget',
    percentage
  }
}

function renderBudgetCards(month) {
  const budgets = getCurrentBudgets()
  const entries = Object.entries(budgets)

  if (entries.length === 0) {
    return `
      <div class="budget-empty">
        <div class="budget-empty-icon">₹</div>
        <h3>No budgets created yet</h3>
        <p>Create your first category budget using the form above.</p>
      </div>
    `
  }

  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, limit]) => {
      const spent = getCategorySpending(month, category)
      const remaining = limit - spent
      const status = getBudgetStatus(spent, limit)

      return `
        <article class="budget-card">
          <div class="budget-card-heading">
            <div>
              <span class="budget-category-icon">₹</span>
              <div>
                <h3>${escapeHTML(category)}</h3>
                <small>Monthly budget</small>
              </div>
            </div>

            <button
              class="budget-delete-btn"
              data-budget-delete="${escapeHTML(category)}"
              aria-label="Delete ${escapeHTML(category)} budget"
              title="Delete budget"
            >✕</button>
          </div>

          <div class="budget-amount-row">
            <div>
              <small>Spent</small>
              <strong>${money(spent)}</strong>
            </div>

            <div class="budget-limit">
              <small>Budget limit</small>
              <strong>${money(limit)}</strong>
            </div>
          </div>

          <div class="budget-progress-track">
            <div
              class="budget-progress-fill ${status.className}"
              style="width: ${status.percentage}%"
            ></div>
          </div>

          <div class="budget-bottom-row">
            <span class="${status.className}">${status.label}</span>
            <strong class="${remaining < 0 ? 'negative' : 'positive'}">
              ${remaining < 0
                ? `${money(Math.abs(remaining))} over`
                : `${money(remaining)} left`}
            </strong>
          </div>

          <button
            class="budget-edit-btn"
            data-budget-edit="${escapeHTML(category)}"
            data-budget-amount="${limit}"
          >Edit budget</button>
        </article>
      `
    })
    .join('')
}

function getBudgetSummary(month) {
  const budgets = getCurrentBudgets()
  const entries = Object.entries(budgets)

  const totalBudget = entries.reduce(
    (sum, [, limit]) => sum + Number(limit),
    0
  )

  const totalSpent = entries.reduce(
    (sum, [category]) => sum + getCategorySpending(month, category),
    0
  )

  return {
    totalBudget,
    totalSpent,
    remaining: totalBudget - totalSpent,
    count: entries.length
  }
}

export function renderBudgetsPage(app, onNavigate) {
  const month = ensureCurrentMonth()
  const summary = getBudgetSummary(month)

  app.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-icon">₹</span>
          <span>Expensee</span>
        </div>

        <div class="sidebar-label">MENU</div>

        <nav class="navigation">
          <button class="nav-link" data-page="Dashboard">
            <span>▦</span> Dashboard
          </button>

          <button class="nav-link" data-page="Transactions">
            <span>⇄</span> Transactions
          </button>

          <button class="nav-link active" data-page="Budgets">
            <span>◷</span> Budgets
          </button>

          <button class="nav-link" data-page="Analytics">
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

      <main class="main-content">
        <header class="topbar">
          <div>
            <h1>Budget Management</h1>
            <p>Plan your spending and stay in control of your money.</p>
          </div>
        </header>

        <section class="budget-month-heading">
          <div>
            <span class="budget-month-label">CURRENT BUDGET PERIOD</span>
            <h2>${escapeHTML(getMonthLabel(month))}</h2>
            <p>Your budget renews automatically each month.</p>
          </div>
          <span class="budget-month-icon">◷</span>
        </section>

        <section class="stats-grid budget-summary-grid">
          <article class="stat-card">
            <div class="stat-heading">
              <span>Total Budget</span>
              <span class="stat-icon">₹</span>
            </div>
            <h2>${money(summary.totalBudget)}</h2>
            <small>Combined category limits</small>
          </article>

          <article class="stat-card">
            <div class="stat-heading">
              <span>Total Spent</span>
              <span class="stat-icon expense-icon">↗</span>
            </div>
            <h2 class="negative">${money(summary.totalSpent)}</h2>
            <small>Spending this month</small>
          </article>

          <article class="stat-card">
            <div class="stat-heading">
              <span>Remaining</span>
              <span class="stat-icon savings-icon">₹</span>
            </div>
            <h2 class="${summary.remaining < 0 ? 'negative' : 'positive'}">
              ${money(summary.remaining)}
            </h2>
            <small>${summary.remaining < 0 ? 'Over total budget' : 'Available to spend'}</small>
          </article>

          <article class="stat-card">
            <div class="stat-heading">
              <span>Categories</span>
              <span class="stat-icon income-icon">▦</span>
            </div>
            <h2>${summary.count}</h2>
            <small>Active category budgets</small>
          </article>
        </section>

        <section class="panel budget-form-panel">
          <div class="panel-header">
            <div>
              <h3>Create or Update Budget</h3>
              <p>Set a monthly spending limit for a category.</p>
            </div>
          </div>

          <form id="budget-form" class="budget-form">
            <div class="budget-form-field">
              <label for="budget-category">Category</label>
              <select id="budget-category" name="category" required>
                ${categories.map(category => `
                  <option value="${escapeHTML(category)}">
                    ${escapeHTML(category)}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="budget-form-field">
              <label for="budget-limit">Monthly limit (₹)</label>
              <input
                type="number"
                id="budget-limit"
                name="limit"
                placeholder="e.g. 5000"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <button type="submit" class="primary-btn">
              Save Budget
            </button>
          </form>

          <p class="budget-form-hint">
            Saving an existing category updates its monthly limit.
          </p>
        </section>

        <section class="budget-list-section">
          <div class="panel-header">
            <div>
              <h3>Category Budgets</h3>
              <p>Track your spending against each monthly limit.</p>
            </div>
          </div>

          <div class="budget-grid" id="budget-grid">
            ${renderBudgetCards(month)}
          </div>
        </section>

        <footer class="footer">
          Expensee Manager · Manage your money smarter.
        </footer>
      </main>
    </div>
  `

  const form = document.querySelector('#budget-form')
  const categoryInput = document.querySelector('#budget-category')
  const limitInput = document.querySelector('#budget-limit')

  form?.addEventListener('submit', event => {
    event.preventDefault()

    const category = categoryInput.value
    const limit = Number(limitInput.value)

    if (!categories.includes(category)) {
      alert('Please select a valid category.')
      return
    }

    if (!Number.isFinite(limit) || limit <= 0) {
      alert('Please enter a valid budget amount.')
      return
    }

    const budgets = getCurrentBudgets()
    budgets[category] = limit

    saveBudgets()
    renderBudgetsPage(app, onNavigate)
  })

  document.querySelectorAll('[data-budget-delete]').forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.budgetDelete

      if (!confirm(`Delete the ${category} budget?`)) return

      const budgets = getCurrentBudgets()
      delete budgets[category]

      saveBudgets()
      renderBudgetsPage(app, onNavigate)
    })
  })

  document.querySelectorAll('[data-budget-edit]').forEach(button => {
    button.addEventListener('click', () => {
      categoryInput.value = button.dataset.budgetEdit
      limitInput.value = button.dataset.budgetAmount
      limitInput.focus()

      form.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  })

  // Centralized sidebar navigation
  document.querySelectorAll('[data-page]').forEach(button => {
    button.addEventListener('click', () => {
      onNavigate(button.dataset.page)
    })
  })
}