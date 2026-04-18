import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productService } from '../../services/api';

export const EditProductMasterModal = ({ isOpen, onClose, product, onProductUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hasGSM: false,
    hasSize: false,
    hasColor: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        hasGSM: product.hasGSM || false,
        hasSize: product.hasSize || false,
        hasColor: product.hasColor || false
      });
      setError('');
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    setIsLoading(true);
    try {
      await productService.updateProduct(product._id, formData);
      toast.success('Product updated successfully!');
      onProductUpdated();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update product';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Edit Product Type
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Premium Maplitho"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Optional description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Required Specifications
            </label>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasGSM"
                name="hasGSM"
                checked={formData.hasGSM}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 rounded"
              />
              <label htmlFor="hasGSM" className="text-sm text-gray-700">
                Requires GSM Specification
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasSize"
                name="hasSize"
                checked={formData.hasSize}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 rounded"
              />
              <label htmlFor="hasSize" className="text-sm text-gray-700">
                Requires Size Specification
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasColor"
                name="hasColor"
                checked={formData.hasColor}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 rounded"
              />
              <label htmlFor="hasColor" className="text-sm text-gray-700">
                Requires Color Specification
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 px-4 py-2 rounded-lg text-white font-medium bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
