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
    <div className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              {headers.map((header, index) => (
                <th 
                   key={index} 
                   className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-gray-700 text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse bg-white">
                   {[...Array(headers.length)].map((_, j) => (
                     <td key={j} className="px-6 py-4">
                        <div className="h-4 rounded bg-gray-200" />
                     </td>
                   ))}
                </tr>
              ))
            ) : childArray.length > 0 ? childArray : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-500 font-medium">
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
      "transition-colors duration-150 hover:bg-gray-50 cursor-pointer",
      className
    )}
    {...props}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className, align = 'left' }) => (
  <td 
    className={cn("px-6 py-4 text-gray-900", `text-${align}`, className)}
  >
    {children}
  </td>
);
