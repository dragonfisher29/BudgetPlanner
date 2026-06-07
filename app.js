// Grab DOM elements
const form = document.getElementById('budget-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const transactionList = document.getElementById('transaction-list');

const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const netBalanceEl = document.getElementById('net-balance');

// Load transactions from localStorage or initialize empty array
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Update the Dashboard Numbers
function updateDashboard() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    totalIncomeEl.innerText = `$${income.toFixed(2)}`;
    totalExpensesEl.innerText = `$${expenses.toFixed(2)}`;
    netBalanceEl.innerText = `$${balance.toFixed(2)}`;
    
    // Change balance color if negative
    netBalanceEl.style.color = balance < 0 ? '#e74c3c' : '#3498db';
}

// Render Transactions in the Table
function renderTransactions() {
    transactionList.innerHTML = '';

    transactions.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.classList.add(transaction.type === 'income' ? 'inc-row' : 'exp-row');

        row.innerHTML = `
            <td>${transaction.description}</td>
            <td>${transaction.type.toUpperCase()}</td>
            <td>$${transaction.amount.toFixed(2)}</td>
            <td><button class="delete-btn" onclick="deleteTransaction(${index})">X</button></td>
        `;

        transactionList.appendChild(row);
    });
}

// Add Transaction
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const transaction = {
        description: descriptionInput.value,
        amount: parseFloat(amountInput.value),
        type: typeInput.value
    };

    transactions.push(transaction);
    updateLocalStorage();
    init();

    // Reset Form
    form.reset();
});

// Delete Transaction
window.deleteTransaction = function(index) {
    transactions.splice(index, 1);
    updateLocalStorage();
    init();
}

// Update LocalStorage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Initialize App
function init() {
    renderTransactions();
    updateDashboard();
}

init();