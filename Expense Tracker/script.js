// State & Elements
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chartInstances = [];

const els = {
    balance: document.getElementById('balance'),
    income: document.getElementById('income'),
    expense: document.getElementById('expense'),
    recentList: document.getElementById('recent-list'),
    recentEmpty: document.getElementById('recent-empty'),
    fullList: document.getElementById('full-list'),
    fullEmpty: document.getElementById('full-empty'),
    incomeCardsContainer: document.getElementById('income-cards-container'),
    expenseCardsContainer: document.getElementById('expense-cards-container'),
    
    form: document.getElementById('form'),
    text: document.getElementById('text'),
    amount: document.getElementById('amount'),
    transType: document.getElementById('trans-type'),
    btnExpense: document.getElementById('btn-expense'),
    btnIncome: document.getElementById('btn-income'),
    
    // Tab Specific Forms
    formIncomeOnly: document.getElementById('form-income-only'),
    incomeText: document.getElementById('income-text'),
    incomeAmount: document.getElementById('income-amount'),
    
    formExpenseOnly: document.getElementById('form-expense-only'),
    expenseText: document.getElementById('expense-text'),
    expenseAmount: document.getElementById('expense-amount'),
    
    pageTitle: document.getElementById('page-title'),
    pageSubtitle: document.getElementById('page-subtitle')
};

// ==== NAVIGATION LOGIC ====
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page-section');

const pageDetails = {
    'dashboard': { title: 'Dashboard', sub: 'Welcome back! Here is your financial overview.' },
    'analytics': { title: 'Analytics', sub: 'Multiple visual breakdowns of your cashflow.' },
    'income-cards': { title: 'Income Cards', sub: 'Manage and add your income sources.' },
    'expense-cards': { title: 'Expense Cards', sub: 'Manage and add your expenses.' },
    'transactions': { title: 'Transaction History', sub: 'View and manage all your records.' }
};

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        els.pageTitle.innerText = pageDetails[targetId].title;
        els.pageSubtitle.innerText = pageDetails[targetId].sub;

        if(targetId === 'analytics') {
            setTimeout(renderCharts, 50);
        }
    });
});

// ==== FORM TYPE TOGGLE ====
[els.btnExpense, els.btnIncome].forEach(btn => {
    btn.addEventListener('click', (e) => {
        els.btnExpense.classList.remove('active');
        els.btnIncome.classList.remove('active');
        e.target.classList.add('active');
        els.transType.value = e.target.getAttribute('data-type');
    });
});

// ==== CORE LOGIC ====
function generateID() { return Math.floor(Math.random() * 100000000); }
function formatMoney(num) { return '₹' + Math.abs(num).toLocaleString('en-IN', {minimumFractionDigits: 2}); }
function formatDate(dateStr) { return new Date(dateStr).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}); }

// Generic insert transaction function
function insertTransaction(textVal, amountVal, isExpense) {
    if (!textVal || isNaN(amountVal)) return false;
    
    const finalAmount = isExpense ? -Math.abs(amountVal) : Math.abs(amountVal);

    const tx = {
        id: generateID(),
        text: textVal,
        amount: finalAmount,
        date: new Date().toISOString()
    };

    transactions.unshift(tx);
    updateUI();
    return true;
}

// Form Handlers
els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    if(insertTransaction(els.text.value.trim(), parseFloat(els.amount.value), els.transType.value === 'expense')) {
        els.text.value = ''; els.amount.value = '';
    }
});

els.formIncomeOnly.addEventListener('submit', (e) => {
    e.preventDefault();
    if(insertTransaction(els.incomeText.value.trim(), parseFloat(els.incomeAmount.value), false)) {
        els.incomeText.value = ''; els.incomeAmount.value = '';
    }
});

els.formExpenseOnly.addEventListener('submit', (e) => {
    e.preventDefault();
    if(insertTransaction(els.expenseText.value.trim(), parseFloat(els.expenseAmount.value), true)) {
        els.expenseText.value = ''; els.expenseAmount.value = '';
    }
});

window.deleteTransaction = function(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateUI();
}

document.getElementById('clear-all').addEventListener('click', () => {
    if(confirm('Are you sure you want to clear ALL transactions?')) {
        transactions = [];
        updateUI();
    }
});

// ==== RENDERERS ====
function renderTableRows(listElem, emptyElem, limit = null) {
    listElem.innerHTML = '';
    const items = limit ? transactions.slice(0, limit) : transactions;

    if (items.length === 0) {
        emptyElem.style.display = 'block';
        listElem.parentElement.style.display = 'none';
    } else {
        emptyElem.style.display = 'none';
        listElem.parentElement.style.display = 'table';
        
        items.forEach(tx => {
            const isIncome = tx.amount > 0;
            const sign = isIncome ? '+' : '-';
            const badgeClass = isIncome ? 'income' : 'expense';
            const badgeText = isIncome ? 'Income' : 'Expense';

            const tr = document.createElement('tr');
            
            if(limit) {
                tr.innerHTML = `
                    <td><strong>${tx.text}</strong><br><small style="color:var(--text-secondary)">${formatDate(tx.date)}</small></td>
                    <td class="text-right amount ${badgeClass}">${sign}${formatMoney(tx.amount)}</td>
                `;
            } else {
                tr.innerHTML = `
                    <td><strong>${tx.text}</strong></td>
                    <td>${formatDate(tx.date)}</td>
                    <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                    <td class="text-right amount ${badgeClass}">${sign}${formatMoney(tx.amount)}</td>
                    <td class="text-center">
                        <button class="del-btn" onclick="deleteTransaction(${tx.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
            }
            listElem.appendChild(tr);
        });
    }
}

function renderCards(container, type) {
    container.innerHTML = '';
    const items = transactions.filter(t => type === 'income' ? t.amount > 0 : t.amount < 0);

    if(items.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1">No ${type} records found.</div>`;
        return;
    }

    const themeClass = type === 'income' ? 'income-theme' : 'expense-theme';
    const iconClass = type === 'income' ? 'fa-wallet' : 'fa-receipt';

    items.forEach(tx => {
        const div = document.createElement('div');
        div.className = `type-card ${themeClass}`;
        div.innerHTML = `
            <i class="fa-solid ${iconClass} tc-icon"></i>
            <div class="tc-header">
                <span style="color: rgba(255,255,255,0.7)">ID: #${tx.id.toString().slice(0,4)}</span>
                <button class="del-btn" style="background:transparent; padding:0; width:auto; height:auto; color: rgba(255,255,255,0.7)" onclick="deleteTransaction(${tx.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="tc-title">${tx.text}</div>
            <div class="tc-amount">${formatMoney(tx.amount)}</div>
            <span class="tc-date">Date: ${formatDate(tx.date)}</span>
        `;
        container.appendChild(div);
    });
}

function updateUI() {
    localStorage.setItem('transactions', JSON.stringify(transactions));

    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0);
    const expense = amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1;

    els.balance.innerText = formatMoney(total);
    els.income.innerText = formatMoney(income);
    els.expense.innerText = formatMoney(expense);

    renderTableRows(els.recentList, els.recentEmpty, 5); 
    renderTableRows(els.fullList, els.fullEmpty);        
    renderCards(els.incomeCardsContainer, 'income');
    renderCards(els.expenseCardsContainer, 'expense');

    if(document.getElementById('analytics').classList.contains('active')) {
        renderCharts();
    }
}

// ==== CHARTS ====
function renderCharts() {
    // Clear old instances
    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];

    let income = 0, expense = 0;
    transactions.forEach(t => {
        if(t.amount > 0) income += t.amount;
        else expense += Math.abs(t.amount);
    });

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    // Chart 1: Doughnut
    const ctx1 = document.getElementById('chart1').getContext('2d');
    const chart1 = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [{
                data: [income || 0.01, expense || 0.01],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    
    // Chart 2: Bar Chart
    const ctx2 = document.getElementById('chart2').getContext('2d');
    const chart2 = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Current Period'],
            datasets: [
                { label: 'Income', data: [income], backgroundColor: '#10b981' },
                { label: 'Expense', data: [expense], backgroundColor: '#ef4444' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    chartInstances.push(chart1, chart2);
}

// Init
updateUI();
