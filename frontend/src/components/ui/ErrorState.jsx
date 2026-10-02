import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

// Translates raw server errors into polite, actionable user messages
export function formatErrorMessage(rawError, defaultMsg = 'Unable to complete the requested action.') {
  if (!rawError) return defaultMsg;
  const str = typeof rawError === 'string' ? rawError : rawError.message || JSON.stringify(rawError);
  
  if (/failed to fetch|network error|econnrefused|err_connection/i.test(str)) {
    return 'Could not connect to the heritage portal service. Please check your internet connection or try again in a few moments.';
  }
  if (/500|internal server/i.test(str)) {
    return 'The server encountered a temporary delay. Please try again shortly.';
  }
  if (/404|not found/i.test(str)) {
    return 'The requested monument or record was not found.';
  }
  if (/401|unauthorized|invalid token/i.test(str)) {
    return 'Your session has expired. Please sign in again to continue.';
  }
  if (/403|forbidden/i.test(str)) {
    return 'You do not have administrative permission to view this resource.';
  }
  return str;
}

export const ErrorState = ({
  error,
  title = 'Something went wrong',
  description,
  onRetry,
  className = '',
}) => {
  const displayMessage = description || formatErrorMessage(error);

  return (
    <div className={`bg-white rounded-3xl border border-red-200/80 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm my-6 ${className}`}>
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-600 border border-red-100">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-charcoal-900 font-serif mb-2">
        {title}
      </h3>
      <p className="text-sm text-charcoal-600 mb-6 leading-relaxed">
        {displayMessage}
      </p>
      {onRetry && (
        <Button variant="outline" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
