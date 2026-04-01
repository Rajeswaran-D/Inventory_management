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
    <div 
      className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 border"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)'
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr 
              className="border-b"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border)'
              }}
            >
              {headers.map((header, index) => (
                <th 
                   key={index} 
                   className="px-6 py-4 font-bold text-xs uppercase tracking-wider"
                   style={{ color: 'var(--text-primary)' }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse transition-colors">
                   {[...Array(headers.length)].map((_, j) => (
                     <td key={j} className="px-6 py-4">
                        <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--border)' }} />
                     </td>
                   ))}
                </tr>
              ))
            ) : childArray.length > 0 ? childArray : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
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
      "transition-colors duration-150 cursor-pointer",
      className
    )}
    style={{
      backgroundColor: 'var(--bg-card)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--bg-main)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--bg-card)';
    }}
    {...props}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className }) => (
  <td 
    className={cn("px-6 py-4", className)}
    style={{ color: 'var(--text-primary)' }}
  >
    {children}
  </td>
);
