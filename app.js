// ==========================================
// SAVINGS TRACKER - APPLICATION LOGIC
// ==========================================

class SavingsTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        // App is simplified to INR-only. currentCurrency always INR
        this.currentCurrency = 'INR';

        this.initializeEventListeners();
        this.initializeFormDefaults();
        this.updateDashboard();
    }

    // ==========================================
    // CURRENCY MANAGEMENT
    // ==========================================

    loadCurrency() {
        return 'INR';
    }

    saveCurrency(currency) {
        localStorage.setItem('selectedCurrency', currency);
        this.currentCurrency = currency;
    }

    getCurrencySymbol() {
        const symbols = {
            'USD': '$',
            'INR': '₹',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'AUD': 'A$',
            'CAD': 'C$'
        };
        return symbols[this.currentCurrency] || '$';
    }

    // Simplified: app runs only in INR, no currency conversions required.
    // convertCurrency becomes an identity function when both currencies are INR.
    convertCurrency(amount, fromCurrency, toCurrency) {
        if (!amount || isNaN(amount)) return 0;
        if (fromCurrency === toCurrency) return parseFloat(amount);
        // If ever asked to convert to INR, and original was different but we removed live rates,
        // assume the original currency was INR (legacy) and return amount directly.
        return parseFloat(amount);
    }

    // ==========================================
    // DATA MANAGEMENT
    // ==========================================

    loadTransactions() {
        const stored = localStorage.getItem('savingsTransactions');
        let transactions = stored ? JSON.parse(stored) : [];
        
        // Migrate old transactions without currency info to INR as default
        let needsSave = false;
        transactions = transactions.map(t => {
            if (!t.originalCurrency) {
                t.originalCurrency = 'INR';  // Default old transactions to INR
                needsSave = true;
            }
            return t;
        });
        
        // Save migrated data back to localStorage
        if (needsSave && transactions.length > 0) {
            localStorage.setItem('savingsTransactions', JSON.stringify(transactions));
        }
        
        return transactions;
    }

    saveTransactions() {
        localStorage.setItem('savingsTransactions', JSON.stringify(this.transactions));
    }

    addTransaction(transaction) {
        const newTransaction = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            originalCurrency: this.currentCurrency,  // Store original currency
            ...transaction
        };
        this.transactions.push(newTransaction);
        this.saveTransactions();
        return newTransaction;
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
    }

    // ==========================================
    // CALCULATIONS
    // ==========================================

    getTotalSavings() {
        return this.transactions.reduce((sum, t) => {
            const originalCurrency = t.originalCurrency || 'INR';
            const convertedAmount = this.convertCurrency(
                parseFloat(t.amount || 0),
                originalCurrency,
                this.currentCurrency
            );
            return sum + convertedAmount;
        }, 0);
    }

    getMonthlySavings() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => {
                const originalCurrency = t.originalCurrency || 'INR';
                const convertedAmount = this.convertCurrency(
                    parseFloat(t.amount || 0),
                    originalCurrency,
                    this.currentCurrency
                );
                return sum + convertedAmount;
            }, 0);
    }

    getLastTransaction() {
        if (this.transactions.length === 0) return null;
        const sorted = [...this.transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        return sorted[0];
    }

    getAverageDeposit() {
        if (this.transactions.length === 0) return 0;
        return this.getTotalSavings() / this.transactions.length;
    }

    getMaxDeposit() {
        if (this.transactions.length === 0) return 0;
        return Math.max(...this.transactions.map(t => {
            const originalCurrency = t.originalCurrency || 'INR';
            return this.convertCurrency(
                parseFloat(t.amount || 0),
                originalCurrency,
                this.currentCurrency
            );
        }));
    }

    getMinDeposit() {
        if (this.transactions.length === 0) return 0;
        return Math.min(...this.transactions.map(t => {
            const originalCurrency = t.originalCurrency || 'INR';
            return this.convertCurrency(
                parseFloat(t.amount || 0),
                originalCurrency,
                this.currentCurrency
            );
        }));
    }

    getCategorySummary() {
        const summary = {};
        this.transactions.forEach(t => {
            const category = t.category || 'Other';
            const originalCurrency = t.originalCurrency || 'INR';
            const convertedAmount = this.convertCurrency(
                parseFloat(t.amount || 0),
                originalCurrency,
                this.currentCurrency
            );
            summary[category] = (summary[category] || 0) + convertedAmount;
        });
        return summary;
    }

    getSourceSummary() {
        const summary = {};
        this.transactions.forEach(t => {
            const source = t.source || 'Other';
            const originalCurrency = t.originalCurrency || 'INR';
            const convertedAmount = this.convertCurrency(
                parseFloat(t.amount || 0),
                originalCurrency,
                this.currentCurrency
            );
            summary[source] = (summary[source] || 0) + convertedAmount;
        });
        return summary;
    }

    getMonthlySummary() {
        const summary = {};
        this.transactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const originalCurrency = t.originalCurrency || 'USD';
            const convertedAmount = this.convertCurrency(
                parseFloat(t.amount || 0),
                originalCurrency,
                this.currentCurrency
            );
            summary[monthKey] = (summary[monthKey] || 0) + convertedAmount;
        });
        return summary;
    }

    // ==========================================
    // UI UPDATES
    // ==========================================

    updateDashboard() {
        this.updateDashboardStats();
        this.updateFormCurrencySymbol();
        this.updateRecentTransactions();
        this.updateTransactionsList();
        this.updateAnalytics();
    }

    updateFormCurrencySymbol() {
        const symbolElement = document.getElementById('formCurrencySymbol');
        if (symbolElement) {
            symbolElement.textContent = this.getCurrencySymbol();
        }
    }

    updateDashboardStats() {
        const totalSavings = this.getTotalSavings();
        const monthlySavings = this.getMonthlySavings();
        const lastTransaction = this.getLastTransaction();
        const avgDeposit = this.getAverageDeposit();
        const maxDeposit = this.getMaxDeposit();
        const minDeposit = this.getMinDeposit();

        document.getElementById('totalSavings').textContent = this.formatCurrency(totalSavings);
        document.getElementById('monthlySavings').textContent = this.formatCurrency(monthlySavings);
        document.getElementById('totalDeposits').textContent = this.transactions.length;
        
        if (lastTransaction) {
            const originalCurrency = lastTransaction.originalCurrency || 'INR';
            const convertedAmount = this.convertCurrency(
                parseFloat(lastTransaction.amount),
                originalCurrency,
                this.currentCurrency
            );
            document.getElementById('lastTransaction').textContent = this.formatCurrency(convertedAmount);
        } else {
            document.getElementById('lastTransaction').textContent = '-';
        }
        
        document.getElementById('avgDeposit').textContent = this.formatCurrency(avgDeposit);
        document.getElementById('maxDeposit').textContent = this.formatCurrency(maxDeposit);
        document.getElementById('minDeposit').textContent = this.formatCurrency(minDeposit);
    }

    updateRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        const sorted = [...this.transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        ).slice(0, 5);

        if (sorted.length === 0) {
            container.innerHTML = '<p class="empty-state">No transactions yet. Start by adding your first savings! 🚀</p>';
            return;
        }

        container.innerHTML = sorted.map(t => {
            const originalCurrency = t.originalCurrency || 'INR';
            const convertedAmount = this.convertCurrency(
                parseFloat(t.amount || 0),
                originalCurrency,
                this.currentCurrency
            );
            return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-category">
                        ${this.getCategoryEmoji(t.category)} ${this.formatCategory(t.category)}
                    </div>
                    <div class="transaction-details">
                        ${t.source ? `Source: ${this.formatCategory(t.source)}` : ''}
                        ${t.description ? ` • ${t.description}` : ''}
                        <span style="opacity: 0.7; font-size: 0.85em;"> (Originally: ${this.formatCurrency(parseFloat(t.amount), t.originalCurrency || 'INR')})</span>
                    </div>
                </div>
                <div class="transaction-amount">
                    +${this.formatCurrency(convertedAmount)}
                </div>
                <div class="transaction-date">
                    ${this.formatDate(t.date)}
                </div>
            </div>
        `;
        }).join('');
    }

    updateTransactionsList(filterCategory = '', searchTerm = '') {
        const container = document.getElementById('transactionsList');
        let filtered = this.transactions;

        // Filter by category
        if (filterCategory) {
            filtered = filtered.filter(t => t.category === filterCategory);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(t => 
                (t.description || '').toLowerCase().includes(term) ||
                (t.source || '').toLowerCase().includes(term) ||
                (t.category || '').toLowerCase().includes(term)
            );
        }

        // Sort by date descending
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">No transactions to display. Create your first one! 📝</p>';
            return;
        }

        container.innerHTML = filtered.map(t => {
            const originalCurrency = t.originalCurrency || 'INR';
            const convertedAmount = this.convertCurrency(
                parseFloat(t.amount || 0),
                originalCurrency,
                this.currentCurrency
            );
            return `
            <div class="transaction-row">
                <div>
                    <div class="transaction-category">
                        ${this.getCategoryEmoji(t.category)} ${this.formatCategory(t.category)}
                    </div>
                    <div class="transaction-details">
                        ${t.description || 'No description'}
                        <span style="opacity: 0.7; font-size: 0.85em;"> (Originally: ${this.formatCurrency(parseFloat(t.amount), originalCurrency)})</span>
                    </div>
                </div>
                <div class="transaction-category-badge">${this.formatCategory(t.source)}</div>
                <div>${this.formatDate(t.date)}</div>
                <div style="font-size: 1.125rem; font-weight: 700; color: var(--secondary-color);">
                    +${this.formatCurrency(convertedAmount)}
                </div>
                <button class="btn btn-danger" onclick="app.deleteAndUpdate(${t.id})">Delete</button>
            </div>
        `;
        }).join('');
    }

    updateAnalytics() {
        this.updateCategoryBreakdown();
        this.updateSourceBreakdown();
        this.updateMonthlyTrend();
    }

    updateCategoryBreakdown() {
        const container = document.getElementById('categoryBreakdown');
        const summary = this.getCategorySummary();
        const total = this.getTotalSavings();

        if (Object.keys(summary).length === 0) {
            container.innerHTML = '<p class="empty-state">No data available yet</p>';
            return;
        }

        const items = Object.entries(summary)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => {
                const percentage = (amount / total) * 100;
                return `
                    <div class="breakdown-item">
                        <div class="breakdown-label">${this.getCategoryEmoji(category)} ${this.formatCategory(category)}</div>
                        <div class="breakdown-bar">
                            <div class="breakdown-progress" style="width: ${percentage}%"></div>
                        </div>
                        <div class="breakdown-value">${this.formatCurrency(amount)}</div>
                    </div>
                `;
            });

        container.innerHTML = items.join('');
    }

    updateSourceBreakdown() {
        const container = document.getElementById('sourceBreakdown');
        const summary = this.getSourceSummary();
        const total = this.getTotalSavings();

        if (Object.keys(summary).length === 0) {
            container.innerHTML = '<p class="empty-state">No data available yet</p>';
            return;
        }

        const items = Object.entries(summary)
            .sort((a, b) => b[1] - a[1])
            .map(([source, amount]) => {
                const percentage = (amount / total) * 100;
                return `
                    <div class="breakdown-item">
                        <div class="breakdown-label">${this.formatCategory(source)}</div>
                        <div class="breakdown-bar">
                            <div class="breakdown-progress" style="width: ${percentage}%"></div>
                        </div>
                        <div class="breakdown-value">${this.formatCurrency(amount)}</div>
                    </div>
                `;
            });

        container.innerHTML = items.join('');
    }

    updateMonthlyTrend() {
        const container = document.getElementById('monthlyTrend');
        const summary = this.getMonthlySummary();

        if (Object.keys(summary).length === 0) {
            container.innerHTML = '<p class="empty-state">No data available yet</p>';
            return;
        }

        const items = Object.entries(summary)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([monthKey, amount]) => {
                const [year, month] = monthKey.split('-');
                const monthName = new Date(year, parseInt(month) - 1).toLocaleString('default', { 
                    month: 'long', 
                    year: 'numeric' 
                });
                return `
                    <div class="monthly-item">
                        <div class="monthly-month">${monthName}</div>
                        <div class="monthly-amount">${this.formatCurrency(amount)}</div>
                    </div>
                `;
            });

        container.innerHTML = items.join('');
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    initializeEventListeners() {
        // No currency controls in simplified INR-only app

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn')));
        });

        // Form submission
        const form = document.getElementById('savingsForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Search and filter
        const searchInput = document.getElementById('searchInput');
        const filterSelect = document.getElementById('filterCategory');

        searchInput.addEventListener('input', () => {
            this.updateTransactionsList(filterSelect.value, searchInput.value);
        });

        filterSelect.addEventListener('change', () => {
            this.updateTransactionsList(filterSelect.value, searchInput.value);
        });

        // Clear history button
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.promptClearHistory();
            });
        }
    }

    // (Rate info removed for INR-only simplified app)

    initializeFormDefaults() {
        const dateInput = document.getElementById('date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    switchTab(btn) {
        // Deactivate all tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

        // Activate clicked tab
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById(tabId).classList.add('active');
    }

    handleFormSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const transaction = {
            amount: form.querySelector('#amount').value,
            category: form.querySelector('#category').value,
            date: form.querySelector('#date').value,
            description: form.querySelector('#description').value,
            source: form.querySelector('#source').value
        };

        // Validate
        if (!transaction.amount || parseFloat(transaction.amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        // Add transaction
        this.addTransaction(transaction);

        // Reset form
        form.reset();
        this.initializeFormDefaults();

        // Update UI
        this.updateDashboard();
        this.showSuccessMessage();

        // Switch to dashboard
        document.querySelector('[data-tab="dashboard"]').click();
    }

    deleteAndUpdate(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.deleteTransaction(id);
            this.updateDashboard();
            this.showSuccessMessage('Transaction deleted successfully!');
        }
    }

    // Clear all history with password protection (modal-based)
    promptClearHistory() {
        // If there are no transactions, do nothing - silent return
        if (!this.transactions || this.transactions.length === 0) {
            return;
        }
        const passwordModal = document.getElementById('passwordModal');
        const passwordInput = document.getElementById('passwordInput');
        const passwordError = document.getElementById('passwordError');
        const modalSubmitBtn = document.getElementById('modalSubmitBtn');
        const modalCancelBtn = document.getElementById('modalCancelBtn');
        const modalCloseBtn = document.getElementById('modalCloseBtn');

        // Show password modal
        passwordModal.classList.add('show');
        passwordInput.value = '';
        passwordInput.focus();

        // Submit password
        const handlePasswordSubmit = () => {
            const password = passwordInput.value;
            // Clear previous error
            if (passwordError) {
                passwordError.style.display = 'none';
                passwordError.textContent = '';
                passwordInput.classList.remove('error');
            }
            if (password !== 'admin') {
                // Show inline error in the modal instead of alert and keep modal open
                if (passwordError) {
                    passwordError.style.display = 'block';
                    passwordError.textContent = 'Incorrect password. Please try again.';
                }
                passwordInput.classList.add('error');
                passwordInput.focus();
                return;
            }
            // Password correct, show confirmation modal
            passwordModal.classList.remove('show');
            this.showConfirmationModal();
        };

        // Cancel
        const handleCancel = () => {
            passwordModal.classList.remove('show');
            passwordInput.value = '';
        };

        // Enter key to submit
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handlePasswordSubmit();
            }
        };

        modalSubmitBtn.onclick = handlePasswordSubmit;
        modalCancelBtn.onclick = handleCancel;
        modalCloseBtn.onclick = handleCancel;
        passwordInput.onkeypress = handleKeyPress;
    }

    // Show confirmation modal and delete if confirmed
    showConfirmationModal() {
        const confirmModal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmOkBtn = document.getElementById('confirmOkBtn');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        const confirmCloseBtn = document.getElementById('confirmCloseBtn');

        confirmMessage.textContent = '⚠️ Are you sure? This will delete ALL transactions permanently!';
        confirmModal.classList.add('show');

        // Confirm deletion
        const handleConfirm = () => {
            confirmModal.classList.remove('show');
            this.transactions = [];
            this.saveTransactions();
            this.updateDashboard();
            this.showSuccessMessage('✓ All history cleared successfully!');
        };

        // Cancel
        const handleCancel = () => {
            confirmModal.classList.remove('show');
        };

        confirmOkBtn.onclick = handleConfirm;
        confirmCancelBtn.onclick = handleCancel;
        confirmCloseBtn.onclick = handleCancel;
    }

    // ==========================================
    // UTILITIES
    // ==========================================

    formatCurrency(amount, currency = null) {
        const currencyToUse = currency || this.currentCurrency;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyToUse,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    formatCategory(category) {
        return category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    getCategoryEmoji(category) {
        const emojis = {
            emergency: '🚨',
            vacation: '🏖️',
            education: '📚',
            investment: '📈',
            home: '🏠',
            retirement: '🏖️',
            car: '🚗',
            other: '💼',
            salary: '💼',
            bonus: '🎁',
            freelance: '💻',
            'investment returns': '📊',
            gift: '🎉'
        };
        return emojis[category?.toLowerCase()] || '💰';
    }

    showSuccessMessage(message = 'Savings added successfully!') {
        const msgElement = document.getElementById('successMessage');
        msgElement.querySelector('.success-text').textContent = message;
        msgElement.classList.add('show');

        setTimeout(() => {
            msgElement.classList.remove('show');
        }, 3000);
    }
}

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new SavingsTracker();
    
    // Log app initialized
    console.log('Savings Tracker initialized successfully!');
    console.log(`Loaded ${app.transactions.length} transactions`);
});
