/**
 * AddProductModal Component (Refactored for 3-step selector)
 */

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { envelopeService } from '../../services/api';
import { ProductSelector3Step } from './ProductSelector3Step';

export const AddProductModal = ({ isOpen, onClose, onProductAdded }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProductSelect = (selected) => {
    setSelectedProduct(selected);
    setError('');
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(value)) {
      setPrice(value);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (!price || isNaN(price) || parseFloat(price) < 0) {
      setError('Please enter a valid price (≥0)');
      return;
    }

    setIsLoading(true);
    try {
      const newProduct = {
        size: selectedProduct.size,
        materialType: selectedProduct.material,
        gsm: selectedProduct.gsm,
        color: selectedProduct.color,
        price: parseFloat(price),
        quantity: 0,
        isActive: true
      };

      await envelopeService.create(newProduct);
      toast.success('✅ Product added successfully!');
      
      // Reset form
      setSelectedProduct(null);
      setPrice('');
      onClose();
      onProductAdded?.();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add product';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Add New Product
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Product Selector */}
          <div className="space-y-3">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Step 1: Select Product
            </h3>
            <ProductSelector3Step
              onSelect={handleProductSelect}
              showSummary={true}
              label=""
            />
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Step 2: Set Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter price"
              value={price}
              onChange={handlePriceChange}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2"
              style={{
                borderColor: price ? 'var(--primary)' : 'var(--border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs">
            <p style={{ color: 'var(--text-primary)' }}>
              <strong>Note:</strong> Initial quantity will be set to <strong>0</strong>. Use "Add Stock" to populate inventory.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border font-medium transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-main)',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedProduct || !price}
              className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all"
              style={{
                backgroundColor: 'var(--primary)',
                opacity: isLoading || !selectedProduct || !price ? 0.6 : 1
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = 'var(--primary-hover)')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'var(--primary)')}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </span>
              ) : (
                'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
