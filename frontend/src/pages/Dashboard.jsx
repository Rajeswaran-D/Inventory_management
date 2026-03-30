import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Zap,
  Activity,
  Calendar
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { saleService } from '../services/api';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const Dashboard = () => {
  const [stats, setStats] = useState({ todaySales: { total: 0, count: 0 }, totalStock: { total: 0 }, lowStockAlerts: [] });
  const [topSelling, setTopSelling] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, topRes] = await Promise.all([
          saleService.getDashboardStats(),
          saleService.getTopSelling()
        ]);
        setStats(statsRes.data);
        setTopSelling(topRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales Revenue',
        data: [12000, 19000, 15000, 22000, 30000, 25000, 32000],
        fill: true,
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#4F46E5',
        pointHoverRadius: 8,
      },
    ],
  };

  const pieChartData = {
    labels: topSelling.map(item => item.size) || ['No Data'],
    datasets: [
      {
        data: topSelling.map(item => item.totalQty) || [100],
        backgroundColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
        borderWidth: 0,
        hoverOffset: 15,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        padding: 16,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 14 },
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 12 } } },
      y: { grid: { borderDash: [5, 5], color: '#E2E8F0' }, ticks: { font: { weight: 'bold', size: 12 } } }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] animate-in">
       <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
       <p className="text-surface-400 font-bold uppercase tracking-widest text-sm">Synchronizing Data...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-surface-900 p-8 rounded-4xl border border-surface-200 dark:border-surface-800 shadow-xl shadow-surface-300/5">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                 <Zap className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-surface-900 dark:text-white leading-tight">Executive Control</h1>
           </div>
           <p className="text-surface-500 dark:text-surface-400 font-medium ml-12">Performance overview for Swami Envelope Manufacturing</p>
        </div>
        <div className="flex items-center gap-4 ml-auto">
           <div className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 px-6 py-4 rounded-3xl border border-surface-100 dark:border-surface-700 shadow-inner">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span className="font-black text-sm text-surface-700 dark:text-surface-300">Mar 30, 2026</span>
           </div>
           <Button variant="ghost" icon={Activity}>Refresh Feed</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Daily Revenue" 
          value={`₹${stats.todaySales.total.toLocaleString()}`} 
          icon={TrendingUp} 
          trend="up" 
          trendValue="24.8" 
          color="indigo" 
        />
        <StatCard 
          title="Warehouse Stock" 
          value={stats.totalStock.total.toLocaleString()} 
          icon={Boxes} 
          trend="down" 
          trendValue="3.2" 
          color="amber" 
        />
        <StatCard 
          title="Transactions" 
          value={stats.todaySales.count} 
          icon={ShoppingCart} 
          trend="up" 
          trendValue="18.5" 
          color="emerald" 
        />
        <StatCard 
          title="Alert Threshold" 
          value={stats.lowStockAlerts.length} 
          icon={AlertTriangle} 
          color="rose" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Activity className="w-5 h-5 text-indigo-600" />
               Sales Trajectory
            </CardTitle>
            <Button variant="ghost" size="sm">Download CSV</Button>
          </CardHeader>
          <div className="h-[400px] mt-4">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Package className="w-5 h-5 text-indigo-600" />
               Inventory Core Distribution
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 flex-1 items-center">
             <div className="h-[300px]">
                <Pie data={pieChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
             </div>
             <div className="space-y-4">
                {topSelling.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-3xl border border-surface-100 dark:border-surface-700 transition-all hover:scale-105">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pieChartData.datasets[0].backgroundColor[i % 5] }} />
                        <span className="text-sm font-bold text-surface-700 dark:text-surface-300">{item.size} {item.materialType}</span>
                     </div>
                     <span className="font-black text-indigo-600">{((item.totalQty / topSelling.reduce((s, x) => s + x.totalQty, 0)) * 100).toFixed(1)}%</span>
                  </div>
                ))}
             </div>
          </div>
        </Card>
      </div>
      
      {/* Low Stock Alerts (Modern ERP Table Style) */}
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              Critical Replenishment Required
           </CardTitle>
        </CardHeader>
        <div className="space-y-4">
           {stats.lowStockAlerts.length === 0 ? (
             <div className="py-20 flex flex-col items-center justify-center text-surface-400 bg-surface-50/50 dark:bg-surface-800/20 rounded-4xl border-2 border-dashed border-surface-200 dark:border-surface-800">
                <Boxes className="w-16 h-16 opacity-20 mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">Warehouse Harmony Achieved</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.lowStockAlerts.map((item) => (
                   <div key={item._id} className="p-6 bg-white dark:bg-surface-800/40 rounded-3xl border border-rose-100 dark:border-rose-900/20 hover:shadow-xl hover:shadow-rose-500/5 transition-all group overflow-hidden relative">
                      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-all rotate-12 scale-150">
                         <AlertTriangle className="w-32 h-32 text-rose-500" />
                      </div>
                      <div className="flex justify-between items-start mb-4 relative z-10">
                         <div>
                            <h4 className="font-black text-lg text-surface-900 dark:text-white leading-tight">{item.size} {item.materialType}</h4>
                            <p className="text-surface-400 font-bold text-xs uppercase tracking-widest mt-1">{item.gsm} GSM | {item.color}</p>
                         </div>
                         <div className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full font-black text-xs uppercase animate-pulse">Low</div>
                      </div>
                      <div className="flex items-end justify-between mt-8 relative z-10">
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase font-black text-surface-400 tracking-widest">Active Stock</p>
                            <p className="text-4xl font-black text-rose-600 tracking-tighter">{item.quantity.toLocaleString()}</p>
                         </div>
                         <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50">Restock Now +</Button>
                      </div>
                   </div>
                ))}
             </div>
           )}
        </div>
      </Card>
    </div>
  );
};
