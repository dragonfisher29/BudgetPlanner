// Dom Selectors
const currencySelect = document.getElementById('currency-select');
const monthlyBudgetInput = document.getElementById('monthly-budget');
const fixedExpenseForm = document.getElementById('fixed-expense-form');
const fixedDesc = document.getElementById('fixed-desc');
const fixedAmount = document.getElementById('fixed-amount');

const flexSlider = document.getElementById('flex-slider');
const flexManualInput = document.getElementById('flex-manual-input'); // New Selector
const sliderMaxText = document.getElementById('slider-max-text');

const totalBudgetEl = document.getElementById('total-budget');
const totalExpensesEl = document.getElementById('total-expenses');
const netSavingsEl = document.getElementById('net-savings');
const transactionList = document.getElementById('transaction-list');

// App State Storage (Hydrated via LocalStorage)
let appState = JSON.parse(localStorage.getItem('budget_planner_state')) || {
    currency: '$',
    monthlyBudget: 0,
    fixedExpenses: [],
    flexibleSpending: 0
};

// Initialize configuration elements from saved states
function loadSavedState() {
    currencySelect.value = appState.currency;
    monthlyBudgetInput.value = appState.monthlyBudget;
    
    // Initial dynamic math adjustments
    adjustSliderMaxCap();
    
    // Ensure the loaded flexible spending value doesn't exceed the newly calculated cap
    if (appState.flexibleSpending > parseFloat(flexSlider.max)) {
        appState.flexibleSpending = parseFloat(flexSlider.max);
    }
    
    flexSlider.value = appState.flexibleSpending;
    flexManualInput.value = appState.flexibleSpending > 0 ? appState.flexibleSpending.toFixed(2) : "";
    
    updateUI();
}

// Dynamically scale slider maximum ceiling to remaining pool after fixed expenses
function adjustSliderMaxCap() {
    const budget = parseFloat(appState.monthlyBudget) || 0;
    const totalFixed = appState.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate remaining headroom
    const remainingBalance = budget - totalFixed;
    const maxCap = remainingBalance > 0 ? remainingBalance : 0;
    
    flexSlider.max = maxCap;
    flexManualInput.max = maxCap; // Restrict manual field ceiling too
    sliderMaxText.innerText = maxCap.toFixed(2);

    // Safety fallback: if spending exceeds the new dynamic max cap, push it down
    if (parseFloat(appState.flexibleSpending) > maxCap) {
        appState.flexibleSpending = maxCap;
        flexSlider.value = maxCap;
        flexManualInput.value = maxCap > 0 ? maxCap.toFixed(2) : "";
    }
}

// Render Totals and Calculate Net Residual Savings
function updateUI() {
    const selectedCurrency = appState.currency;
    
    // Update structural currency text icons dynamically across elements
    document.querySelectorAll('.currency').forEach(el => el.innerText = selectedCurrency);

    // Calculate aggregations
    const budgetAmount = parseFloat(appState.monthlyBudget) || 0;
    const totalFixed = appState.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalFlexible = parseFloat(appState.flexibleSpending) || 0;
    
    const totalCombinedExpenses = totalFixed + totalFlexible;
    const netSavings = budgetAmount - totalCombinedExpenses;

    // Display updates on Cards
    totalBudgetEl.innerHTML = `<span class="currency">${selectedCurrency}</span>${budgetAmount.toFixed(2)}`;
    totalExpensesEl.innerHTML = `<span class="currency">${selectedCurrency}</span>${totalCombinedExpenses.toFixed(2)}`;
    netSavingsEl.innerHTML = `<span class="currency">${selectedCurrency}</span>${netSavings.toFixed(2)}`;

    // Visual indicator optimization for debt/negative savings margin shifts
    netSavingsEl.style.color = netSavings < 0 ? 'var(--expense-color)' : 'var(--savings-color)';

    renderFixedExpensesTable();
}

// Render out structural table components
function renderFixedExpensesTable() {
    transactionList.innerHTML = '';
    appState.fixedExpenses.forEach((expense, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expense.description}</td>
            <td style="color: var(--expense-color); font-weight:600;">FIXED</td>
            <td>${appState.currency}${expense.amount.toFixed(2)}</td>
            <td><button class="delete-btn" onclick="deleteFixedExpense(${index})">✕</button></td>
        `;
        transactionList.appendChild(row);
    });
}

// --- Event Listeners & Input Pipeline Actions ---

// Currency adjustment event hook
currencySelect.addEventListener('change', (e) => {
    appState.currency = e.target.value;
    saveAndSync();
});

// Primary Budget tracking value adjustment
monthlyBudgetInput.addEventListener('input', (e) => {
    appState.monthlyBudget = parseFloat(e.target.value) || 0;
    adjustSliderMaxCap(); 
    saveAndSync();
});

// 1. SLIDER INPUT: Updates manual field
flexSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value) || 0;
    appState.flexibleSpending = value;
    flexManualInput.value = value.toFixed(2); // Keep manual input box matching
    saveAndSync();
});

// 2. MANUAL NUMERIC INPUT: Updates slider handle position
flexManualInput.addEventListener('input', (e) => {
    let value = parseFloat(e.target.value) || 0;
    const maxAllowed = parseFloat(flexSlider.max);

    // Hard ceiling defense block
    if (value > maxAllowed) {
        value = maxAllowed;
        flexManualInput.value = maxAllowed.toFixed(2);
    }

    appState.flexibleSpending = value;
    flexSlider.value = value; // Force slider to snap to manual entry location
    saveAndSync();
});

// Add Fixed expense structure handler
fixedExpenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const expense = {
        description: fixedDesc.value,
        amount: parseFloat(fixedAmount.value) || 0
    };
    appState.fixedExpenses.push(expense);
    fixedExpenseForm.reset();
    adjustSliderMaxCap(); 
    saveAndSync();
});

// Delete individual tracking component array indexes
window.deleteFixedExpense = function(index) {
    appState.fixedExpenses.splice(index, 1);
    adjustSliderMaxCap(); 
    saveAndSync();
};

// Global persistence sync logic block 
function saveAndSync() {
    localStorage.setItem('budget_planner_state', JSON.stringify(appState));
    updateUI();
}

// Runtime bootstrapping sequence trigger
loadSavedState();