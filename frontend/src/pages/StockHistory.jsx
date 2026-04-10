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
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen animate-in">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
           <History className="w-8 h-8 text-green-600" />
           <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">Stock Timeline</h1>
        </div>
        <p className="text-gray-600 font-medium">Track every movement of your inventory over time.</p>
      </div>

      <div className="flex flex-wrap gap-4 p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
         <div className="flex-1 min-w-[200px]">
           <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Movement Type</label>
           <select 
             className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
             value={filters.type}
             onChange={e => setFilters({...filters, type: e.target.value})}
           >
             <option value="">All Movements</option>
             <option value="IN">Stock IN (Added)</option>
             <option value="OUT">Stock OUT (Removed / Sold)</option>
           </select>
         </div>
         <div className="flex-1 min-w-[200px]">
           <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">From Date</label>
           <input 
             type="date" 
             className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
             value={filters.startDate}
             onChange={e => setFilters({...filters, startDate: e.target.value})}
           />
         </div>
         <div className="flex-1 min-w-[200px]">
           <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">To Date</label>
           <input 
             type="date" 
             className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
             value={filters.endDate}
             onChange={e => setFilters({...filters, endDate: e.target.value})}
           />
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center p-20 text-gray-400">Loading history...</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {history.length === 0 ? (
               <div className="p-20 text-center text-gray-600 dark:text-gray-400">No records found for the selected period.</div>
            ) : (
              history.map((record) => (
                <div key={record._id} className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${record.type === 'IN' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {record.type === 'IN' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-900 dark:text-white">{record.envelopeId?.size || 'Unknown Product'} {record.envelopeId?.materialType}</h4>
                      <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium text-sm">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(record.date), 'MMM dd, yyyy · hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${record.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {record.type === 'IN' ? '+' : '-'}{record.quantity.toLocaleString()}
                    </p>
                    <p className="text-xs uppercase font-semibold tracking-wide text-gray-500 dark:text-gray-400 mt-1">Transaction Success</p>
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
