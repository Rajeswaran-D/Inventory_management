import { cn } from '../../utils/cn';

export const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  icon: Icon,
  ...props 
}) => {
  const variants = {
    primary: 'bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-primary-500/20',
    secondary: 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 shadow-sm',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20',
    ghost: 'bg-transparent text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold',
    md: 'px-5 py-2.5 text-sm font-bold',
    lg: 'px-8 py-4 text-base font-black',
  };

  return (
    <button 
      className={cn(
        "relative rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden active:scale-95 disabled:opacity-50 disabled:pointer-events-none group shadow-lg",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit">
           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <div className={cn("flex items-center gap-2", isLoading ? "opacity-0" : "opacity-100")}>
        {Icon && <Icon className={cn("w-5 h-5", children ? "" : "mx-auto")} />}
        {children}
      </div>
    </button>
  );
};
