import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { saleService } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalSales: 0,
    itemsSold: 0,
    revenue: 0,
    avgTransaction: 0
  });

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await saleService.getAll({
        startDate,
        endDate,
        type: reportType
      });

      const sales = res.data || [];
      setSalesData(sales);

      // Calculate summary
      const totalSales = sales.length;
      const itemsSold = sales.reduce((sum, sale) => sum + (sale.items?.length || 0), 0);
      const revenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const avgTransaction = totalSales > 0 ? revenue / totalSales : 0;

      setSummary({
        totalSales,
        itemsSold,
        revenue,
        avgTransaction
      });
    } catch (err) {
      console.error('Report error:', err);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const setQuickFilter = (filterType) => {
    const today = new Date();
    let startDate, endDate;

    endDate = today.toISOString().split('T')[0];

    switch (filterType) {
      case 'today':
        startDate = endDate;
        break;
      case 'week':
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthStart.toISOString().split('T')[0];
        break;
      case 'year':
        const yearStart = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        startDate = yearStart.toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setStartDate(startDate);
    setEndDate(endDate);
  };

  useEffect(() => {
    setQuickFilter('today');
  }, []);

  useEffect(() => {
    generateReport();
  }, [startDate, endDate, reportType]);

  const downloadReport = () => {
    const reportContent = `
Swamy Envelope Inventory System - ${reportType.toUpperCase()} Report
Generated: ${new Date().toLocaleString()}
Period: ${startDate} to ${endDate}

SUMMARY
=======
Total Sales: ${summary.totalSales}
Items Sold: ${summary.itemsSold}
Total Revenue: ₹${summary.revenue.toLocaleString()}
Average Transaction: ₹${summary.avgTransaction.toFixed(2)}

DETAILS
=======
${salesData.map(sale => `
Sale ID: ${sale._id}
Date: ${new Date(sale.createdAt).toLocaleString()}
Customer: ${sale.customerId?.name || 'N/A'}
Items: ${sale.items?.length || 0}
Total: ₹${sale.total || 0}
`).join('\n')}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `report-${reportType}-${startDate}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Sales Reports
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Analytics and sales performance tracking</p>
        </div>
      </div>

      {/* Quick Filters */}
      <Card>
        <CardContent>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Quick Filters
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Today', value: 'today' },
              { label: 'Last 7 Days', value: 'week' },
              { label: 'Last 30 Days', value: 'month' },
              { label: 'Last Year', value: 'year' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setQuickFilter(filter.value)}
                className="px-4 py-2 rounded-lg font-medium transition-all active:scale-95"
                style={{
                  backgroundColor: reportType === 'daily' && filter.value === 'today' ? '#3b82f6' : 
                                   reportType === 'weekly' && filter.value === 'week' ? '#3b82f6' :
                                   reportType === 'monthly' && filter.value === 'month' ? '#3b82f6' :
                                   reportType === 'yearly' && filter.value === 'year' ? '#3b82f6' : 
                                   'rgba(0,0,0,0.05)',
                  color: reportType === 'daily' && filter.value === 'today' ? 'white' : 
                         reportType === 'weekly' && filter.value === 'week' ? 'white' :
                         reportType === 'monthly' && filter.value === 'month' ? 'white' :
                         reportType === 'yearly' && filter.value === 'year' ? 'white' :
                         'currentColor'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Filters */}
      <Card>
        <CardContent>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Custom Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => downloadReport()}
                disabled={salesData.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                title="Download Report as Text"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Transactions</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.totalSales}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Sales records</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Items Sold</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.itemsSold}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Units</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">₹{summary.revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Income</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Average Transaction</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">₹{summary.avgTransaction.toFixed(0)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Per sale</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Details */}
      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Details</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : salesData.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">No transactions found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Date & Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Customer</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">Items</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {salesData.map(sale => (
                    <tr key={sale._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {new Date(sale.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                        {sale.customerId?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          {sale.items?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        ₹{(sale.total || 0).toLocaleString()}
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