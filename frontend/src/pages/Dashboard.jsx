import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertTriangle, ShoppingCart, ArrowUp, ArrowDown, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { saleService, envelopeService, inventoryService } from '../services/api';
import { Card, CardTitle, CardContent } from '../components/ui/Card';
import { DailySummary } from '../components/ui/DailySummary';
import { LowStockModal } from '../components/ui/LowStockModal';
import { realTimeSyncService } from '../services/realTimeSync';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    // Today metrics
    todaySales: 0,
    todayRevenue: 0,
    
    // Comparison (yesterday)
    previousSales: 0,
    previousRevenue: 0,
    
    // Weekly/Monthly/Yearly
    weeklySales: 0,
    weeklyRevenue: 0,
    monthlySales: 0,
    monthlyRevenue: 0,
    yearlySales: 0,
    yearlyRevenue: 0,
    
    // Inventory
    totalProducts: 0,
    totalStock: 0,
    totalStockValue: 0,
    lowStockCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    
    // Subscribe to real-time updates
    const unsubscribe = realTimeSyncService.subscribe('dashboard', (data) => {
      if (data?.type === 'refresh') {
        console.log('🔄 Dashboard real-time refresh triggered');
        setRefreshTrigger(prev => prev + 1);
        fetchDashboardData();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('📊 Fetching comprehensive dashboard data...');
      
      // Fetch CURRENT inventory data from inventory collection
      const inventoryRes = await inventoryService.getAll({});
      const inventoryData = Array.isArray(inventoryRes.data) ? inventoryRes.data : inventoryRes.data?.data || [];
      console.log('✅ Current inventory fetched:', inventoryData.length, 'items');
      
      // Calculate current inventory statistics from ACTUAL inventory data
      const totalProducts = inventoryData.length;
      const totalStock = inventoryData.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalStockValue = inventoryData.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
      const lowStockCount = inventoryData.filter(item => (item.quantity || 0) < (item.minimumStockLevel || 50)).length;
      
      // Fetch sales reports for revenue data
      const reportsRes = await saleService.getReports();
      const data = reportsRes.data?.data || {};
      
      setStats({
        // Sales metrics from reports
        todaySales: data.today?.salesCount || 0,
        todayRevenue: data.today?.revenue || 0,
        previousSales: data.previous?.salesCount || 0,
        previousRevenue: data.previous?.revenue || 0,
        weeklySales: data.weekly?.salesCount || 0,
        weeklyRevenue: data.weekly?.revenue || 0,
        monthlySales: data.monthly?.salesCount || 0,
        monthlyRevenue: data.monthly?.revenue || 0,
        yearlySales: data.yearly?.salesCount || 0,
        yearlyRevenue: data.yearly?.revenue || 0,
        
        // Current inventory data from actual inventory collection
        totalProducts,
        totalStock,
        totalStockValue,
        lowStockCount
      });
      
      console.log('📈 Dashboard stats updated');
      setLastRefresh(new Date());
      
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate trend percentages
  const revenueTrend = stats.previousRevenue > 0 
    ? (((stats.todayRevenue - stats.previousRevenue) / stats.previousRevenue) * 100).toFixed(1)
    : 0;

  const salesTrend = stats.previousSales > 0 
    ? (((stats.todaySales - stats.previousSales) / stats.previousSales) * 100).toFixed(1)
    : 0;

  const refreshTime = lastRefresh.toLocaleTimeString();

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">📊 Dashboard</h1>
          <p className="text-gray-600 mt-2 font-medium">Real-time business analytics and insights</p>
          <p className="text-xs font-medium text-gray-400 mt-2">⏰ Last updated: {refreshTime}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg active:scale-95 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Sales */}
        <Card variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">Today's Sales</p>
              <p className="text-3xl font-bold text-gray-900 mt-3">{stats.todaySales}</p>
              {salesTrend !== 0 && (
                <div className="flex items-center gap-1 mt-3">
                  {salesTrend > 0 ? (
                    <>
                      <ArrowUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-bold">{salesTrend}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600 font-bold">{Math.abs(salesTrend)}%</span>
                    </>
                  )}
                  <span className="text-xs text-gray-500">vs yesterday</span>
                </div>
              )}
            </div>
            <div className="bg-blue-100 p-4 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Today's Revenue */}
        <Card variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">Today's Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-3">₹{stats.todayRevenue.toLocaleString()}</p>
              {revenueTrend !== 0 && (
                <div className="flex items-center gap-1 mt-3">
                  {revenueTrend > 0 ? (
                    <>
                      <ArrowUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-bold">{revenueTrend}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600 font-bold">{Math.abs(revenueTrend)}%</span>
                    </>
                  )}
                  <span className="text-xs text-gray-500">vs yesterday</span>
                </div>
              )}
            </div>
            <div className="bg-green-100 p-4 rounded-xl">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Total Stock Value */}
        <Card variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">Stock Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-3">₹{stats.totalStockValue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-3 font-medium">{stats.totalStock} units</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-xl">
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card 
          variant={stats.lowStockCount > 0 ? "danger" : "elevated"}
          className={stats.lowStockCount > 0 ? 'cursor-pointer hover:shadow-lg' : 'cursor-pointer hover:shadow-lg'}
          onClick={() => setShowLowStockModal(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-wider ${stats.lowStockCount > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                Low Stock
              </p>
              <p className={`text-3xl font-bold mt-3 ${stats.lowStockCount > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                {stats.lowStockCount}
              </p>
              <p className={`text-xs font-medium mt-3 ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                of {stats.totalProducts} products
              </p>
            </div>
            <div className={`p-4 rounded-xl ${stats.lowStockCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-8 h-8 ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-gray-500'}`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Period Comparison Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weekly */}
        <Card variant="default">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2.5 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-gray-900 font-bold">Weekly Performance</p>
            </div>
            <div className="space-y-4 pl-11.5">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Sales Count</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.weeklySales}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.weeklyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Monthly */}
        <Card variant="default">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-2.5 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-gray-900 font-bold">Monthly Performance</p>
            </div>
            <div className="space-y-4 pl-11.5">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Sales Count</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.monthlySales}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Yearly */}
        <Card variant="default">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2.5 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-gray-900 font-bold">Yearly Performance</p>
            </div>
            <div className="space-y-4 pl-11.5">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Sales Count</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.yearlySales}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.yearlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Summary for charts */}
      <DailySummary refreshTrigger={refreshTrigger} />

      {/* Low Stock Modal */}
      <LowStockModal 
        isOpen={showLowStockModal} 
        onClose={() => setShowLowStockModal(false)} 
      />
    </div>
  );
};

export default Dashboard;
