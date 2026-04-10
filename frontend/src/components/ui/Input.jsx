import { cn } from '../../utils/cn';

export const Input = ({ 
  label, 
  error, 
  className, 
  icon: Icon,
  size = 'md',
  ...props 
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return (
    <div className="space-y-2">
      {label && (
        <label 
          className="block text-sm font-semibold text-gray-700 tracking-tight"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-gray-400 group-focus-within:text-green-600 transition-colors duration-200"
          />
        )}
        <input 
          className={cn(
            sizes[size],
            'w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500',
            'outline-none transition-all duration-200 shadow-sm hover:shadow-md',
            'focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:border-green-500 focus:shadow-md',
            'disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed',
            Icon ? "pl-10" : "",
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          placeholder={props.placeholder || ''}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
