// Constants & State
const API_URL = 'http://localhost:5000/api';
let envelopes = [];
let customers = [];
let cart = [];
let salesChart, stockChart;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboard();
    fetchEnvelopes();
    fetchCustomers();
    showSection('dashboard');
    lucide.createIcons();
    setupEventListeners();
    
    // Check dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
        updateDarkModeUI();
    }
});

function setupEventListeners() {
    // Inventory search
    document.getElementById('inventorySearch').addEventListener('input', (e) => {
        renderInventory(e.target.value);
    });

    // Envelope Form
    document.getElementById('envelopeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const id = data.id;
        delete data.id;

        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/envelopes/${id}` : `${API_URL}/envelopes`;
            const resp = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await resp.json();
            if (result.error) throw new Error(result.error);
            
            showToast(id ? 'Product updated!' : 'Product added!', 'success');
            closeModal();
            fetchEnvelopes();
            fetchDashboard();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Customer Form
    document.getElementById('customerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            const resp = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            await resp.json();
            showToast('Customer registered!', 'success');
            closeModal();
            fetchCustomers();
        } catch (err) {
            showToast('Error registering customer', 'error');
        }
    });
}

// Global Core Functions
async function fetchDashboard() {
    try {
        const resp = await fetch(`${API_URL}/dashboard`);
        const data = await resp.json();
        
        document.getElementById('totalStockVal').innerText = (data.totalStock || 0).toLocaleString();
        document.getElementById('todaySalesVal').innerText = `$${(data.todaySales || 0).toFixed(2)}`;
        document.getElementById('lowStockVal').innerText = data.lowStockAlerts;
        
        document.getElementById('topSizeVal').innerText = data.topSize || 'N/A';
        document.getElementById('topGSMVal').innerText = data.topGSM ? `${data.topGSM} GSM` : 'N/A';

        initCharts(data.salesTrend, data.stockDistribution);
    } catch (err) {
        console.error('Dashboard fetch failed', err);
    }
}

async function downloadExcelReport() {
    window.open(`${API_URL}/export/reports`, '_blank');
}

async function fetchEnvelopes() {
    try {
        const resp = await fetch(`${API_URL}/envelopes`);
        envelopes = await resp.json();
        renderInventory();
        populatePOSDropdowns();
    } catch (err) {
        console.error('Envelopes fetch failed', err);
    }
}

async function fetchCustomers() {
    try {
        const resp = await fetch(`${API_URL}/customers`);
        customers = await resp.json();
        renderCustomers();
        populatePOSDropdowns();
    } catch (err) {
        console.error('Customers fetch failed', err);
    }
}

function renderInventory(query = '') {
    const tbody = document.getElementById('inventoryTableBody');
    const filtered = envelopes.filter(e => 
        e.size.toLowerCase().includes(query.toLowerCase()) || 
        e.material_type.toLowerCase().includes(query.toLowerCase()) ||
        e.color.toLowerCase().includes(query.toLowerCase())
    );

    tbody.innerHTML = filtered.map(e => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-6 py-4 font-mono text-xs text-slate-500">ENV-${e.id.toString().padStart(4, '0')}</td>
            <td class="px-6 py-4">
                <div class="font-bold">${e.size}</div>
                <div class="text-xs text-slate-500">${e.color || 'No Color'}</div>
            </td>
            <td class="px-6 py-4">${e.gsm}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-md text-xs font-bold ${getMaterialColor(e.material_type)}">
                    ${e.material_type}
                </span>
            </td>
            <td class="px-6 py-4 font-semibold">$${e.price.toFixed(2)}</td>
            <td class="px-6 py-4 text-center">
                <span class="font-bold ${e.quantity <= e.low_stock_threshold ? 'text-red-500 animate-pulse' : ''}">
                    ${e.quantity}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="editEnvelope(${e.id})" class="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"><i data-lucide="edit-2"></i></button>
                    <button onclick="deleteEnvelope(${e.id})" class="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function renderCustomers() {
    const grid = document.getElementById('customerGrid');
    grid.innerHTML = customers.map(c => `
        <div class="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all group">
            <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">
                    ${c.name.charAt(0)}
                </div>
                <div class="text-xs text-slate-400">Since ${c.created_at}</div>
            </div>
            <h4 class="font-bold text-lg mb-1">${c.name}</h4>
            <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <i data-lucide="phone" class="w-3 h-3"></i> ${c.phone}
            </div>
            <div class="text-xs text-slate-400 line-clamp-2 mb-6">${c.address || 'No address provided'}</div>
            <button class="w-full py-2 bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-600 group-hover:text-white rounded-lg text-sm font-semibold transition-all">View History</button>
        </div>
    `).join('');
    lucide.createIcons();
}

function populatePOSDropdowns() {
    const custSelect = document.getElementById('pos-customer');
    const prodSelect = document.getElementById('pos-product');
    
    custSelect.innerHTML = '<option value="">-- Choose --</option>' + customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    prodSelect.innerHTML = '<option value="">-- Select Envelope --</option>' + envelopes.map(e => `<option value="${e.id}">${e.size} ${e.material_type} (${e.gsm}G) - $${e.price.toFixed(2)}</option>`).join('');
}

// Charting
function initCharts(trend, dist) {
    const ctx1 = document.getElementById('salesChart').getContext('2d');
    const ctx2 = document.getElementById('stockDistChart').getContext('2d');
    
    if (salesChart) salesChart.destroy();
    if (stockChart) stockChart.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    salesChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: trend.map(d => d.date),
            datasets: [{
                label: 'Sales ($)',
                data: trend.map(d => d.amount),
                borderColor: '#3b82f6',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: gridColor }, ticks: { color: textColor } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            }
        }
    });

    stockChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: dist.map(d => d.type),
            datasets: [{
                data: dist.map(d => d.count),
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 20, usePointStyle: true } } }
        }
    });
}

// POS/Cart Logic
function addToCart() {
    const productId = document.getElementById('pos-product').value;
    const qty = parseInt(document.getElementById('pos-qty').value);
    
    if (!productId || qty <= 0) return showToast('Select product and valid quantity', 'warning');
    
    const product = envelopes.find(e => e.id == productId);
    if (!product) return;

    if (qty > product.quantity) return showToast(`Not enough stock! (${product.quantity} left)`, 'error');

    const existingIdx = cart.findIndex(i => i.envelope_id == productId);
    if (existingIdx > -1) {
        cart[existingIdx].quantity += qty;
        cart[existingIdx].total_price = cart[existingIdx].quantity * cart[existingIdx].unit_price;
    } else {
        cart.push({
            envelope_id: product.id,
            size: product.size,
            material: product.material_type,
            unit_price: product.price,
            quantity: qty,
            total_price: qty * product.price
        });
    }
    
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.envelope_id != id);
    renderCart();
}

function renderCart() {
    const tbody = document.getElementById('cartTableBody');
    tbody.innerHTML = cart.map(i => `
        <tr class="border-b dark:border-slate-700">
            <td class="py-4">
                <div class="font-bold">${i.size}</div>
                <div class="text-xs text-slate-500">${i.material}</div>
            </td>
            <td class="py-4">$${i.unit_price.toFixed(2)}</td>
            <td class="py-4">${i.quantity}</td>
            <td class="py-4 text-right font-bold">$${i.total_price.toFixed(2)}</td>
            <td class="py-4 text-right">
                <button onclick="removeFromCart(${i.envelope_id})" class="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-all"><i data-lucide="x" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    document.getElementById('summary-subtotal').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-total').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('checkout-btn').disabled = cart.length === 0;
    
    lucide.createIcons();
}

async function checkout() {
    const customerId = document.getElementById('pos-customer').value;
    if (!customerId) return showToast('Please select a customer', 'warning');

    try {
        const resp = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_id: customerId, items: cart })
        });
        const result = await resp.json();
        if (result.error) throw new Error(result.error);

        showToast('Tranasction Complete!', 'success');
        
        // Auto Download PDF
        window.open(`${API_URL}/export/invoice/${result.id}`, '_blank');
        
        cart = [];
        renderCart();
        fetchEnvelopes();
        fetchDashboard();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// UI Helpers
function showSection(sectionId) {
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${sectionId}-section`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.dataset.section === sectionId) {
            btn.classList.add('sidebar-item-active');
        } else {
            btn.classList.remove('sidebar-item-active');
        }
    });

    if (sectionId === 'dashboard') fetchDashboard();
    if (sectionId === 'inventory') fetchEnvelopes();
    if (sectionId === 'customers') fetchCustomers();
}

function openModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('scale-95');
        modal.classList.add('scale-100');
    }, 10);

    if (modalId === 'envelope-modal') {
        if (!document.getElementById('edit-id').value) {
            document.getElementById('envelopeForm').reset();
            document.getElementById('envelopeModalTitle').innerText = 'Add Product';
        }
    }
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.querySelectorAll('.modal-content').forEach(m => {
        m.classList.add('hidden');
        m.classList.add('scale-95');
    });
    document.getElementById('edit-id').value = ''; // Reset edit id
}

function editEnvelope(id) {
    const e = envelopes.find(env => env.id === id);
    if (!e) return;
    
    document.getElementById('envelopeModalTitle').innerText = 'Edit Product';
    document.getElementById('edit-id').value = e.id;
    const form = document.getElementById('envelopeForm');
    form.size.value = e.size;
    form.gsm.value = e.gsm;
    form.material_type.value = e.material_type;
    form.color.value = e.color;
    form.price.value = e.price;
    form.quantity.value = e.quantity;
    form.low_stock_threshold.value = e.low_stock_threshold;
    
    openModal('envelope-modal');
}

async function deleteEnvelope(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        await fetch(`${API_URL}/envelopes/${id}`, { method: 'DELETE' });
        showToast('Product deleted', 'success');
        fetchEnvelopes();
    } catch (err) {
        showToast('Error deleting product', 'error');
    }
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeUI();
    // Re-init charts to update colors
    fetchDashboard();
}

function updateDarkModeUI() {
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('lightIcon').classList.toggle('hidden', isDark);
    document.getElementById('darkIcon').classList.toggle('hidden', !isDark);
    document.getElementById('modeText').innerText = isDark ? 'Dark Mode' : 'Light Mode';
    document.getElementById('toggleDot').classList.toggle('translate-x-4', isDark);
}

function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-orange-500',
        info: 'bg-blue-600'
    };
    toast.className = `${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl mb-4 transform translate-y-10 opacity-0 transition-all flex items-center gap-3`;
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'info'}"></i> <span>${msg}</span>`;
    
    const container = document.getElementById('toast');
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 100);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-10');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function getMaterialColor(type) {
    switch(type) {
        case 'MP': return 'bg-blue-100 text-blue-600';
        case 'Buff': return 'bg-orange-100 text-orange-600';
        case 'K': return 'bg-purple-100 text-purple-600';
        case 'Premium': return 'bg-green-100 text-green-600';
        default: return 'bg-slate-100 text-slate-600';
    }
}
