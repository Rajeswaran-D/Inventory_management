/**
 * DeleteConfirmationModal Component
 * Confirmation popup for product deletion
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productName, 
  isLoading 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Delete Product
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p style={{ color: 'var(--text-primary)' }} className="font-semibold">
              Are you sure you want to delete this product?
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-bold text-red-600 dark:text-red-400">{productName}</span>
            </p>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
            ⚠️ This action cannot be undone. The product will be removed from your inventory.
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border font-medium transition-colors disabled:opacity-50"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-main)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#dc2626',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#b91c1c')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc2626')}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
