import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'default', className }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  }[size];

  return (
    <div className="flex justify-center items-center p-4">
      <Loader2 className={cn(`${sizeClass} animate-spin text-zinc-900`, className)} />
    </div>
  );
}
