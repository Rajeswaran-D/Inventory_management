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

      const sales = res.data?.data || res.data || [];
      // FIX: Use grandTotal instead of total
      const totalRevenue = sales.reduce((sum, sale) => {
        const amount = sale.grandTotal || sale.total || 0;
        return sum + amount;
      }, 0);
      const totalTransactions = sales.length;
      const totalItemsSold = sales.reduce((sum, sale) => {
        const itemCount = sale.items?.reduce((cnt, item) => cnt + (item.quantity || 0), 0) || 0;
        return sum + itemCount;
      }, 0);

      console.log('📊 Daily summary updated:', { totalRevenue, totalTransactions, totalItemsSold });

      setSummary({
        totalRevenue,
        totalTransactions,
        totalItemsSold
      });
    } catch (err) {
      console.error('❌ Error fetching daily summary:', err);
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

  const getColorStyles = (color) => {
    const colors = {
      emerald: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        color: 'var(--primary)'
      },
      blue: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        color: '#3B82F6'
      },
      purple: {
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        color: '#A855F7'
      }
    };
    return colors[color] || colors.emerald;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;

        return (
          <Card key={idx} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {metric.title}
                </span>
                <div 
                  className="p-2 rounded-lg"
                  style={getColorStyles(metric.color)}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {loading ? '...' : metric.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
