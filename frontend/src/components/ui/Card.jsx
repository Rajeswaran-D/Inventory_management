import { cn } from '../../utils/cn';

export const Card = ({ 
  children, 
  className, 
  variant = 'white', 
  ...props 
}) => {
  const variants = {
    white: 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-xl shadow-surface-300/10 dark:shadow-black/20',
    indigo: 'bg-[#4F46E5] text-white shadow-2xl shadow-indigo-500/30 border-none',
    secondary: 'bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm',
    transparent: 'bg-transparent border border-surface-200 dark:border-surface-800 shadow-none hover:shadow-xl transition-all duration-300',
  };

  return (
    <div 
      className={cn(
        "rounded-4xl p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl",
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
  <div className={cn("mb-6 flex items-center justify-between", className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className }) => (
  <h3 className={cn("text-xl font-bold tracking-tight text-surface-900 dark:text-white uppercase", className)}>
    {children}
  </h3>
);

export const CardContent = ({ children, className }) => (
  <div className={cn("space-y-4", className)}>
    {children}
  </div>
);
