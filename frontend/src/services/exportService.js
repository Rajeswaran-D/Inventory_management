/**
 * EXPORT SERVICE UTILITY
 * Handles Excel and CSV export functionality
 */

import axios from 'axios';
import { formatDate } from '../utils/dateFiltering';

const API_BASE = 'http://localhost:5000/api/sales';

/**
 * Export sales data to Excel
 * @param {string} filterType - Filter type ('today', 'week', 'month', 'year', 'all')
 * @param {Date} startDate - Custom start date (for custom filter)
 * @param {Date} endDate - Custom end date (for custom filter)
 * @returns {Promise} Download promise
 */
export const exportToExcel = async (filterType = 'all', startDate = null, endDate = null) => {
  try {
    const params = { filter: filterType };

    if (filterType === 'custom' && startDate && endDate) {
      params.startDate = formatDate(startDate);
      params.endDate = formatDate(endDate);
    }

    console.log('📥 Exporting to Excel...', params);

    const response = await axios.get(`${API_BASE}/export/excel`, {
      params,
      responseType: 'blob'
    });

    // Create blob and trigger download
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Sales_Report_${filterType}_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ Excel file downloaded successfully!');
    return true;
  } catch (err) {
    console.error('❌ Error exporting to Excel:', err);
    throw new Error(err.response?.data?.message || 'Failed to export to Excel');
  }
};

/**
 * Export sales data to CSV
 * @param {string} filterType - Filter type ('today', 'week', 'month', 'year', 'all')
 * @param {Date} startDate - Custom start date (for custom filter)
 * @param {Date} endDate - Custom end date (for custom filter)
 * @returns {Promise} Download promise
 */
export const exportToCSV = async (filterType = 'all', startDate = null, endDate = null) => {
  try {
    const params = { filter: filterType };

    if (filterType === 'custom' && startDate && endDate) {
      params.startDate = formatDate(startDate);
      params.endDate = formatDate(endDate);
    }

    console.log('📥 Exporting to CSV...', params);

    const response = await axios.get(`${API_BASE}/export/csv`, {
      params,
      responseType: 'blob'
    });

    // Create blob and trigger download
    const blob = new Blob([response.data], {
      type: 'text/csv'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Sales_Report_${filterType}_${new Date().toISOString().split('T')[0]}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ CSV file downloaded successfully!');
    return true;
  } catch (err) {
    console.error('❌ Error exporting to CSV:', err);
    throw new Error(err.response?.data?.message || 'Failed to export to CSV');
  }
};

/**
 * Get filtered sales data
 * @param {string} filterType - Filter type
 * @param {Date} startDate - Custom start date
 * @param {Date} endDate - Custom end date
 * @returns {Promise} Filtered sales data
 */
export const getFilteredSales = async (filterType = 'all', startDate = null, endDate = null) => {
  try {
    const params = { filter: filterType };

    if (filterType === 'custom' && startDate && endDate) {
      params.startDate = formatDate(startDate);
      params.endDate = formatDate(endDate);
    }

    console.log('📊 Fetching filtered sales...', params);

    const response = await axios.get(`${API_BASE}/filter/data`, { params });

    return response.data.data || [];
  } catch (err) {
    console.error('❌ Error fetching filtered sales:', err);
    throw new Error(err.response?.data?.message || 'Failed to fetch filtered sales');
  }
};

/**
 * Get sales statistics
 * @param {string} filterType - Filter type
 * @param {Date} startDate - Custom start date
 * @param {Date} endDate - Custom end date
 * @returns {Promise} Statistics data
 */
export const getSalesStatistics = async (filterType = 'all', startDate = null, endDate = null) => {
  try {
    const params = { filter: filterType };

    if (filterType === 'custom' && startDate && endDate) {
      params.startDate = formatDate(startDate);
      params.endDate = formatDate(endDate);
    }

    console.log('📈 Fetching sales statistics...', params);

    const response = await axios.get(`${API_BASE}/stats/data`, { params });

    return response.data.data || {};
  } catch (err) {
    console.error('❌ Error fetching statistics:', err);
    throw new Error(err.response?.data?.message || 'Failed to fetch statistics');
  }
};
