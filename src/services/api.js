
const API_BASE_URL = 'https://expense-manager-zs5y.onrender.com/api'

// ----------------------------------
// AUTHENTICATION TOKEN
// ----------------------------------

const TOKEN_KEY = 'expensee_token';
const USER_KEY = 'expensee_user';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);

    return user ? JSON.parse(user) : null;
}

export function saveAuthSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// ----------------------------------
// REUSABLE API REQUEST
// ----------------------------------

async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

// ----------------------------------
// AUTHENTICATION API
// ----------------------------------

export async function registerUser(userData) {
    return await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

export async function loginUser(credentials) {
    return await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
}

export async function fetchCurrentUser() {
    return await apiRequest('/auth/me');
}

// ----------------------------------
// TRANSACTION API
// ----------------------------------

export async function fetchTransactions() {
    const data = await apiRequest('/transactions');
    return data.transactions;
}

export async function createTransaction(transaction) {
    const data = await apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(transaction)
    });

    return data.transaction;
}

export async function editTransaction(id, updates) {
    const data = await apiRequest(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });

    return data.transaction;
}

export async function removeTransaction(id) {
    return await apiRequest(`/transactions/${id}`, {
        method: 'DELETE'
    });
}
