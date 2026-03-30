import { cn } from '../../utils/cn';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className, 
  size = 'md' 
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full m-4',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-950/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full bg-white dark:bg-surface-900 rounded-4xl border border-surface-200 dark:border-surface-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden",
              sizes[size],
              className
            )}
          >
            <div className="p-8 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50 dark:bg-surface-800/50">
               <div>
                  <h2 className="text-2xl font-black text-surface-900 dark:text-white uppercase tracking-tight">{title}</h2>
               </div>
               <button 
                  onClick={onClose}
                  className="p-3 text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all active:scale-90"
               >
                  <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
               {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
