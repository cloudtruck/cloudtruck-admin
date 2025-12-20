'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'bg-white border-zinc-200',
          title: 'text-zinc-900',
          description: 'text-zinc-500',
          actionButton: 'bg-zinc-900 text-white',
          cancelButton: 'bg-zinc-100 text-zinc-900',
          error: 'bg-red-50 border-red-200 text-red-900',
          success: 'bg-green-50 border-green-200 text-green-900',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
          info: 'bg-blue-50 border-blue-200 text-blue-900',
        },
      }}
    />
  );
}
