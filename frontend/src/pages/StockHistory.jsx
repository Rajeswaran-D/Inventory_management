import React, { useState, useEffect } from 'react';
import { 
  History, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search, 
  Filter,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { stockService } from '../services/api';

export const StockHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '' });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await stockService.getHistory(filters);
      setHistory(res.data);
    } catch (err) {
      toast.error('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  return (
    <div className="space-y-6 animate-in">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
           <History className="w-8 h-8 text-primary-600" />
           <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">Stock Timeline</h1>
        </div>
        <p className="text-surface-500 dark:text-surface-400">Track every movement of your inventory over time.</p>
      </header>

      <div className="flex flex-wrap gap-4 p-6 bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm">
         <div className="flex-1 min-w-[200px]">
           <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-2 px-1">Movement Type</label>
           <select 
             className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl px-4 py-3 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 shadow-inner transition-all"
             value={filters.type}
             onChange={e => setFilters({...filters, type: e.target.value})}
           >
             <option value="">All Movements</option>
             <option value="IN">Stock IN (Added)</option>
             <option value="OUT">Stock OUT (Removed / Sold)</option>
           </select>
         </div>
         <div className="flex-1 min-w-[200px]">
           <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-2 px-1">From Date</label>
           <input 
             type="date" 
             className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl px-4 py-3 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 shadow-inner transition-all"
             value={filters.startDate}
             onChange={e => setFilters({...filters, startDate: e.target.value})}
           />
         </div>
         <div className="flex-1 min-w-[200px]">
           <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-2 px-1">To Date</label>
           <input 
             type="date" 
             className="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl px-4 py-3 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 shadow-inner transition-all"
             value={filters.endDate}
             onChange={e => setFilters({...filters, endDate: e.target.value})}
           />
         </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-4xl border border-surface-200 dark:border-surface-800 shadow-xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center p-20 text-surface-400">Loading history...</div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {history.length === 0 ? (
               <div className="p-20 text-center text-surface-400">No records found for the selected period.</div>
            ) : (
              history.map((record) => (
                <div key={record._id} className="flex items-center justify-between p-8 hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${record.type === 'IN' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                      {record.type === 'IN' ? <ArrowUpCircle className="w-8 h-8" /> : <ArrowDownCircle className="w-8 h-8" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-surface-900 dark:text-white">{record.envelopeId?.size || 'Unknown Product'} {record.envelopeId?.materialType}</h4>
                      <p className="flex items-center gap-2 text-surface-500 font-medium">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(record.date), 'MMM dd, yyyy · hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${record.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {record.type === 'IN' ? '+' : '-'}{record.quantity.toLocaleString()}
                    </p>
                    <p className="text-xs uppercase font-bold tracking-widest text-surface-400 mt-1">Transaction Success</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
