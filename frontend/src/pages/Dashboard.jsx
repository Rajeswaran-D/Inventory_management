import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertTriangle, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { saleService, envelopeService } from '../services/api';
import { Card, CardTitle, CardContent } from '../components/ui/Card';
import { DailySummary } from '../components/ui/DailySummary';
import { LowStockModal } from '../components/ui/LowStockModal';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStock: 0,
    todaySales: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    previousRevenue: 0,
    previousSales: 0
  });
  const [loading, setLoading] = useState(true);
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Fetch today's sales
      const todayRes = await saleService.getAll({
        startDate: todayStr,
        endDate: todayStr
      });
      
      // Fetch yesterday's sales for comparison
      const yesterdayRes = await saleService.getAll({
        startDate: yesterdayStr,
        endDate: yesterdayStr
      });

      const envelopesRes = await envelopeService.getAll({});
      
      const todaySales = todayRes.data || [];
      const yesterdaySales = yesterdayRes.data || [];
      
      const lowStock = envelopesRes.data ? envelopesRes.data.filter(e => e.quantity < 50).length : 0;
      const totalStock = envelopesRes.data ? envelopesRes.data.reduce((sum, e) => sum + (e.quantity || 0), 0) : 0;

      const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);

      setStats({
        totalStock,
        todaySales: todaySales.length,
        totalRevenue: todayRevenue,
        lowStockCount: lowStock,
        previousRevenue: yesterdayRevenue,
        previousSales: yesterdaySales.length
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate trend percentages
  const revenueTrend = stats.previousRevenue > 0 
    ? (((stats.totalRevenue - stats.previousRevenue) / stats.previousRevenue) * 100).toFixed(1)
    : 0;

  const salesTrend = stats.previousSales > 0 
    ? (((stats.todaySales - stats.previousSales) / stats.previousSales) * 100).toFixed(1)
    : 0;

  const metrics = [
    {
      title: 'Today\'s Sales',
      value: stats.todaySales,
      icon: ShoppingCart,
      color: 'blue',
      trend: salesTrend > 0 ? 'up' : salesTrend < 0 ? 'down' : null,
      trendValue: Math.abs(salesTrend)
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'green',
      trend: revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : null,
      trendValue: Math.abs(revenueTrend)
    },
    {
      title: 'Total Stock',
      value: stats.totalStock.toLocaleString(),
      icon: Package,
      color: 'purple',
      trend: null
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: 'red',
      interactive: true,
      onClick: () => setShowLowStockModal(true)
    }
  ];

  return (
    <div className="space-y-8">
      <LowStockModal isOpen={showLowStockModal} onClose={() => setShowLowStockModal(false)} />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Daily Summary Section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Today's Performance</h2>
        <DailySummary refreshTrigger={loading} />
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const colorClasses = {
              blue: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
              green: 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400',
              purple: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
              red: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
            };

            return (
              <Card 
                key={metric.title} 
                className={`bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-200 ${metric.interactive ? 'cursor-pointer' : ''}`}
                onClick={metric.onClick}
              >
                <CardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colorClasses[metric.color]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {metric.trend && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        metric.trend === 'up' 
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                      }`}>
                        {metric.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {metric.trendValue}%
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {metric.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white break-words">
                    {metric.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Actions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Access frequently used features
            </p>
            <div className="space-y-2">
              <a href="/billing" className="block px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors">
                ➕ Create New Sale
              </a>
              <a href="/inventory" className="block px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors">
                📦 View Inventory
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Stock Status</h3>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.lowStockCount}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Products below 50 units</p>
              </div>
              <button
                onClick={() => setShowLowStockModal(true)}
                className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium transition-colors"
              >
                View Details
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:shadow-lg transition-shadow">
          <CardContent>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Reports</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Generate and analyze sales reports
            </p>
            <a href="/reports" className="block px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-center transition-colors">
              📊 View Reports
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
