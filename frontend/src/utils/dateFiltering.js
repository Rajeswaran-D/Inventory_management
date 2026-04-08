/**
 * DATE FILTERING UTILITY
 * Provides functions for filtering sales data by time periods
 */

/**
 * Get date range for a specific filter type
 * @param {string} filterType - 'today' | 'week' | 'month' | 'year' | 'custom'
 * @param {Date} customStartDate - Start date for custom filter
 * @param {Date} customEndDate - End date for custom filter
 * @returns {object} { startDate, endDate, label }
 */
export const getDateRange = (filterType, customStartDate = null, customEndDate = null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate, endDate, label;

  switch (filterType.toLowerCase()) {
    case 'today':
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 1);
      label = 'Today';
      break;

    case 'week':
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 1);
      label = 'This Week (Last 7 Days)';
      break;

    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      label = 'This Month';
      break;

    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear() + 1, 0, 1);
      label = 'This Year';
      break;

    case 'custom':
      if (!customStartDate || !customEndDate) {
        throw new Error('Custom date range requires both start and end dates');
      }
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      label = `${formatDate(startDate)} to ${formatDate(endDate)}`;
      break;

    default: // 'all'
      startDate = null;
      endDate = null;
      label = 'All Time';
  }

  return { startDate, endDate, label };
};

/**
 * Format date to YYYY-MM-DD string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date and time
 * @param {Date} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  const d = new Date(date);
  const dateStr = formatDate(d);
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return `${dateStr} ${time}`;
};

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object
 */
export const parseDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Calculate sales statistics for a filtered dataset
 * @param {array} sales - Array of sales records
 * @returns {object} { totalSales, totalOrders, totalItemsSold, averageOrderValue }
 */
export const calculateStatistics = (sales) => {
  if (!sales || sales.length === 0) {
    return {
      totalSales: 0,
      totalOrders: 0,
      totalItemsSold: 0,
      averageOrderValue: 0
    };
  }

  const totalSales = sales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
  const totalOrders = sales.length;
  const totalItemsSold = sales.reduce((sum, sale) => {
    return sum + (sale.items ? sale.items.length : 0);
  }, 0);
  const averageOrderValue = totalSales / totalOrders;

  return {
    totalSales: parseFloat(totalSales.toFixed(2)),
    totalOrders,
    totalItemsSold,
    averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
  };
};

/**
 * Check if a sale date falls within a date range
 * @param {Date} saleDate - Sale date to check
 * @param {Date} startDate - Range start date
 * @param {Date} endDate - Range end date
 * @returns {boolean} Whether sale is in range
 */
export const isInDateRange = (saleDate, startDate, endDate) => {
  const date = new Date(saleDate);
  return date >= startDate && date < endDate;
};

/**
 * Get filter options for UI
 * @returns {array} Array of filter option objects
 */
export const getFilterOptions = () => {
  return [
    { value: 'today', label: 'Today', icon: '📅' },
    { value: 'week', label: 'This Week', icon: '📊' },
    { value: 'month', label: 'This Month', icon: '📈' },
    { value: 'year', label: 'This Year', icon: '📉' },
    { value: 'all', label: 'All Time', icon: '🌐' },
    { value: 'custom', label: 'Custom Range', icon: '🎯' }
  ];
};
