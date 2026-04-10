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
  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
    md: 'px-5 py-2.5 text-sm font-semibold rounded-lg',
    lg: 'px-7 py-3 text-base font-semibold rounded-lg',
  };

  const variants = {
    primary: 'bg-gradient-to-r from-green-600 to-green-600 text-white hover:from-green-700 hover:to-green-700 shadow-md hover:shadow-lg active:scale-95',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:scale-95 shadow-sm hover:shadow-md',
    danger: 'bg-gradient-to-r from-red-600 to-red-600 text-white hover:from-red-700 hover:to-red-700 shadow-md hover:shadow-lg active:scale-95',
    success: 'bg-gradient-to-r from-green-600 to-green-600 text-white hover:from-green-700 hover:to-green-700 shadow-md hover:shadow-lg active:scale-95',
    ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all',
    outline: 'border-2 border-gray-300 text-gray-900 hover:border-green-600 hover:text-green-600 hover:bg-green-50',
  };

  return (
    <button
      className={cn(
        sizes[size],
        variants[variant],
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      )}
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};
    <button 
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        sizes[size],
        className
      )}
      style={getVariantStyles(variant)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
};
