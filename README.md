# Expensee Manager

**Track smarter. Spend better.**

Expense Manager is a full-stack personal finance management application built using JavaScript, Node.js, Express.js, and MongoDB. It helps users manage their income and expenses, set monthly budgets, monitor transactions, and understand their spending habits through interactive analytics.

## Live Demo

**[Open Expense Manager](https://expense-manager-frontend-fnv7.onrender.com)**

**GitHub Repository:** [github.com/Arnavv13/expense-manager](https://github.com/Arnavv13/expense-manager)

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

**Tools and Platforms**
- Visual Studio Code
- Postman
- Git and GitHub
- Render
- MongoDB Atlas

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
- MongoDB Community Server or MongoDB Atlas
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Arnavv13/expense-manager.git
cd expense-manager
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `server` directory using `.env.example` as a template.

Configure the following variables:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expense_manager
JWT_SECRET=your_own_random_secret
JWT_EXPIRES_IN=1d
```

You can use a MongoDB Atlas connection string instead of the local MongoDB URI.

**Important:** Use your own strong JWT secret. Never commit your `.env` file or expose database credentials.

### 5. Start the Backend

From the `server` directory:

```bash
npm run dev
```

If your backend package does not have a development script, use:

```bash
node server.js
```

### 6. Start the Frontend

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

Protected endpoints require a valid JWT Bearer token.

## Security

- Passwords are hashed before storage using bcrypt.
- JWT authentication protects private API routes.
- Transactions are associated with their respective users.
- Users can only access their own transactions.
- Environment variables and sensitive credentials are excluded from version control.

## Future Improvements

- Recurring transaction management
- Financial reports and PDF exports
- Password reset functionality
- Advanced financial insights and spending predictions
- Enhanced reporting and visualization

## Author

Developed as a full-stack web development project to explore frontend development, REST API development, database integration, authentication, and deployment.

## Support

If you find this project useful, consider giving the repository a star.

---

**Expense Manager — Track smarter. Spend better.**