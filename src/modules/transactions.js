
import {
    fetchTransactions,
    createTransaction,
    editTransaction,
    removeTransaction
} from '../services/api.js';

// Keep one shared array so dashboard and analytics
// can continue importing the same transactions reference.
export const transactions = [];

// Load transactions from MongoDB
export async function initializeTransactions() {
    const data = await fetchTransactions();

    // Replace array contents without changing its reference
    transactions.splice(
        0,
        transactions.length,
       ...data.map(item => ({
    ...item,
    id: item._id,
    date: String(item.date || '').slice(0, 10)
}))
    );

    return transactions;
}

// Add a transaction
export async function addTransaction(transaction) {
    const savedTransaction = await createTransaction({
        title: transaction.title.trim(),
        category: transaction.category,
        type: transaction.type,
        amount: Number(transaction.amount),
        date: transaction.date
    });

   const newTransaction = {
    ...savedTransaction,
    id: savedTransaction._id,
    date: String(savedTransaction.date || '').slice(0, 10)
}
    transactions.push(newTransaction);

    return newTransaction;
}

// Update a transaction
export async function updateTransaction(id, updates) {
    const updatedTransaction = await editTransaction(id, {
        title: updates.title.trim(),
        category: updates.category,
        type: updates.type,
        amount: Number(updates.amount),
        date: updates.date
    });

    const index = transactions.findIndex(
        item => String(item.id) === String(id)
    );

    if (index !== -1) {
      transactions[index] = {
    ...updatedTransaction,
    id: updatedTransaction._id,
    date: String(updatedTransaction.date || '').slice(0, 10)
}
    }

    return transactions[index];
}

// Delete a transaction
export async function deleteTransaction(id) {
    await removeTransaction(id);

    const index = transactions.findIndex(
        item => String(item.id) === String(id)
    );

    if (index === -1) return false;

    transactions.splice(index, 1);

    return true;
}

// Calculate totals
export function getTotals() {
    const income = transactions
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const expenses = transactions
        .filter(item => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const balance = income - expenses;

    return {
        income,
        expenses,
        balance,
        savingsRate: income > 0
            ? Math.round((balance / income) * 100)
            : 0
    };
}
