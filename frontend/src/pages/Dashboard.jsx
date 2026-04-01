import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertTriangle, ShoppingCart, ArrowUp, ArrowDown, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { saleService, envelopeService } from '../services/api';
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
      
      const reportsRes = await saleService.getReports();
      console.log('✅ Reports received:', reportsRes.data);
      
      const data = reportsRes.data?.data || {};
      
      setStats({
        // Today
        todaySales: data.today?.salesCount || 0,
        todayRevenue: data.today?.revenue || 0,
        
        // Previous (yesterday)
        previousSales: data.previous?.salesCount || 0,
        previousRevenue: data.previous?.revenue || 0,
        
        // Weekly
        weeklySales: data.weekly?.salesCount || 0,
        weeklyRevenue: data.weekly?.revenue || 0,
        
        // Monthly
        monthlySales: data.monthly?.salesCount || 0,
        monthlyRevenue: data.monthly?.revenue || 0,
        
        // Yearly
        yearlySales: data.yearly?.salesCount || 0,
        yearlyRevenue: data.yearly?.revenue || 0,
        
        // Inventory
        totalProducts: data.inventory?.totalProducts || 0,
        totalStock: data.inventory?.totalStock || 0,
        totalStockValue: data.inventory?.totalStockValue || 0,
        lowStockCount: data.inventory?.lowStockCount || 0
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
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: 'var(--primary)' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time business analytics and insights</p>
          <p className="text-xs text-gray-500 mt-2">Last updated: {refreshTime}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 text-white rounded-lg active:scale-95 transition-all font-medium bg-blue-600 hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.todaySales}</p>
              {salesTrend !== 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {salesTrend > 0 ? (
                    <>
                      <ArrowUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">{salesTrend}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">{Math.abs(salesTrend)}%</span>
                    </>
                  )}
                  <span className="text-xs text-gray-500">vs yesterday</span>
                </div>
              )}
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </Card>

        {/* Today's Revenue */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₹{stats.todayRevenue.toLocaleString()}</p>
              {revenueTrend !== 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {revenueTrend > 0 ? (
                    <>
                      <ArrowUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">{revenueTrend}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">{Math.abs(revenueTrend)}%</span>
                    </>
                  )}
                  <span className="text-xs text-gray-500">vs yesterday</span>
                </div>
              )}
            </div>
            <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </Card>

        {/* Total Stock Value */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Stock Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₹{stats.totalStockValue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.totalStock} units in stock</p>
            </div>
            <Package className="w-8 h-8 text-purple-500 opacity-20" />
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card 
          className={stats.lowStockCount > 0 ? 'border-red-200 bg-red-50' : ''}
          onClick={() => setShowLowStockModal(true)}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${stats.lowStockCount > 0 ? 'text-red-700' : 'text-gray-600'}`}>
                Low Stock Items
              </p>
              <p className={`text-2xl font-bold mt-2 ${stats.lowStockCount > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                {stats.lowStockCount}
              </p>
              <p className="text-xs text-gray-500 mt-2">Out of {stats.totalProducts} products</p>
            </div>
            <AlertTriangle className={`w-8 h-8 opacity-20 ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-gray-500'}`} />
          </div>
        </Card>
      </div>

      {/* Period Comparison Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weekly */}
        <Card>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <p className="text-gray-600 text-sm font-medium">Weekly Performance</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Sales Count</p>
                <p className="text-xl font-bold text-gray-900">{stats.weeklySales}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-gray-900">₹{stats.weeklyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Monthly */}
        <Card>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-purple-500" />
              <p className="text-gray-600 text-sm font-medium">Monthly Performance</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Sales Count</p>
                <p className="text-xl font-bold text-gray-900">{stats.monthlySales}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-gray-900">₹{stats.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Yearly */}
        <Card>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <p className="text-gray-600 text-sm font-medium">Yearly Performance</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Sales Count</p>
                <p className="text-xl font-bold text-gray-900">{stats.yearlySales}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-gray-900">₹{stats.yearlyRevenue.toLocaleString()}</p>
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
