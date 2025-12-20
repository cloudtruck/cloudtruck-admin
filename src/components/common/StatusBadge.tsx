import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'booking' | 'payment' | 'driver' | 'customer';
}

const statusConfig = {
  booking: {
    created: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    'under-review': { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    assigned: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'driver-en-route': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'reached-pickup': { variant: 'secondary', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    loaded: { variant: 'secondary', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    'in-transit': { variant: 'secondary', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    'reached-destination': { variant: 'secondary', className: 'bg-green-100 text-green-800 border-green-200' },
    delivered: { variant: 'secondary', className: 'bg-green-100 text-green-800 border-green-200' },
    'pod-received': { variant: 'secondary', className: 'bg-green-100 text-green-800 border-green-200' },
    closed: { variant: 'secondary', className: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
    cancelled: { variant: 'secondary', className: 'bg-red-100 text-red-800 border-red-200' },
  },
  payment: {
    unpaid: { variant: 'secondary', className: 'bg-red-100 text-red-800 border-red-200' },
    partial: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    paid: { variant: 'secondary', className: 'bg-green-100 text-green-800 border-green-200' },
    failed: { variant: 'secondary', className: 'bg-red-100 text-red-800 border-red-200' },
  },
  driver: {
    available: { variant: 'secondary', className: 'bg-green-100 text-green-800 border-green-200' },
    'on-trip': { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    offline: { variant: 'secondary', className: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
    blocked: { variant: 'secondary', className: 'bg-red-100 text-red-800 border-red-200' },
  },
  customer: {
    active: { variant: 'secondary', className: 'bg-green-100 text-green-800 border-green-200' },
    inactive: { variant: 'secondary', className: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
    blocked: { variant: 'secondary', className: 'bg-red-100 text-red-800 border-red-200' },
  },
} as const;

export function StatusBadge({ status, type = 'booking' }: StatusBadgeProps) {
  const typeConfig = statusConfig[type];
  const config = (typeConfig as Record<string, { variant: 'secondary'; className: string }>)[status] || {
    variant: 'secondary' as const,
    className: 'bg-zinc-100 text-zinc-800 border-zinc-200',
  };

  const displayText = status.replace(/-/g, ' ').toUpperCase();

  return (
    <Badge variant="secondary" className={cn('font-medium', config.className)}>
      {displayText}
    </Badge>
  );
}
