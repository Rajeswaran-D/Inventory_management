import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertTriangle, ShoppingCart, ArrowUp, ArrowDown, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../utils/cn';
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
      const inventoryRes = await inventoryService.getAll({ limit: 1000 });
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

  // Smart number formatter — abbreviated for cards, full on hover
  const formatCurrency = (value) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)} K`;
    return value.toLocaleString('en-IN');
  };

  const formatNumber = (value) => {
    if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)} K`;
    return value.toLocaleString('en-IN');
  };

  const fullCurrency = (value) => `₹${value.toLocaleString('en-IN')}`;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <Card variant="premium" className="flex flex-col justify-between h-full group hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Today's Sales</p>
              <p className="text-3xl font-black text-gray-900 mt-2 truncate">
                {stats.todaySales.toLocaleString()}
              </p>
              {salesTrend !== 0 && (
                <div className="flex items-center gap-1.5 mt-3">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                    salesTrend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {salesTrend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(salesTrend)}%
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">vs yesterday</span>
                </div>
              )}
            </div>
            <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors shrink-0 ml-2">
              <ShoppingCart className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Today's Revenue */}
        <Card variant="premium" className="flex flex-col justify-between h-full group hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Today's Revenue</p>
              <div className="flex items-baseline gap-1 mt-2 overflow-hidden">
                <span className="text-xl font-bold text-gray-900">₹</span>
                <span className="text-3xl font-black text-gray-900 truncate">
                  {stats.todayRevenue.toLocaleString()}
                </span>
              </div>
              {revenueTrend !== 0 && (
                <div className="flex items-center gap-1.5 mt-3">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                    revenueTrend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {revenueTrend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(revenueTrend)}%
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">vs yesterday</span>
                </div>
              )}
            </div>
            <div className="bg-green-50 p-3 rounded-xl group-hover:bg-green-100 transition-colors shrink-0 ml-2">
              <TrendingUp className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Total Stock Value */}
        <Card variant="premium" className="flex flex-col justify-between h-full group hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Stock Value</p>
              <div
                title={`Total Stock Value: ${fullCurrency(stats.totalStockValue)}`}
                className="flex items-baseline gap-1 mt-2 overflow-hidden cursor-help"
              >
                <span className="text-xl font-bold text-gray-900">₹</span>
                <span className="text-3xl font-black text-gray-900">
                  {formatCurrency(stats.totalStockValue)}
                </span>
              </div>
              <p
                title={`Total units in stock: ${stats.totalStock.toLocaleString('en-IN')} units`}
                className="text-xs font-bold text-gray-400 mt-3 bg-gray-50 inline-block px-2 py-1 rounded-lg cursor-help"
              >
                {formatNumber(stats.totalStock)} units
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl group-hover:bg-purple-100 transition-colors shrink-0 ml-2">
              <Package className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card 
          variant={stats.lowStockCount > 0 ? "danger" : "premium"}
          className="flex flex-col justify-between h-full group hover:-translate-y-1 cursor-pointer"
          onClick={() => setShowLowStockModal(true)}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <p className={cn(
                "text-xs font-bold uppercase tracking-widest",
                stats.lowStockCount > 0 ? "text-red-600" : "text-gray-500"
              )}>
                Low Stock
              </p>
              <p className={cn(
                "text-4xl font-black mt-2 truncate",
                stats.lowStockCount > 0 ? "text-red-900" : "text-gray-900"
              )}>
                {stats.lowStockCount}
              </p>
              <p className={cn(
                "text-[10px] font-bold mt-3 inline-block px-2 py-1 rounded-lg uppercase tracking-wide",
                stats.lowStockCount > 0 ? "bg-red-100 text-red-700" : "bg-gray-50 text-gray-400"
              )}>
                of {stats.totalProducts} items
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl shrink-0 ml-2 transition-colors",
              stats.lowStockCount > 0 ? "bg-red-100 group-hover:bg-red-200" : "bg-gray-50 group-hover:bg-gray-100"
            )}>
              <AlertTriangle className={cn(
                "w-7 h-7",
                stats.lowStockCount > 0 ? "text-red-600" : "text-gray-400"
              )} />
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
