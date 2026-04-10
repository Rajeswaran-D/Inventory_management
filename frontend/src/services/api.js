import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const envelopeService = {
  getAll: (params) => api.get('/envelopes', { params }),
  getById: (id) => api.get(`/envelopes/${id}`),
  create: (data) => api.post('/envelopes', data),
  update: (id, data) => api.put(`/envelopes/${id}`, data),
  delete: (id) => api.delete(`/envelopes/${id}`),
};

export const stockService = {
  recordIn: (data) => api.post('/stock/in', data),
  recordOut: (data) => api.post('/stock/out', data),
  getHistory: (params) => api.get('/stock/history', { params }),
};

export const saleService = {
  create: (data) => api.post('/sales', data),
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  search: (query, limit = 50) => api.get('/sales/search/query', { params: { query, limit } }),
  getByCustomer: (customerId) => api.get(`/sales/customer/${customerId}`),
  getTopSelling: () => api.get('/sales/top-selling'),
  getDashboardStats: () => api.get('/sales/dashboard-stats'),
  getReports: () => api.get('/sales/reports'),
  getFiltered: (filter = 'all', startDate = null, endDate = null) => 
    api.get('/sales/filter/data', { params: { filter, startDate, endDate } }),
  getStats: (filter = 'all', startDate = null, endDate = null) => 
    api.get('/sales/stats/data', { params: { filter, startDate, endDate } }),
  exportExcel: (filter = 'all', startDate = null, endDate = null) => 
    api.get('/sales/export/excel', { params: { filter, startDate, endDate }, responseType: 'blob' }),
  exportCSV: (filter = 'all', startDate = null, endDate = null) => 
    api.get('/sales/export/csv', { params: { filter, startDate, endDate }, responseType: 'blob' }),
  generatePDF: (saleId) => api.get(`/sales/pdf/${saleId}`),
  downloadSales: (params) => api.get('/sales/download', { params, responseType: 'blob' }),
};

export const customerService = {
  getAll: (params) => api.get('/customers', { params }),
  getOrCreate: (data) => api.post('/customers/get-or-create', data),
};

export const productService = {
  // Product Master operations
  getAllProducts: (params) => api.get('/products/master', { params }),
  getProductById: (id) => api.get(`/products/master/${id}`),
  createProduct: (data) => api.post('/products/master', data),
  updateProduct: (id, data) => api.put(`/products/master/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/master/${id}`),

  // Product Variant operations
  getAllVariants: (params) => api.get('/products/variants', { params }),
  getVariantById: (id) => api.get(`/products/variants/${id}`),
  createVariant: (data) => api.post('/products/variants', data),
  updateVariant: (id, data) => api.put(`/products/variants/${id}`, data),
  deleteVariant: (id) => api.delete(`/products/variants/${id}`),

  // Dropdown data (for dynamic UI)
  getProductConfig: () => api.get('/products/config'),
  getMaterials: () => api.get('/products/dropdowns/materials'),
  getGSMOptions: (productId) => api.get('/products/dropdowns/gsm', { params: { productId } }),
  getSizeOptions: (productId) => api.get('/products/dropdowns/sizes', { params: { productId } }),
  getColorOptions: (productId) => api.get('/products/dropdowns/colors', { params: { productId } }),
};

export const inventoryService = {
  // Inventory operations
  getAll: (params) => api.get('/inventory', { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  
  // Stock operations
  updateStock: (id, quantity) => api.put(`/inventory/${id}/stock`, { quantity }),
  getLowStock: (threshold = 50) => api.get('/inventory/low-stock', { params: { threshold } }),
  getStockHistory: (params) => api.get('/inventory/history', { params }),
  
  // NEW: Stock in/out operations
  addStock: (inventoryId, quantity, reason) => 
    api.post(`/inventory/${inventoryId}/stock-in`, { quantity, reason }),
  reduceStock: (inventoryId, quantity, reason) => 
    api.post(`/inventory/${inventoryId}/stock-out`, { quantity, reason }),
};

export const pricingTierService = {
  // Pricing tier CRUD
  getAll: (params) => api.get('/pricing-tiers', { params }),
  getById: (id) => api.get(`/pricing-tiers/${id}`),
  create: (data) => api.post('/pricing-tiers', data),
  update: (id, data) => api.put(`/pricing-tiers/${id}`, data),
  delete: (id) => api.delete(`/pricing-tiers/${id}`),
  
  // Tier calculations and analysis
  toggleStatus: (id, isActive) => api.patch(`/pricing-tiers/${id}/status`, { isActive }),
  getApplicableTier: (params) => api.get('/pricing-tiers/applicable', { params }),
  calculatePrice: (data) => api.post('/pricing-tiers/calculate-price', data),
  getStats: () => api.get('/pricing-tiers/stats'),
  getUsageReport: () => api.get('/pricing-tiers/usage-report'),
  
  // Bulk operations
  createBulk: (data) => api.post('/pricing-tiers/bulk/create', data)
};

export const reportService = {
  getAnalytics: (params) => api.get('/reports', { params }),
  downloadReport: (params) => api.get('/reports/download', { params, responseType: 'blob' })
};

export default api;
