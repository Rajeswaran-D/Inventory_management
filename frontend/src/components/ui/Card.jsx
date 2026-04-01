import { cn } from '../../utils/cn';

export const Card = ({ 
  children, 
  className, 
  variant = 'white', 
  ...props 
}) => {
  const getVariantStyles = (variant) => {
    if (variant === 'white') {
      return {
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
        color: 'var(--text-primary)',
      };
    }
    if (variant === 'highlight') {
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'var(--primary)',
        color: 'var(--text-primary)',
      };
    }
    if (variant === 'danger') {
      return {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: '#DC2626',
        color: 'var(--text-primary)',
      };
    }
    return {};
  };

  return (
    <div 
      className={cn(
        "rounded-xl p-6 border shadow-md hover:shadow-lg transition-shadow duration-200",
        className
      )}
      style={getVariantStyles(variant)}
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
  <h3 
    className={cn("text-lg font-bold tracking-tight", className)}
    style={{ color: 'var(--text-primary)' }}
  >
    {children}
  </h3>
);

export const CardContent = ({ children, className }) => (
  <div className={cn("space-y-4", className)}>
    {children}
  </div>
);
