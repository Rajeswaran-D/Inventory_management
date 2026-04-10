import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, FileSpreadsheet, FileText, TrendingUp, ShoppingCart, Package, IndianRupee } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { reportService } from '../services/api';
import { getDateRange, getFilterOptions, formatDate } from '../utils/dateFiltering';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const FILTER_LABELS = {
  today: 'Today',
  week: 'Last 7 Days',
  month: 'This Month',
  year: 'This Year',
  all: 'All Time',
  custom: 'Custom Range',
};

export const Reports = () => {
  const [filterType, setFilterType] = useState('month');
  const [customStartDate, setCustomStartDate] = useState(
    formatDate(new Date(new Date().setDate(new Date().getDate() - 30)))
  );
  const [customEndDate, setCustomEndDate] = useState(formatDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');

  const [reportData, setReportData] = useState({
    revenueByDate: [],
    salesCount: [],
    topProducts: [],
    lowStockCount: 0,
    lowStockAnalytics: [],
    productStats: [],
    summary: { totalSales: 0, totalRevenue: 0, totalItems: 0, averageOrderValue: 0 },
  });

  const fetchReport = async () => {
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

      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      const res = await reportService.getAnalytics(params);
      if (res.data?.success) setReportData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [filterType, customStartDate, customEndDate]);

  const getParams = () => {
    let startDate = null, endDate = null;
    if (filterType === 'custom') {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      const range = getDateRange(filterType);
      startDate = range.startDate;
      endDate = range.endDate;
    }
    const params = {};
    if (startDate && endDate) {
      params.startDate = startDate.toISOString();
      params.endDate = endDate.toISOString();
    }
    return params;
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await reportService.downloadReport(getParams());
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${filterType}_${formatDate(new Date())}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel downloaded successfully');
    } catch { toast.error('Excel download failed'); }
  };

  const handleDownloadCSV = () => {
    if (!reportData.productStats?.length) { toast.error('No data to export'); return; }
    const headers = ['Product Name', 'Units Sold', 'Total Revenue (₹)'];
    const rows = reportData.productStats.map(s => [`"${s.name}"`, s.quantity, s.revenue]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_report_${filterType}_${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('CSV downloaded successfully');
  };

  const periodLabel = FILTER_LABELS[filterType] || 'Selected Period';
  const summary = reportData.summary;
  const totalRevenue = summary.totalRevenue || 0;

  const SUMMARY_CARDS = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Sales', value: summary.totalSales, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Items Sold', value: `${summary.totalItems} units`, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Avg Order Value', value: `₹${Math.round(summary.averageOrderValue).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6 pb-12 px-4 md:px-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Period: {periodLabel}</p>
        </div>
      </div>

      {/* ── Period Filter Bar ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filter Period</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {getFilterOptions().map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filterType === opt.value
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {filterType === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map(card => (
          <div key={card.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-start gap-3">
            <div className={`${card.bg} ${card.color} p-2.5 rounded-xl`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-gray-900">{loading ? '—' : card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          <p className="text-gray-400 text-sm">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* ── Tab Navigation ── */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[['analytics', 'Analytics Overview'], ['report', 'Sales Report']].map(([val, label]) => (
              <button key={val} onClick={() => setActiveTab(val)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === val
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>{label}
              </button>
            ))}
          </div>

          {/* ════════════════════ ANALYTICS TAB ════════════════════ */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
                <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
                Analytics Overview
              </h2>

              {/* Revenue Trend – full width */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <p className="text-sm font-bold text-gray-700 mb-5">Revenue Trend</p>
                {reportData.revenueByDate.length === 0 ? (
                  <EmptyState message="No revenue data for selected period" />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.revenueByDate}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                        <Tooltip
                          contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                          formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3}
                          dot={{ r: 4, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* 2-col: Sales Count + Top Products */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <p className="text-sm font-bold text-gray-700 mb-5">Sales Count per Day</p>
                  {reportData.salesCount.length === 0 ? (
                    <EmptyState message="No sales data for selected period" />
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.salesCount}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                            formatter={v => [v, 'Sales']}
                          />
                          <Bar dataKey="count" fill="#10B981" radius={[5, 5, 0, 0]} barSize={22} name="Sales" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <p className="text-sm font-bold text-gray-700 mb-5">Top Products by Units Sold</p>
                  {reportData.topProducts.length === 0 ? (
                    <EmptyState message="No product data for selected period" />
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.topProducts.slice(0, 7)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 11 }} width={100} />
                          <Tooltip
                            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                            formatter={v => [v, 'Units Sold']}
                          />
                          <Bar dataKey="quantity" fill="#F59E0B" radius={[0, 5, 5, 0]} barSize={18} name="Units Sold" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ SALES REPORT TAB ════════════════════ */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              {/* Header row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald-500 rounded-full inline-block" />
                  Sales Report &mdash; {periodLabel}
                </h2>
                <div className="flex gap-2 items-center">
                  <button onClick={handleDownloadCSV}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm">
                    <FileText className="w-4 h-4 text-orange-500" /> Download CSV
                  </button>
                  <button onClick={handleDownloadExcel}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-md">
                    <FileSpreadsheet className="w-4 h-4" /> Export to Excel
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {reportData.productStats.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 text-sm">
                    No sales data for selected period.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Product Name</th>
                          <th className="px-6 py-4 font-semibold text-center">Units Sold</th>
                          <th className="px-6 py-4 font-semibold text-right">Total Revenue (₹)</th>
                          <th className="px-6 py-4 font-semibold text-right">Sales Contribution (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {reportData.productStats.map((stat, i) => {
                          const pct = totalRevenue > 0
                            ? ((stat.revenue / totalRevenue) * 100).toFixed(1)
                            : 0;
                          return (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-semibold text-gray-900">{stat.name}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                                  {stat.quantity.toLocaleString()} units
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-gray-800">
                                ₹{stat.revenue.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs font-semibold text-gray-600">{pct}%</span>
                                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="border-t-2 border-indigo-100 bg-indigo-50">
                        <tr>
                          <td className="px-6 py-4 font-bold text-indigo-700">Total Summary</td>
                          <td className="px-6 py-4 text-center font-bold text-gray-900">
                            {summary.totalItems.toLocaleString()} units
                          </td>
                          <td className="px-6 py-4 text-right font-black text-indigo-700 text-base">
                            ₹{totalRevenue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-indigo-500">100%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
    {message}
  </div>
);