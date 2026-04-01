/**
 * SmartStockUpdateModal Component
 * 
 * Professional stock update interface with:
 * - Add/Reduce quantity options
 * - Quick update buttons (+5, +10, -5)
 * - Smart validation
 * - Success/error notifications
 */

import React, { useState } from 'react';
import { X, Plus, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { inventoryService } from '../../services/api';

export const SmartStockUpdateModal = ({ 
  isOpen, 
  onClose, 
  inventoryItem, 
  onStockUpdated 
}) => {
  const [action, setAction] = useState('add'); // 'add' or 'reduce'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !inventoryItem) return null;

  const variant = inventoryItem.variant || inventoryItem.variantId;
  const currentStock = inventoryItem.quantity || 0;
  const displayName = variant?.displayName || 'Product';

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(value)) {
      setQuantity(value);
      setError('');
    }
  };

  const handleQuickAdd = (value) => {
    setAction('add');
    setQuantity(String(value));
    setError('');
  };

  const handleQuickReduce = (value) => {
    if (currentStock >= value) {
      setAction('reduce');
      setQuantity(String(value));
      setError('');
    } else {
      setError(`Cannot reduce by ${value}. Available stock: ${currentStock}`);
    }
  };

  const validateAndSubmit = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!quantity || isNaN(quantity) || parseInt(quantity) < 1) {
      setError('Please enter a quantity (≥1)');
      return;
    }

    const qty = parseInt(quantity);

    if (action === 'reduce' && currentStock < qty) {
      setError(`Not enough stock. Available: ${currentStock}, Requested: ${qty}`);
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (action === 'add') {
        response = await inventoryService.addStock(
          inventoryItem._id,
          qty,
          reason || 'Manual stock addition'
        );
        setSuccess(`✅ Added ${qty} units`);
        toast.success(`✅ Stock added: +${qty} units`);
      } else {
        response = await inventoryService.reduceStock(
          inventoryItem._id,
          qty,
          reason || 'Manual stock reduction'
        );
        setSuccess(`✅ Reduced ${qty} units`);
        toast.success(`✅ Stock reduced: -${qty} units`);
      }

      console.log('📊 Stock updated:', response.data);

      // Close after 1s
      setTimeout(() => {
        setQuantity('');
        setReason('');
        setSuccess('');
        onClose();
        onStockUpdated?.();
      }, 1000);
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to update stock';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('❌ Error updating stock:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b dark:border-gray-700 bg-gradient-to-r ${
          action === 'add' 
            ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
            : 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20'
        }`}>
          <div className="flex items-center gap-3">
            {action === 'add' ? (
              <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <Minus className="w-6 h-6 text-red-600 dark:text-red-400" />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {action === 'add' ? 'Add Stock' : 'Reduce Stock'}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{displayName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Current Stock Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Stock</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{currentStock}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAction('add')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                action === 'add'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
              }`}
            >
              <Plus className="w-5 h-5" />
              Add Stock
            </button>
            <button
              type="button"
              onClick={() => setAction('reduce')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                action === 'reduce'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
              }`}
            >
              <Minus className="w-5 h-5" />
              Reduce Stock
            </button>
          </div>

          {/* Quick Buttons */}
          {action === 'add' && (
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">Quick Add</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAdd(5)}
                  className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors text-sm dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-300"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(10)}
                  className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors text-sm dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-300"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(25)}
                  className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors text-sm dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-300"
                >
                  +25
                </button>
              </div>
            </div>
          )}

          {action === 'reduce' && (
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">Quick Reduce</p>
              <div className="grid grid-cols-3 gap-2">
                {currentStock >= 5 && (
                  <button
                    type="button"
                    onClick={() => handleQuickReduce(5)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors text-sm dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-300"
                  >
                    -5
                  </button>
                )}
                {currentStock >= 10 && (
                  <button
                    type="button"
                    onClick={() => handleQuickReduce(10)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors text-sm dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-300"
                  >
                    -10
                  </button>
                )}
                {currentStock >= 25 && (
                  <button
                    type="button"
                    onClick={() => handleQuickReduce(25)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors text-sm dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-300"
                  >
                    -25
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              placeholder="Enter quantity"
              min="1"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Reason (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Restock, Damaged goods, Adjustment"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={validateAndSubmit}
              disabled={isSubmitting || !quantity}
              className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                action === 'add'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  {action === 'add' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  {action === 'add' ? 'Add Stock' : 'Reduce Stock'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartStockUpdateModal;
