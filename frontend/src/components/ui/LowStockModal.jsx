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
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div 
                className="flex items-center justify-between p-6 border-b"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg-card)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: '#DC2626' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      Low Stock Items
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {lowStockItems.length} product{lowStockItems.length !== 1 ? 's' : ''} below 50 units
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--border)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }} />
                  </div>
                ) : lowStockItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p style={{ color: 'var(--text-secondary)' }}>
                      ✓ All products are well stocked
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div
                        key={item._id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                        style={{
                          backgroundColor: 'rgba(220, 38, 38, 0.05)',
                          borderColor: '#DC2626'
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {item.size}
                            </h4>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {item.materialType} • GSM {item.gsm}
                            </p>
                            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                              Price: ₹{item.price}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="inline-block px-3 py-1 text-white rounded-full" style={{ backgroundColor: '#DC2626' }}>
                              <p className="text-sm font-bold">{item.quantity} units</p>
                            </div>
                            <p className="text-xs mt-2 font-medium" style={{ color: '#DC2626' }}>
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
              <div 
                className="border-t p-6 flex gap-3"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg-main)'
                }}
              >
                <button
                  onClick={fetchLowStockItems}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--border)';
                    e.target.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'var(--text-secondary)';
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-white"
                  style={{
                    backgroundColor: 'var(--primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--primary-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--primary)';
                  }}
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
