import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Table = ({ 
  headers, 
  children, 
  className, 
  loading,
  emptyState 
}) => {
  return (
    <div className="bg-white dark:bg-surface-900 rounded-4xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-xl shadow-surface-500/5">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/50">
              {headers.map((header, index) => (
                <th 
                   key={index} 
                   className="p-8 text-xs font-black uppercase tracking-widest text-surface-400 dark:text-surface-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                   {[...Array(headers.length)].map((_, j) => (
                     <td key={j} className="p-8">
                        <div className="h-4 bg-surface-100 dark:bg-surface-800 rounded-full w-full" />
                     </td>
                   ))}
                </tr>
              ))
            ) : children}
          </tbody>
        </table>
        {!loading && !children.length && emptyState && (
          <div className="py-20 text-center text-surface-400 font-medium">
             {emptyState}
          </div>
        )}
      </div>
    </div>
  );
};

export const TableRow = ({ children, className, ...props }) => (
  <tr 
    className={cn(
      "group hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors even:bg-surface-50/30 dark:even:bg-surface-800/20",
      className
    )}
    {...props}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className }) => (
  <td className={cn("p-8 font-medium text-surface-900 dark:text-white transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400", className)}>
    {children}
  </td>
);
