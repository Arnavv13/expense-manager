# Expensee Manager

A full-stack personal finance management application built with JavaScript, Node.js, Express, and MongoDB. Expensee Manager helps users track expenses, manage monthly budgets, and understand their spending habits through interactive analytics.

## Features

### Authentication
- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- User-specific transaction and budget data
- Logout functionality

### Dashboard
- Overview of financial activity
- Total income and expenses
- Current balance
- Recent transactions

### Transaction Management
- Add, edit, and delete transactions
- Categorize expenses
- Sort and filter transactions
- Filter by date and category
- Export transactions to CSV
- Persistent MongoDB storage

### Budget Management
- Create monthly category budgets
- Edit and delete budgets
- Track spending against budget limits
- Automatic monthly budget carry-forward
- Account-specific budget storage

### Analytics
- Interactive charts using Chart.js
- Visual spending analysis
- Category-wise expense breakdown

## Tech Stack

**Frontend**
- HTML5
- CSS3
- JavaScript
- Tailwind CSS 4
- Chart.js
- Vite

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcrypt

**Tools**
- Visual Studio Code
- Postman
- Git and GitHub

## Project Structure

```text
expense-manager/
├── public/
├── server/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env.example
│   └── server.js
├── src/
│   ├── modules/
│   ├── services/
│   ├── utils/
│   ├── main.js
│   └── style.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Installation and Setup

### Prerequisites
- Node.js and npm
- MongoDB Community Server
- Git

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd expense-manager
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory using `.env.example` as a template.

Configure:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expensee_manager
JWT_SECRET=your_own_random_secret
JWT_EXPIRES_IN=1d
```

Use your own strong JWT secret. Never commit your `.env` file.

### 5. Start the backend

From the `server` directory:

```bash
npm run dev
```

If your backend package does not have a development script, use:

```bash
node server.js
```

### 6. Start the frontend

Open another terminal at the project root:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get current user |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transactions` | Get user's transactions |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |

Protected endpoints require a valid JWT bearer token.

## Security

- Passwords are hashed before storage.
- JWT authentication protects private API routes.
- Transactions are associated with their owner.
- Users can only access their own transactions.
- Environment variables and secrets are excluded from version control.

## Future Improvements

- Deploy the frontend and backend.
- Add recurring transactions.
- Add financial reports and PDF exports.
- Integrate cloud database hosting.
- Add password reset functionality.

## Author

Developed as a full-stack web development project to explore frontend development, REST APIs, database integration, and authentication.

---

**Expensee Manager — Track smarter. Spend better.**