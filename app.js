// DOM Element UI Nodes Map
const currencySelect = document.getElementById('currency-select');
const profileSelect = document.getElementById('profile-select');
const monthlyBudgetInput = document.getElementById('monthly-budget');
const fixedExpenseForm = document.getElementById('fixed-expense-form');
const fixedDesc = document.getElementById('fixed-desc');
const fixedAmount = document.getElementById('fixed-amount');
const fixedDate = document.getElementById('fixed-date');

const flexSlider = document.getElementById('flex-slider');
const flexManualInput = document.getElementById('flex-manual-input');
const sliderMaxText = document.getElementById('slider-max-text');
const savingsTargetInput = document.getElementById('savings-pct-input');

const totalBudgetEl = document.getElementById('total-budget');
const totalExpensesEl = document.getElementById('total-expenses');
const netSavingsEl = document.getElementById('net-savings');
const transactionList = document.getElementById('transaction-list');

const themeToggle = document.getElementById('theme-toggle');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');

// Chart global instance tracking object
let allocationChartInstance = null;

// Unified Master State Schema (Hydrated via Multi-Profile Structures)
let globalBudgetEngine = JSON.parse(localStorage.getItem('multi_profile_engine_v3')) || {
    activeProfile: 'default',
    theme: 'light',
    profiles: {
        default: { currency: '$', monthlyBudget: 0, fixedExpenses: [], flexibleSpending: 0 },
        holiday: { currency: '$', monthlyBudget: 0, fixedExpenses: [], flexibleSpending: 0 },
        summer: { currency: '$', monthlyBudget: 0, fixedExpenses: [], flexibleSpending: 0 }
    }
};

// Target Local Shortcut Reference Mapping to Context State
let currentProfileKey = globalBudgetEngine.activeProfile || 'default';
let activeState = globalBudgetEngine.profiles[currentProfileKey];

// --- Bootstrapping Sequence Actions ---
function initEngine() {
    // Sync UI elements to reflect active runtime tracking states
    profileSelect.value = currentProfileKey;
    document.body.classList.toggle('dark-theme', globalBudgetEngine.theme === 'dark');
    themeToggle.innerText = globalBudgetEngine.theme === 'dark' ? '☀️' : '🌙';

    syncActiveProfilePointers();
}

function syncActiveProfilePointers() {
    activeState = globalBudgetEngine.profiles[currentProfileKey];
    
    currencySelect.value = activeState.currency;
    monthlyBudgetInput.value = activeState.monthlyBudget;
    
    adjustSliderMaxCap();

    if (activeState.flexibleSpending > parseFloat(flexSlider.max)) {
        activeState.flexibleSpending = parseFloat(flexSlider.max);
    }
    
    flexSlider.value = activeState.flexibleSpending;
    flexManualInput.value = activeState.flexibleSpending > 0 ? activeState.flexibleSpending.toFixed(2) : "";
    updateSavingsTargetInput();
    
    updateUI();
}

function adjustSliderMaxCap() {
    const budget = parseFloat(activeState.monthlyBudget) || 0;
    const totalFixed = activeState.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    
    const remainingBalance = budget - totalFixed;
    const maxCap = remainingBalance > 0 ? remainingBalance : 0;
    
    flexSlider.max = maxCap;
    flexManualInput.max = maxCap;
    sliderMaxText.innerText = maxCap.toFixed(2);

    if (parseFloat(activeState.flexibleSpending) > maxCap) {
        activeState.flexibleSpending = maxCap;
        flexSlider.value = maxCap;
        flexManualInput.value = maxCap > 0 ? maxCap.toFixed(2) : "";
    }

    updateSavingsTargetInput();
}

function updateUI() {
    const symbol = activeState.currency;
    document.querySelectorAll('.currency').forEach(el => el.innerText = symbol);

    const budgetAmount = parseFloat(activeState.monthlyBudget) || 0;
    const totalFixed = activeState.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalFlexible = parseFloat(activeState.flexibleSpending) || 0;
    
    const totalCombinedExpenses = totalFixed + totalFlexible;
    const netSavings = budgetAmount - totalCombinedExpenses;

    totalBudgetEl.innerHTML = `<span class="currency">${symbol}</span>${budgetAmount.toFixed(2)}`;
    totalExpensesEl.innerHTML = `<span class="currency">${symbol}</span>${totalCombinedExpenses.toFixed(2)}`;
    netSavingsEl.innerHTML = `<span class="currency">${symbol}</span>${netSavings.toFixed(2)}`;
    netSavingsEl.style.color = netSavings < 0 ? 'var(--expense-color)' : 'var(--savings-color)';

    renderLedger();
    renderCharts(totalFixed, totalFlexible, netSavings);
}

savingsTargetInput.addEventListener('input', (e) => {
    const targetPct = parseFloat(e.target.value) || 0;
    const budgetAmount = parseFloat(activeState.monthlyBudget) || 0;
    const totalFixed = activeState.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);

    const desiredSavings = Math.min(budgetAmount, (budgetAmount * targetPct) / 100);
    const newFlexible = Math.max(0, budgetAmount - totalFixed - desiredSavings);

    activeState.flexibleSpending = newFlexible;
    flexSlider.value = newFlexible;
    flexManualInput.value = newFlexible.toFixed(2);
    saveAndSync();
});

function updateSavingsTargetInput() {
    const budgetAmount = parseFloat(activeState.monthlyBudget) || 0;
    const totalFixed = activeState.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalFlexible = parseFloat(activeState.flexibleSpending) || 0;

    if (budgetAmount <= 0) {
        savingsTargetInput.value = '';
        return;
    }

    const savingsValue = Math.max(0, budgetAmount - totalFixed - totalFlexible);
    const savingsPct = (savingsValue / budgetAmount) * 100;
    savingsTargetInput.value = savingsPct.toFixed(1);
}

// Feature 3: Sorted Data Ledger Array Rendering with Inline State Tracking Toggles
function renderLedger() {
    transactionList.innerHTML = '';
    
    // Create copy, sorting strictly by numerical day values
    const sortedExpenses = [...activeState.fixedExpenses].map((item, index) => ({...item, originalIndex: index}));
    sortedExpenses.sort((a, b) => a.dueDate - b.dueDate);

    sortedExpenses.forEach((expense) => {
        const row = document.createElement('tr');
        if (expense.isPaid) row.classList.add('paid-row');

        row.innerHTML = `
            <td>
                <input type="checkbox" class="pay-checkbox" ${expense.isPaid ? 'checked' : ''} 
                    onchange="toggleExpensePaid(${expense.originalIndex})">
            </td>
            <td>Day ${expense.dueDate}</td>
            <td>${expense.description}</td>
            <td style="color: var(--expense-color); font-weight:600; font-size:0.85rem;">FIXED</td>
            <td>${activeState.currency}${expense.amount.toFixed(2)}</td>
            <td><button class="delete-btn" onclick="deleteFixedExpense(${expense.originalIndex})">✕</button></td>
        `;
        transactionList.appendChild(row);
    });
}

// Feature 1: Charting Matrix Controller using Chart.js Interface Instantiations
function renderCharts(fixed, flexible, savings) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    // Baseline asset pooling distribution values context variables array elements mapping
    const positiveSavingsPool = savings > 0 ? savings : 0;
    
    const chartData = [fixed, flexible, positiveSavingsPool];
    const chartLabels = ['Fixed Costs', 'Flexible Allocated', 'Retained Savings'];
    
    if (allocationChartInstance) {
        allocationChartInstance.data.datasets[0].data = chartData;
        allocationChartInstance.update();
    } else {
        allocationChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: ['#e74c3c', '#3498db', '#2ecc71'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, color: 'gray' } }
                }
            }
        });
    }
}

// --- Dynamic Event Engine Pipeline Registrations ---

// Feature 4: Profile Tracking Change Hooks
profileSelect.addEventListener('change', (e) => {
    currentProfileKey = e.target.value;
    globalBudgetEngine.activeProfile = currentProfileKey;
    saveState();
    syncActiveProfilePointers();
});

// Feature 5: Dark Theme Toggle Controller Hook
themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    globalBudgetEngine.theme = isDark ? 'dark' : 'light';
    themeToggle.innerText = isDark ? '☀️' : '🌙';
    saveState();
});

// Feature 2: Data Portability System Serialization Exports Management Pipeline
exportBtn.addEventListener('click', () => {
    const dataStream = JSON.stringify(globalBudgetEngine, null, 2);
    const dataBlob = new Blob([dataStream], { type: 'application/json' });
    const localUrl = URL.createObjectURL(dataBlob);
    
    const trackingAnchor = document.createElement('a');
    trackingAnchor.href = localUrl;
    trackingAnchor.download = `budget_backup_${currentProfileKey}_${new Date().toISOString().split('T')[0]}.json`;
    trackingAnchor.click();
    URL.revokeObjectURL(localUrl);
});

// Feature 2: System Restorations Processing Upload Streams Processing Pipeline
importFile.addEventListener('change', (e) => {
    const targetedFile = e.target.files[0];
    if (!targetedFile) return;

    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const parsedSystemState = JSON.parse(event.target.result);
            if (parsedSystemState.profiles) {
                globalBudgetEngine = parsedSystemState;
                currentProfileKey = globalBudgetEngine.activeProfile || 'default';
                saveState();
                initEngine();
                alert('System State Restored Successfully.');
            } else {
                alert('Parsing Error: File signature mismatch structure maps invalid configurations.');
            }
        } catch (err) {
            alert('Failure Engine: Processing structural faults encountered processing textual asset maps.');
        }
    };
    fileReader.readAsText(targetedFile);
});

// Standard Value Pipeline Tracking Observers
currencySelect.addEventListener('change', (e) => {
    activeState.currency = e.target.value;
    saveAndSync();
});

monthlyBudgetInput.addEventListener('input', (e) => {
    activeState.monthlyBudget = parseFloat(e.target.value) || 0;
    adjustSliderMaxCap();
    updateSavingsTargetInput();
    saveAndSync();
});

flexSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) || 0;
    activeState.flexibleSpending = val;
    flexManualInput.value = val.toFixed(2);
    updateSavingsTargetInput();
    saveAndSync();
});

flexManualInput.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value) || 0;
    const peak = parseFloat(flexSlider.max);
    if (val > peak) { val = peak; flexManualInput.value = peak.toFixed(2); }
    activeState.flexibleSpending = val;
    flexSlider.value = val;
    updateSavingsTargetInput();
    saveAndSync();
});

fixedExpenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const expenseItem = {
        description: fixedDesc.value,
        amount: parseFloat(fixedAmount.value) || 0,
        dueDate: parseInt(fixedDate.value) || 1, // Store numerical tracking day index
        isPaid: false // Base structural boolean flag instantiation parameters
    };
    activeState.fixedExpenses.push(expenseItem);
    fixedExpenseForm.reset();
    adjustSliderMaxCap();
    saveAndSync();
});

window.deleteFixedExpense = function(index) {
    activeState.fixedExpenses.splice(index, 1);
    adjustSliderMaxCap();
    saveAndSync();
};

// Feature 3: Interactive Inline Checkbox State Mutations Handlers
window.toggleExpensePaid = function(index) {
    activeState.fixedExpenses[index].isPaid = !activeState.fixedExpenses[index].isPaid;
    saveAndSync();
};

function saveAndSync() { saveState(); updateUI(); }
function saveState() { localStorage.setItem('multi_profile_engine_v3', JSON.stringify(globalBudgetEngine)); }

// Render Totals and Calculate Net Residual Savings + Percentage
function updateUI() {
    const symbol = activeState.currency;
    document.querySelectorAll('.currency').forEach(el => el.innerText = symbol);

    const budgetAmount = parseFloat(activeState.monthlyBudget) || 0;
    const totalFixed = activeState.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalFlexible = parseFloat(activeState.flexibleSpending) || 0;
    
    const totalCombinedExpenses = totalFixed + totalFlexible;
    const netSavings = budgetAmount - totalCombinedExpenses;

    // --- CALCULATE SAVINGS PERCENTAGE ---
    let savingsPercentage = 0;
    if (budgetAmount > 0 && netSavings > 0) {
        savingsPercentage = (netSavings / budgetAmount) * 100;
    }

    // Display updates on Cards
    totalBudgetEl.innerHTML = `<span class="currency">${symbol}</span>${budgetAmount.toFixed(2)}`;
    totalExpensesEl.innerHTML = `<span class="currency">${symbol}</span>${totalCombinedExpenses.toFixed(2)}`;
    
    // Injected savings value with its calculated percentage breakdown
    netSavingsEl.innerHTML = `
        <span class="currency">${symbol}</span>${netSavings.toFixed(2)} 
        <span class="savings-pct">(${savingsPercentage.toFixed(1)}%)</span>
    `;
    
    netSavingsEl.style.color = netSavings < 0 ? 'var(--expense-color)' : 'var(--savings-color)';

    renderLedger();
    renderCharts(totalFixed, totalFlexible, netSavings);
}

// Initialize System Engine Ecosystem Configuration Pipelines On Boot
initEngine();