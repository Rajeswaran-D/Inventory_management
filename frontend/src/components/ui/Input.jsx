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
        <label 
          className="block text-sm font-medium tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
          />
        )}
        <input 
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border outline-none transition-all duration-200 shadow-sm",
            Icon ? "pl-10" : "",
            className
          )}
          style={{
            borderColor: error ? '#DC2626' : 'var(--border)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#DC2626' : 'var(--border)';
            e.target.style.boxShadow = 'none';
          }}
          placeholder={props.placeholder || ''}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs font-medium" style={{ color: '#DC2626' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
