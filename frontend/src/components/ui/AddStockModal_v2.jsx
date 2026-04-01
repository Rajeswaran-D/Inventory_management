/**
 * AddStockModal Component (Refactored)
 * Uses 3-step product selector (Material → GSM → Size)
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { envelopeService, stockService } from '../../services/api';
import { ProductSelector3Step } from './ProductSelector3Step';
import { formatProductName } from '../../utils/productData';

export const AddStockModal = ({ isOpen, onClose, onStockAdded }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setFetchLoading(true);
    try {
      const res = await envelopeService.getAll();
      setProducts(res.data || []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setFetchLoading(false);
    }
  };

  // Handle product selection from 3-step selector
  const handleProductSelect = (selected) => {
    // Find matching product from database
    const matching = products.find((p) => {
      return (
        p.size === selected.size &&
        p.materialType === selected.material &&
        (selected.gsm === null ? p.gsm === null : p.gsm === selected.gsm) &&
        (selected.color === null ? p.color === null : p.color === selected.color)
      );
    });

    if (matching) {
      setSelectedProduct(matching);
      setError('');
    } else {
      setSelectedProduct(null);
      setError('Product not found in inventory');
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(value)) {
      setQuantity(value);
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
    if (!quantity || isNaN(quantity) || parseInt(quantity) < 1) {
      setError('Please enter a valid quantity (≥1)');
      return;
    }

    setIsLoading(true);
    try {
      const qty = parseInt(quantity);
      await stockService.recordIn({
        envelopeId: selectedProduct._id,
        type: 'IN',
        quantity: qty
      });

      toast.success(`✅ Added ${qty} units to stock`);
      setQuantity('');
      setSelectedProduct(null);
      onClose();
      onStockAdded?.();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add stock';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Add Stock
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
              Select Product
            </h3>
            {fetchLoading ? (
              <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                Loading products...
              </div>
            ) : (
              <ProductSelector3Step
                onSelect={handleProductSelect}
                showSummary={true}
                label=""
              />
            )}
          </div>

          {/* Selected Product Details */}
          {selectedProduct && (
            <div
              className="p-4 rounded-lg border-2"
              style={{
                backgroundColor: 'var(--primary)',
                borderColor: 'var(--primary)',
                opacity: 0.15
              }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                ✅ Selected Product Details
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Size:</span>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedProduct.size}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Material:</span>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedProduct.materialType}
                  </p>
                </div>
                {selectedProduct.gsm && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>GSM:</span>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedProduct.gsm}
                    </p>
                  </div>
                )}
                {selectedProduct.color && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Color:</span>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedProduct.color}
                    </p>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Stock:</span>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedProduct.quantity.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Price:</span>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ₹{selectedProduct.price}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity Input */}
          {selectedProduct && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Add Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Enter quantity to add"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2"
                style={{
                  borderColor: quantity ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          )}

          {/* Stock Preview */}
          {selectedProduct && quantity && !isNaN(quantity) && (
            <div
              className="p-4 rounded-lg border-l-4"
              style={{
                borderLeftColor: 'var(--primary)',
                backgroundColor: 'var(--bg-card)'
              }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Stock Preview
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                Current: <span className="font-semibold">{selectedProduct.quantity.toLocaleString()}</span> + 
                New: <span className="font-semibold">{parseInt(quantity).toLocaleString()}</span> = 
                Total: <span className="font-bold" style={{ color: 'var(--primary)' }}>
                  {(selectedProduct.quantity + parseInt(quantity)).toLocaleString()}
                </span>
              </p>
            </div>
          )}

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
              disabled={isLoading || !selectedProduct || !quantity}
              className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all"
              style={{
                backgroundColor: 'var(--primary)',
                opacity: isLoading || !selectedProduct || !quantity ? 0.6 : 1
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
                'Add to Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
