import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
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
  getTopSelling: () => api.get('/sales/top-selling'),
  getDashboardStats: () => api.get('/sales/dashboard-stats'),
};

export const customerService = {
  getAll: (params) => api.get('/customers', { params }),
  getOrCreate: (data) => api.post('/customers/get-or-create', data),
};

export default api;
