import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DriverStatusBadgeProps {
  status: 'available' | 'on-trip' | 'offline' | 'blocked';
  className?: string;
}

export function DriverStatusBadge({ status, className }: DriverStatusBadgeProps) {
  const variants = {
    available: 'bg-green-100 text-green-800 border-green-200',
    'on-trip': 'bg-blue-100 text-blue-800 border-blue-200',
    offline: 'bg-gray-100 text-gray-800 border-gray-200',
    blocked: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels = {
    available: 'Available',
    'on-trip': 'On Trip',
    offline: 'Offline',
    blocked: 'Blocked',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', variants[status], className)}>
      {labels[status]}
    </Badge>
  );
}
