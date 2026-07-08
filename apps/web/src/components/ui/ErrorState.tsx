import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'An unexpected error occurred.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-64 border rounded-lg border-destructive/20 bg-destructive/5">
      <AlertCircle className="h-10 w-10 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-destructive">Error</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-background border rounded-md text-sm hover:bg-muted"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
