import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { Card, CardContent } from './Card';
import { saleService } from '../../services/api';

export const DailySummary = ({ refreshTrigger }) => {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalItemsSold: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await saleService.getAll({
        startDate: today,
        endDate: today
      });

      const sales = res.data || [];
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalTransactions = sales.length;
      const totalItemsSold = sales.reduce((sum, sale) => sum + (sale.items?.length || 0), 0);

      setSummary({
        totalRevenue,
        totalTransactions,
        totalItemsSold
      });
    } catch (err) {
      console.error('Error fetching daily summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySummary();
  }, [refreshTrigger]);

  const metrics = [
    {
      title: "Today's Revenue",
      value: `₹${summary.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: 'Transactions',
      value: summary.totalTransactions,
      icon: ShoppingBag,
      color: 'blue'
    },
    {
      title: 'Items Sold',
      value: summary.totalItemsSold,
      icon: TrendingUp,
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        const colorClass = {
          emerald: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
          blue: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
          purple: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
        };

        return (
          <Card key={idx} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.title}
                </span>
                <div className={`p-2 rounded-lg ${colorClass[metric.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : metric.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
