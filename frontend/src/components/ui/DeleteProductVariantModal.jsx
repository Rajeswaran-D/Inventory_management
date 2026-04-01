/**
 * DeleteProductVariantModal Component
 * 
 * Confirmation modal for deleting product variants with:
 * - Clear warning message
 * - Variant details display
 * - Confirm/Cancel options
 * - Loading state
 */

import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productService } from '../../services/api';

export const DeleteProductVariantModal = ({ 
  isOpen, 
  onClose, 
  variant, 
  product,
  onProductDeleted 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      console.log('🗑️ Deleting variant:', variant._id);

      const response = await productService.deleteVariant(variant._id);
      
      console.log('✅ Variant deleted:', response.data);

      setSuccess('✅ Product variant deleted successfully!');
      toast.success(`✅ ${variant.displayName} deleted!`);

      // Close after 1.5 seconds
      setTimeout(() => {
        setSuccess('');
        onClose();
        onProductDeleted?.();
      }, 1500);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to delete variant';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('❌ Error deleting variant:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !variant || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Product Variant</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
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
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Warning Box */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-2">
              ⚠️ Warning: This action cannot be undone
            </p>
            <p className="text-xs text-red-700 dark:text-red-400">
              Deleting this product variant will also remove its inventory record. Any stock data associated will be permanently deleted.
            </p>
          </div>

          {/* Product Info */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              You are about to delete:
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-900 dark:text-white font-bold">
                {variant.displayName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Product: <strong>{product.name}</strong>
              </p>
              {variant.sku && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  SKU: <strong>{variant.sku}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Variant Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
            {variant.gsm && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>GSM:</strong> {variant.gsm}
              </p>
            )}
            {variant.size && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Size:</strong> {variant.size}
              </p>
            )}
            {variant.color && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Color:</strong> {variant.color}
              </p>
            )}
          </div>

          {/* Confirmation Question */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">
              Are you absolutely sure?
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Delete Permanently
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProductVariantModal;
