'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    console.error('[Root Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-zinc-900">
        Something went wrong
      </h1>
      <p className="mb-6 max-w-sm text-sm text-zinc-500">
        An unexpected error occurred. Please try again or return to the
        dashboard.
      </p>

      {isDev && error.message && (
        <pre className="mb-6 max-w-lg overflow-x-auto rounded-md border border-red-200 bg-red-50 p-4 text-left font-mono text-xs text-red-700">
          {error.message}
        </pre>
      )}

      <Button onClick={reset} variant="outline">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
