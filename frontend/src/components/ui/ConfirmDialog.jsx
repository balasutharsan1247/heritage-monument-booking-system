import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center p-2 space-y-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
          variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {variant === 'danger' ? (
            <AlertTriangle className="w-7 h-7" />
          ) : (
            <HelpCircle className="w-7 h-7" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-charcoal-900 font-sans">
            {title}
          </h3>
          <p className="text-sm text-charcoal-600 mt-2 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex w-full gap-3 pt-4 border-t border-sandstone-100 mt-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            fullWidth
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
