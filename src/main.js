
import './style.css';

import { renderDashboard } from './modules/dashboard.js';
import { initializeTransactions } from './modules/transactions.js';
import { renderAuthScreen } from './modules/auth.js';

import {
    getToken,
    fetchCurrentUser,
    clearAuthSession
} from './services/api.js';

const app = document.querySelector('#app');

async function openDashboard() {
    await initializeTransactions();
    renderDashboard();

    console.log('Expensee Manager initialized successfully!');
}

function showStartupError(error) {
    app.innerHTML = `
        <div style="padding: 30px; text-align: center; color: #e5e7eb;">
            <h2>Unable to connect to Expensee Manager</h2>
            <p>${error.message}</p>
            <p>Please make sure your backend server and MongoDB are running.</p>
            <button onclick="location.reload()">Try Again</button>
        </div>
    `;
}

async function startApp() {
    if (!getToken()) {
        renderAuthScreen(app, openDashboard);
        return;
    }

    try {
        // Verify the saved JWT token with the backend.
        await fetchCurrentUser();

        // Load only this user's transactions.
        await openDashboard();

    } catch (error) {
        console.error('Session verification error:', error);

        // The saved session is no longer valid.
        clearAuthSession();

        // Ask the user to sign in again.
        renderAuthScreen(app, openDashboard);
    }
}

startApp();
