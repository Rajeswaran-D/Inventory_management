import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog Component
 * Reusable confirmation modal for delete/checkout operations
 */
export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger', 'warning', 'info'
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: AlertTriangle,
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
      borderClass: 'border-red-300 bg-red-50'
    },
    warning: {
      icon: AlertTriangle,
      buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      borderClass: 'border-amber-300 bg-amber-50'
    },
    info: {
      icon: AlertTriangle,
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      borderClass: 'border-blue-300 bg-blue-50'
    }
  };

  const style = variantStyles[variant];
  const IconComponent = style.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-lg max-w-md w-full ${style.borderClass} border`}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <IconComponent className={`w-6 h-6 ${
              variant === 'danger' ? 'text-red-600' :
              variant === 'warning' ? 'text-amber-600' :
              'text-blue-600'
            }`} />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-gray-700 text-sm">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${style.buttonClass}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
