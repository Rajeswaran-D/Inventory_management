import { cn } from '../../utils/cn';

export const Card = ({ 
  children, 
  className, 
  variant = 'default', 
  ...props 
}) => {
  const variants = {
    default: 'bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md',
    elevated: 'bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg',
    premium: 'bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl',
    highlight: 'bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 shadow-sm hover:shadow-md',
    danger: 'bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 shadow-sm hover:shadow-md',
    warning: 'bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-200 shadow-sm hover:shadow-md',
  };

  return (
    <div 
      className={cn(
        'transition-all duration-200 p-6',
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

export const CardTitle = ({ children, className, size = 'base' }) => {
  const sizes = {
    xs: 'text-xs font-bold',
    sm: 'text-sm font-bold',
    base: 'text-lg font-bold',
    lg: 'text-xl font-bold',
    xl: 'text-2xl font-bold',
  };
  
  return (
    <h3 
      className={cn(sizes[size], 'text-gray-900 tracking-tight', className)}
    >
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className }) => (
  <div className={cn("space-y-4", className)}>
    {children}
  </div>
);

export const CardDescription = ({ children, className }) => (
  <p className={cn("text-sm text-gray-600", className)}>
    {children}
  </p>
);
