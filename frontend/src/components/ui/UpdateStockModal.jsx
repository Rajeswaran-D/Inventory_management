/**
 * UpdateStockModal Component
 * Simple, fast update: Price + Quantity only
 * Product details shown as read-only
 */

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { envelopeService, stockService } from '../../services/api';

export const UpdateStockModal = ({ isOpen, onClose, product, onStockUpdated }) => {
  const [formData, setFormData] = useState({
    price: product?.price || '',
    quantity: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !product) return null;

  const handlePriceChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, price: value }));
    setError('');
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(value)) {
      setFormData(prev => ({ ...prev, quantity: value }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.price === '' || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      setError('Please enter a valid price');
      return;
    }
    if (formData.quantity === '' || isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setIsLoading(true);
    try {
      // Update price
      await envelopeService.update(product._id, {
        price: parseFloat(formData.price)
      });

      // Record stock transaction
      await stockService.recordIn({
        envelopeId: product._id,
        type: 'IN',
        quantity: parseInt(formData.quantity)
      });

      toast.success(`✅ Stock updated for ${product.size} | ${product.materialType}`);
      onStockUpdated && onStockUpdated();
      
      // Reset form
      setFormData({
        price: product.price,
        quantity: ''
      });
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update stock. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      price: product.price,
      quantity: ''
    });
    setError('');
  };

  // Format product display name
  const productDisplayName = `${product.size} | ${product.materialType}${product.gsm ? ` | ${product.gsm} GSM` : ''}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Update Stock
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Display (Read-Only) */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Product Details
            </div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {productDisplayName}
            </div>
            <div className="text-sm mt-3 grid grid-cols-2 gap-3" style={{ color: 'var(--text-secondary)' }}>
              <div>
                <div className="text-xs opacity-75">Current Stock</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">{product.quantity.toLocaleString()} units</div>
              </div>
              <div>
                <div className="text-xs opacity-75">Current Price</div>
                <div className="font-semibold">₹{product.price}</div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter price"
              value={formData.price}
              onChange={handlePriceChange}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--primary)'
              }}
            />
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Quantity to Add <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Enter quantity"
              value={formData.quantity}
              onChange={handleQuantityChange}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--primary)'
              }}
            />
          </div>

          {/* Stock Preview */}
          {formData.quantity && !isNaN(formData.quantity) && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
              <div style={{ color: 'var(--text-primary)' }}>
                <div className="text-xs font-semibold mb-2">After Update:</div>
                <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                  {product.quantity.toLocaleString()} + {parseInt(formData.quantity)} = {(product.quantity + parseInt(formData.quantity)).toLocaleString()} units
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="reset"
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border font-medium transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-main)',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.price || !formData.quantity}
              className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all"
              style={{
                backgroundColor: 'var(--primary)',
                opacity: isLoading || !formData.price || !formData.quantity ? 0.6 : 1
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = 'var(--primary-hover)')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'var(--primary)')}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </span>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateStockModal;
