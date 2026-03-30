import { cn } from '../../utils/cn';

export const Card = ({ 
  children, 
  className, 
  variant = 'white', 
  ...props 
}) => {
  const variants = {
    white: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md',
    highlight: 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md',
    danger: 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 shadow-sm hover:shadow-md',
  };

  return (
    <div 
      className={cn(
        "rounded-lg p-6 transition-all duration-300",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }) => (
  <div className={cn("mb-4 flex items-center justify-between", className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className }) => (
  <h3 className={cn("text-lg font-bold text-gray-900 dark:text-white tracking-tight", className)}>
    {children}
  </h3>
);

export const CardContent = ({ children, className }) => (
  <div className={cn("space-y-4", className)}>
    {children}
  </div>
);
