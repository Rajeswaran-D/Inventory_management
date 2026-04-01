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
    sm: 'px-3 py-1.5 text-xs font-medium rounded-md',
    md: 'px-4 py-2 text-sm font-medium rounded-lg',
    lg: 'px-6 py-3 text-base font-medium rounded-lg',
  };

  const getVariantStyles = (variant) => {
    if (variant === 'primary') {
      return {
        backgroundColor: 'var(--primary)',
        color: 'white',
      };
    }
    if (variant === 'secondary') {
      return {
        backgroundColor: 'var(--border)',
        color: 'var(--text-primary)',
      };
    }
    if (variant === 'danger') {
      return {
        backgroundColor: '#DC2626',
        color: 'white',
      };
    }
    if (variant === 'success') {
      return {
        backgroundColor: 'var(--primary)',
        color: 'white',
      };
    }
    if (variant === 'ghost') {
      return {
        backgroundColor: 'transparent',
        color: 'var(--text-primary)',
      };
    }
    return {};
  };

  const handleMouseEnter = (e) => {
    if (variant === 'primary') {
      e.target.style.backgroundColor = 'var(--primary-hover)';
    } else if (variant === 'secondary') {
      e.target.style.opacity = '0.9';
    } else if (variant === 'danger') {
      e.target.style.backgroundColor = '#B91C1C';
    } else if (variant === 'success') {
      e.target.style.backgroundColor = 'var(--primary-hover)';
    } else if (variant === 'ghost') {
      e.target.style.backgroundColor = 'var(--border)';
    }
  };

  const handleMouseLeave = (e) => {
    if (variant === 'primary') {
      e.target.style.backgroundColor = 'var(--primary)';
    } else if (variant === 'secondary') {
      e.target.style.opacity = '1';
    } else if (variant === 'danger') {
      e.target.style.backgroundColor = '#DC2626';
    } else if (variant === 'success') {
      e.target.style.backgroundColor = 'var(--primary)';
    } else if (variant === 'ghost') {
      e.target.style.backgroundColor = 'transparent';
    }
  };

  return (
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
