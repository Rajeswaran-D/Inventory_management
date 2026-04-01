/**
 * EditProductVariantModal Component
 * 
 * Modal for editing existing product variants with:
 * - Pre-filled form data
 * - Conditional field editing
 * - Price update
 * - Duplicate prevention
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Edit3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productService, inventoryService } from '../../services/api';

export const EditProductVariantModal = ({ 
  isOpen, 
  onClose, 
  variant, 
  product,
  onProductUpdated 
}) => {
  const [formData, setFormData] = useState({
    gsm: '',
    size: '',
    color: '',
    price: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill form when modal opens
  useEffect(() => {
    if (isOpen && variant) {
      setFormData({
        gsm: variant.gsm || '',
        size: variant.size || '',
        color: variant.color || '',
        price: variant.price || '0'
      });
      setError('');
      setSuccess('');
    }
  }, [isOpen, variant]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    // Validate GSM if required
    if (product?.hasGSM && !formData.gsm) {
      setError('GSM is required for this product');
      return false;
    }

    // Validate Size if required
    if (product?.hasSize && !formData.size) {
      setError('Size is required for this product');
      return false;
    }

    // Validate Price
    if (formData.price === '' || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      setError('Price must be a valid number (≥0)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare update data
      const updateData = {};
      
      if (product?.hasGSM && formData.gsm) {
        updateData.gsm = parseInt(formData.gsm);
      }
      if (product?.hasSize && formData.size) {
        updateData.size = formData.size;
      }
      if (product?.hasColor && formData.color) {
        updateData.color = formData.color;
      }
      if (formData.price) {
        updateData.price = parseFloat(formData.price);
      }

      console.log('✏️ Updating variant:', variant._id, updateData);

      // Update variant
      const response = await productService.updateVariant(variant._id, updateData);
      
      console.log('✅ Variant updated:', response.data);

      setSuccess(`✅ ${product?.name} variant updated successfully!`);
      toast.success(`✅ ${variant.displayName} updated!`);

      // Close after 1.5 seconds
      setTimeout(() => {
        setFormData({ gsm: '', size: '', color: '', price: '' });
        setSuccess('');
        onClose();
        onProductUpdated?.();
      }, 1500);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to update variant';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('❌ Error updating variant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !variant || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
          <div className="flex items-center gap-3">
            <Edit3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Product Variant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

          {/* Product Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Product:</strong> {product.name}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              <strong>Current:</strong> {variant.displayName}
            </p>
          </div>

          {/* GSM Field */}
          {product?.hasGSM && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                GSM (Paper Weight) *
              </label>
              <div className="flex gap-2">
                <select
                  name="gsm"
                  value={formData.gsm}
                  onChange={handleFormChange}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select GSM...</option>
                  {product.gsmOptions?.map(gsm => (
                    <option key={gsm} value={gsm}>{gsm} GSM</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Or enter custom GSM"
                  value={formData.gsm}
                  onChange={handleFormChange}
                  name="gsm"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Size Field */}
          {product?.hasSize && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Size *
              </label>
              <select
                name="size"
                value={formData.size}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Size...</option>
                {product.sizeOptions?.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}

          {/* Color Field */}
          {product?.hasColor && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <select
                name="color"
                value={formData.color}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Clear Color</option>
                {product.colorOptions?.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
          )}

          {/* Price Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              💰 Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              placeholder="0.00"
              value={formData.price}
              onChange={handleFormChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Update Variant
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductVariantModal;
