import { cn } from '../../utils/cn';

export const Input = ({ 
  label, 
  error, 
  className, 
  icon: Icon,
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 tracking-tight">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
        )}
        <input 
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-transparent outline-none transition-all duration-200",
            Icon ? "pl-10" : "",
            error ? "border-red-500 focus:ring-red-500" : "",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
