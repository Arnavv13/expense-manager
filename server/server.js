const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

app.get('/', (req, res) => {
    res.send('Welcome to Expensee Manager Backend!');
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Expensee Manager API is running!'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Connect to MongoDB before starting the server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully!');

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    });