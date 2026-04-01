import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, FileText, Sheet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { saleService } from '../services/api';
import { realTimeSyncService } from '../services/realTimeSync';
import { Card, CardContent } from '../components/ui/Card';
import { getDateRange, getFilterOptions, formatDate, calculateStatistics } from '../utils/dateFiltering';
import { exportToExcel, exportToCSV, getFilteredSales, getSalesStatistics } from '../services/exportService';

export const Reports = () => {
  const [filterType, setFilterType] = useState('today');
  const [customStartDate, setCustomStartDate] = useState(formatDate(new Date()));
  const [customEndDate, setCustomEndDate] = useState(formatDate(new Date()));
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalItemsSold: 0,
    averageOrderValue: 0
  });

  // Fetch and filter sales data
  const generateReport = async () => {
    setLoading(true);
    try {
      let startDate = null, endDate = null;

      if (filterType === 'custom') {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        const range = getDateRange(filterType);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      // Get filtered sales
      const sales = await getFilteredSales(
        filterType === 'custom' ? 'custom' : filterType,
        startDate,
        endDate
      );

      setSalesData(sales);

      // Calculate statistics
      const stats = calculateStatistics(sales);
      setSummary(stats);

      console.log('📊 Report generated:', stats);
    } catch (err) {
      console.error('❌ Report error:', err);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel export
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      if (salesData.length === 0) {
        toast.error('No data to export');
        return;
      }

      let startDate = null, endDate = null;

      if (filterType === 'custom') {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
      } else {
        const range = getDateRange(filterType);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      await exportToExcel(
        filterType === 'custom' ? 'custom' : filterType,
        startDate,
        endDate
      );

      toast.success('✅ Excel file downloaded successfully!');
    } catch (err) {
      console.error('❌ Export error:', err);
      toast.error(err.message || 'Failed to export to Excel');
    } finally {
      setExporting(false);
    }
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      if (salesData.length === 0) {
        toast.error('No data to export');
        return;
      }

      let startDate = null, endDate = null;

      if (filterType === 'custom') {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
      } else {
        const range = getDateRange(filterType);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      await exportToCSV(
        filterType === 'custom' ? 'custom' : filterType,
        startDate,
        endDate
      );

      toast.success('✅ CSV file downloaded successfully!');
    } catch (err) {
      console.error('❌ Export error:', err);
      toast.error(err.message || 'Failed to export to CSV');
    } finally {
      setExporting(false);
    }
  };

  // Set quick filter
  const handleQuickFilter = (value) => {
    setFilterType(value);
    if (value !== 'custom') {
      setShowCustomRange(false);
    }
  };

  // Handle custom range
  const handleCustomRange = () => {
    if (filterType !== 'custom') {
      setFilterType('custom');
      setShowCustomRange(true);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    generateReport();

    const unsubscribe = realTimeSyncService.subscribe('reports', (data) => {
      if (data?.type === 'new_sale' || data?.type === 'refresh') {
        console.log('🔄 Reports real-time refresh triggered');
        generateReport();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Generate report when filters change
  useEffect(() => {
    generateReport();
  }, [filterType, customStartDate, customEndDate]);

  const { startDate: displayStartDate, endDate: displayEndDate, label: filterLabel } = 
    filterType === 'custom' 
      ? { startDate: customStartDate, endDate: customEndDate, label: `${customStartDate} to ${customEndDate}` }
      : getDateRange(filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            Sales Reports & Data Export
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Advanced filtering, analytics, and data export tools
          </p>
        </div>
      </div>

      {/* Quick Filters */}
      <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <CardContent>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Quick Filters
          </h3>
          <div className="flex flex-wrap gap-2">
            {getFilterOptions().map(option => (
              <button
                key={option.value}
                onClick={() => handleQuickFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all active:scale-95 flex items-center gap-2 ${
                  filterType === option.value
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Date Range */}
      {filterType === 'custom' && (
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-blue-800">
          <CardContent>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Custom Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => handleQuickFilter('today')}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-all"
                >
                  Close Custom Range
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-emerald-800">
        <CardContent>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportExcel}
              disabled={exporting || salesData.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium active:scale-95"
              title="Download as Excel (.xlsx)"
            >
              <Sheet className="w-4 h-4" />
              Export to Excel
            </button>

            <button
              onClick={handleExportCSV}
              disabled={exporting || salesData.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium active:scale-95"
              title="Download as CSV"
            >
              <FileText className="w-4 h-4" />
              Export to CSV
            </button>

            {salesData.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center ml-auto">
                📊 {salesData.length} record{salesData.length !== 1 ? 's' : ''} ready to export
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{summary.totalOrders}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Items Sold</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">{summary.totalItemsSold}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Units</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">₹{summary.totalSales.toLocaleString()}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Income</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Average Order Value</p>
            <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">₹{summary.averageOrderValue.toFixed(0)}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Per sale</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Info */}
      <Card className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Current Filter:</strong> {filterLabel} • 
            <strong className="ml-2">Showing:</strong> {salesData.length} record{salesData.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Sales Details Table */}
      <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <CardContent>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Details</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : salesData.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">No transactions found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Bill ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Date & Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Customer</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">Items</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {salesData.map((sale, idx) => (
                    <tr key={sale._id} className="hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                        {sale._id.toString().slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm">
                        {new Date(sale.date).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                        {sale.customerName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {sale.items?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        ₹{(sale.grandTotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};