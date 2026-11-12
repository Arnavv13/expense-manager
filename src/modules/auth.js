
import {
    loginUser,
    registerUser,
    saveAuthSession
} from '../services/api.js';

export function renderAuthScreen(app, onAuthenticated) {
    let activeMode = 'login';

    function render() {
        const isLogin = activeMode === 'login';

        app.innerHTML = `
            <main class="auth-page">
                <section class="auth-brand-panel">
                    <div class="auth-brand">
                        <span class="auth-brand-icon">₹</span>
                        <span>Expense</span>
                    </div>

                    <div class="auth-brand-content">
                        <span class="auth-eyebrow">PERSONAL FINANCE, SIMPLIFIED</span>
                        <h1>Take control of<br>your money.</h1>
                        <p>
                            Track expenses, manage budgets and understand
                            your spending — all in one place.
                        </p>

                        <div class="auth-feature-list">
                            <div><span>✓</span> Track income and expenses</div>
                            <div><span>✓</span> Monitor your monthly budgets</div>
                            <div><span>✓</span> Visualize your financial habits</div>
                        </div>
                    </div>

                    <p class="auth-copyright">
                        © ${new Date().getFullYear()} Expense Manager
                    </p>
                </section>

                <section class="auth-form-panel">
                    <div class="auth-form-container">
                        <div class="auth-mobile-brand">
                            <span class="auth-brand-icon">₹</span>
                            <strong>Expense</strong>
                        </div>

                        <span class="auth-eyebrow">
                            ${isLogin ? 'WELCOME BACK' : 'GET STARTED'}
                        </span>

                        <h2>
                            ${isLogin ? 'Sign in to your account' : 'Create your account'}
                        </h2>

                        <p class="auth-description">
                            ${isLogin
                                ? 'Enter your details to access your dashboard.'
                                : 'Create an account to start managing your finances.'}
                        </p>

                        <div class="auth-tabs">
                            <button type="button"
                                class="auth-tab ${isLogin ? 'active' : ''}"
                                data-mode="login">
                                Login
                            </button>

                            <button type="button"
                                class="auth-tab ${!isLogin ? 'active' : ''}"
                                data-mode="register">
                                Register
                            </button>
                        </div>

                        <form id="auth-form" class="auth-form">
                            ${!isLogin ? `
                                <label for="auth-name">Full name</label>
                                <input
                                    id="auth-name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    maxlength="60"
                                    autocomplete="name"
                                    required
                                />
                            ` : ''}

                            <label for="auth-email">Email address</label>
                            <input
                                id="auth-email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                autocomplete="email"
                                required
                            />

                            <label for="auth-password">Password</label>
                            <input
                                id="auth-password"
                                name="password"
                                type="password"
                                placeholder="${isLogin ? 'Enter your password' : 'At least 8 characters'}"
                                minlength="8"
                                autocomplete="${isLogin ? 'current-password' : 'new-password'}"
                                required
                            />

                            <p id="auth-error" class="auth-error" role="alert"></p>

                            <button class="auth-submit" id="auth-submit" type="submit">
                                ${isLogin ? 'Sign In' : 'Create Account'}
                                <span>→</span>
                            </button>
                        </form>

                        <p class="auth-switch">
                            ${isLogin
                                ? `Don't have an account?
                                   <button type="button" data-mode="register">Create one</button>`
                                : `Already have an account?
                                   <button type="button" data-mode="login">Sign in</button>`}
                        </p>

                        <p class="auth-security">
                            🔒 Your financial data is protected by secure authentication.
                        </p>
                    </div>
                </section>
            </main>
        `;

        app.querySelectorAll('[data-mode]').forEach(button => {
            button.addEventListener('click', () => {
                activeMode = button.dataset.mode;
                render();
            });
        });

        app.querySelector('#auth-form').addEventListener('submit', handleSubmit);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);
        const button = app.querySelector('#auth-submit');
        const errorElement = app.querySelector('#auth-error');

        errorElement.textContent = '';
        button.disabled = true;
        button.textContent = activeMode === 'login'
            ? 'Signing in...'
            : 'Creating account...';

        try {
            const credentials = {
                email: String(formData.get('email')).trim().toLowerCase(),
                password: String(formData.get('password'))
            };

            const result = activeMode === 'login'
                ? await loginUser(credentials)
                : await registerUser({
                    name: String(formData.get('name')).trim(),
                    ...credentials
                });

            if (!result.token || !result.user) {
                throw new Error('The server did not return a valid login session.');
            }

            saveAuthSession(result.token, result.user);
            await onAuthenticated(result.user);

        } catch (error) {
            errorElement.textContent = error.message || 'Authentication failed.';
            button.disabled = false;
            button.textContent = activeMode === 'login'
                ? 'Sign In →'
                : 'Create Account →';
        }
    }

    render();
}
