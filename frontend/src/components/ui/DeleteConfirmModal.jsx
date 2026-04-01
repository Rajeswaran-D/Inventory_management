import React from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from './Card';

export const DeleteConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white dark:bg-gray-800 w-full max-w-md">
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

              <div className="flex gap-3">
                <button
                  onClick={onConfirm}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex-1 justify-center font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={onCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg transition flex-1 justify-center font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
