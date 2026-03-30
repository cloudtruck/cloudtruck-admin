'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({ error, reset }: AuthErrorProps) {
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    console.error('[Auth Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-7 w-7 text-red-600" />
      </div>

      <h2 className="mb-2 text-xl font-semibold text-zinc-900">
        Something went wrong
      </h2>
      <p className="mb-6 max-w-xs text-sm text-zinc-500">
        An error occurred on the login page. Please try again.
      </p>

      {isDev && error.message && (
        <pre className="mb-6 max-w-sm overflow-x-auto rounded-md border border-red-200 bg-red-50 p-3 text-left font-mono text-xs text-red-700">
          {error.message}
        </pre>
      )}

      <Button onClick={reset} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
