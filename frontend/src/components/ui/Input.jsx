import { cn } from '../../utils/cn';

export const Input = ({ 
  label, 
  error, 
  className, 
  icon: Icon,
  ...props 
}) => {
  return (
    <div className="space-y-2 group">
      {label && (
        <label className="text-sm font-bold text-surface-500 uppercase tracking-widest px-1 transition-colors group-focus-within:text-indigo-600">
           {label}
        </label>
      )}
      <div className="relative overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow group-focus-within:shadow-xl group-focus-within:shadow-indigo-500/10">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-indigo-600 transition-colors" />
        )}
        <input 
          className={cn(
            "w-full bg-surface-50 dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 py-4 px-6 rounded-2xl text-surface-900 dark:text-white placeholder:text-surface-400 focus:bg-white dark:focus:bg-surface-700 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all outline-none",
            Icon ? "pl-12" : "px-6",
            error ? "border-rose-500 bg-rose-50/50" : "hover:border-surface-300",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs font-bold text-rose-500 px-1 italic">
             {error}
          </p>
        )}
      </div>
    </div>
  );
};
