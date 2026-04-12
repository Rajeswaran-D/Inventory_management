import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productService } from '../../services/api';

export const ProductMasterModal = ({ isOpen, onClose, onProductSaved, product = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    materialType: ''
  });
  const [materials, setMaterials] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          name: product.name,
          materialType: product.materialType
        });
      } else {
        setFormData({ name: '', materialType: '' });
      }
      loadMaterials();
      setError('');
    }
  }, [isOpen, product]);

  const loadMaterials = async () => {
    try {
      const res = await productService.getMaterials();
      setMaterials(res.data || []);
    } catch (err) {
      console.error('Error loading materials:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.materialType) {
      setError('Name and Material Type are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (product) {
        await productService.updateProduct(product._id || product.id, formData);
        toast.success('Product Master updated successfully');
      } else {
        await productService.createProduct(formData);
        toast.success('Product Master created successfully');
      }
      onProductSaved();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {product ? 'Edit Product Master' : 'Add Product Master'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Display Name (e.g. Maplitho)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name..."
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Material Rule System
            </label>
            <select
              value={formData.materialType}
              onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Select Material System...</option>
              {materials.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-1">
              * This determines if product has GSM, Size, or specific colors.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
