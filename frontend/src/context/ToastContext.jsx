import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = 'info', duration = 4000, title }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration, title }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, title) => addToast({ message: msg, type: 'success', title }),
    error: (msg, title) => addToast({ message: msg, type: 'error', title }),
    warning: (msg, title) => addToast({ message: msg, type: 'warning', title }),
    info: (msg, title) => addToast({ message: msg, type: 'info', title }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container floating bottom-right */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-maroon-700 shrink-0 mt-0.5" />,
          };

          const borders = {
            success: 'border-emerald-200 bg-white text-emerald-950',
            warning: 'border-amber-200 bg-white text-amber-950',
            error: 'border-red-200 bg-white text-red-950',
            info: 'border-sandstone-300 bg-white text-charcoal-900',
          };

          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-heritage-lg border animate-in slide-in-from-bottom-3 duration-200',
                borders[t.type] || borders.info
              )}
            >
              {icons[t.type]}
              <div className="flex-1 min-w-0">
                {t.title && <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">{t.title}</h4>}
                <p className="text-sm font-medium leading-snug">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-charcoal-400 hover:text-charcoal-700 p-1 rounded-lg transition-colors focus-visible:outline-none"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      success: (msg) => console.log('Toast [success]:', msg),
      error: (msg) => console.error('Toast [error]:', msg),
      warning: (msg) => console.warn('Toast [warning]:', msg),
      info: (msg) => console.log('Toast [info]:', msg),
    };
  }
  return context;
};
