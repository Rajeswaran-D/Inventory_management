import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './Card';
import { envelopeService } from '../../services/api';

export const LowStockModal = ({ isOpen, onClose, onRefresh }) => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLowStockItems = async () => {
    setLoading(true);
    try {
      const res = await envelopeService.getAll({});
      const items = (res.data || []).filter(item => item.quantity < 50).sort((a, b) => a.quantity - b.quantity);
      setLowStockItems(items);
    } catch (err) {
      console.error('Error fetching low stock items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLowStockItems();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-white dark:bg-gray-900">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Low Stock Items
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lowStockItems.length} product{lowStockItems.length !== 1 ? 's' : ''} below 50 units
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                  </div>
                ) : lowStockItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">
                      ✓ All products are well stocked
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div
                        key={item._id}
                        className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {item.size}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {item.materialType} • GSM {item.gsm}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              Price: ₹{item.price}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="inline-block px-3 py-1 bg-red-600 text-white rounded-full">
                              <p className="text-sm font-bold">{item.quantity} units</p>
                            </div>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                              Action Required
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3">
                <button
                  onClick={fetchLowStockItems}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-900 dark:bg-gray-800 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
