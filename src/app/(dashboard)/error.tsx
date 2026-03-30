'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            {isDev
              ? 'An error occurred in this section of the dashboard.'
              : 'An error occurred. Our team has been notified.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {isDev && (
            <details className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
              <summary className="cursor-pointer font-medium text-red-700">
                Error details (development only)
              </summary>
              <div className="mt-2 space-y-2">
                <p className="font-mono text-xs text-red-800 break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-red-700">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {!isDev && error.digest && (
            <p className="text-center text-xs text-zinc-400">
              Error ID: <span className="font-mono">{error.digest}</span>
            </p>
          )}
        </CardContent>

        <CardFooter className="justify-center gap-3">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
