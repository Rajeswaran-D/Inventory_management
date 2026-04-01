import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for toast notifications
 * Provides success, error, loading, and custom toast methods
 */
export const useToast = () => {
  const showSuccess = useCallback((message, duration = 3000) => {
    toast.success(message, {
      duration,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500'
      }
    });
  }, []);

  const showError = useCallback((message, duration = 4000) => {
    toast.error(message, {
      duration,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500'
      }
    });
  }, []);

  const showLoading = useCallback((message) => {
    toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500'
      }
    });
  }, []);

  const showInfo = useCallback((message, duration = 3000) => {
    toast(message, {
      duration,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500'
      }
    });
  }, []);

  const showWarning = useCallback((message, duration = 4000) => {
    toast(message, {
      duration,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500'
      }
    });
  }, []);

  return {
    success: showSuccess,
    error: showError,
    loading: showLoading,
    info: showInfo,
    warning: showWarning,
    dismiss: toast.dismiss
  };
};

export default useToast;
