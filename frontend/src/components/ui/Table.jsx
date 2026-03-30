import React from 'react';
import { cn } from '../../utils/cn';

export const Table = ({ 
  headers, 
  children, 
  className, 
  loading,
  emptyState 
}) => {
  const childArray = React.Children.toArray(children);
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
              {headers.map((header, index) => (
                <th 
                   key={index} 
                   className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                   {[...Array(headers.length)].map((_, j) => (
                     <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                     </td>
                   ))}
                </tr>
              ))
            ) : childArray.length > 0 ? childArray : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {emptyState || 'No data available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TableRow = ({ children, className, ...props }) => (
  <tr 
    className={cn(
      "hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer",
      className
    )}
    {...props}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className }) => (
  <td className={cn("px-6 py-4 text-gray-700 dark:text-gray-300", className)}>
    {children}
  </td>
);
