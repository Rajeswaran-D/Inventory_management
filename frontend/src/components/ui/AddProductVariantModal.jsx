/**
 * AddProductVariantModal Component
 * Focuses purely on variant attributes for a pre-selected Product.
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productService } from '../../services/api';

export const AddProductVariantModal = ({ isOpen, onClose, onProductAdded, product }) => {
  const [formData, setFormData] = useState({
    size: '',
    gsm: '',
    color: '',
    price: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when modal opens with a new product
  useEffect(() => {
    if (isOpen) {
      setFormData({ size: '', gsm: '', color: '', price: '' });
      setError('');
      setSuccess('');
    }
  }, [isOpen, product]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const showSize = product?.hasSize;
  const showGSM = product?.hasGSM;
  const showColor = product?.hasColor;

  const validateForm = () => {
    if (!product) return false;

    if (showSize && !formData.size) {
      setError('Please enter a size');
      return false;
    }
    if (showGSM && !formData.gsm) {
      setError('Please enter GSM value');
      return false;
    }
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      setError('Please enter a valid initial price (≥0)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const variantData = {
        productId: product._id,
        productName: product.name,
        size: showSize ? (formData.size.trim() || null) : null,
        gsm: showGSM ? (formData.gsm !== '' ? Number(formData.gsm) : null) : null,
        color: showColor ? (formData.color.trim() || null) : null,
        price: parseFloat(formData.price) || 0
      };

      await productService.createVariant(variantData);
      
      setSuccess(`✅ Product created: ${product.name} | Price: ₹${formData.price}`);
      toast.success(`✅ ${product.name} variant added successfully!`);
      
      setTimeout(() => {
        onClose();
        onProductAdded?.();
      }, 1500);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create product';
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate') || errorMsg.includes('Another variant')) {
        setError('⚠️ This variant already exists');
      } else {
        setError(errorMsg);
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-sm w-full outline-none focus:outline-none">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Variant</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-600 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Read-only Product Display */}
        <div className="px-6 pt-5">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Adding Variant for: <span className="font-bold">{product.name}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {success && (
            <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {showSize && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Size *
              </label>
              <div className="flex gap-2">
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleFormChange}
                  className="flex-1 px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                >
                  <option value="">Select Size...</option>
                  {product.sizeOptions?.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Custom"
                  name="size"
                  value={formData.size}
                  onChange={handleFormChange}
                  className="w-1/3 px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                />
              </div>
            </div>
          )}

          {showGSM && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                GSM *
              </label>
              <div className="flex gap-2">
                <select
                  name="gsm"
                  value={formData.gsm}
                  onChange={handleFormChange}
                  className="flex-1 px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                >
                  <option value="">Select GSM...</option>
                  {product.gsmOptions?.map(gsm => (
                    <option key={gsm} value={gsm}>{gsm} GSM</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Custom"
                  name="gsm"
                  value={formData.gsm}
                  onChange={handleFormChange}
                  min="0"
                  className="w-1/3 px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                />
              </div>
            </div>
          )}

          {showColor && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Color
              </label>
              <div className="flex gap-2">
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleFormChange}
                  className="flex-1 px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                >
                  <option value="">Select Color...</option>
                  {product.colorOptions?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Custom"
                  name="color"
                  value={formData.color}
                  onChange={handleFormChange}
                  className="w-1/3 px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                />
              </div>
            </div>
          )}

<div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              💰 Initial Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleFormChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? 'Creating...' : 'Create Variant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductVariantModal;
