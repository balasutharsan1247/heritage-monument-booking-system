import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={cn(
          'relative w-full bg-white rounded-3xl shadow-heritage-lg border border-sandstone-200 z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col',
          maxWidth,
          className
        )}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between p-6 pb-4 border-b border-sandstone-200/80 bg-sandstone-50/50">
            <div>
              {title && (
                <h3 id="modal-title" className="text-xl font-bold text-charcoal-900 font-sans">
                  {title}
                </h3>
              )}
              {description && (
                <p id="modal-description" className="text-xs text-charcoal-500 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-sandstone-200/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
