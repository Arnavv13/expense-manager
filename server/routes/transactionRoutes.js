const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const Transaction = require('../models/Transaction');
const protect = require('../middleware/authmiddleware');

// Every transaction route requires authentication.
router.use(protect);

// GET transactions belonging to the logged-in user
router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.user.id
        }).sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: transactions.length,
            transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to fetch transactions.'
        });
    }
});

// ADD a transaction
router.post('/', async (req, res) => {
    try {
        const { title, amount, category, type, date } = req.body;

        if (
            !title ||
            !category ||
            !['income', 'expense'].includes(type) ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid transaction details.'
            });
        }

        const newTransaction = await Transaction.create({
            user: req.user.id,
            title,
            amount: Number(amount),
            category,
            type,
            date
        });

        res.status(201).json({
            success: true,
            message: 'Transaction added successfully!',
            transaction: newTransaction
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Unable to add transaction.'
        });
    }
});

// UPDATE a transaction owned by the logged-in user
router.put('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction ID.'
            });
        }

        const { title, amount, category, type, date } = req.body;

        const updates = {};

        if (title !== undefined) updates.title = title;
        if (amount !== undefined) updates.amount = Number(amount);
        if (category !== undefined) updates.category = category;
        if (type !== undefined) updates.type = type;
        if (date !== undefined) updates.date = date;

        const updatedTransaction = await Transaction.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.id
            },
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully!',
            transaction: updatedTransaction
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Unable to update transaction.'
        });
    }
});

// DELETE a transaction owned by the logged-in user
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction ID.'
            });
        }

        const deletedTransaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!deletedTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully!'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Unable to delete transaction.'
        });
    }
});

module.exports = router;