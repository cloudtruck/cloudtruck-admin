import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VehicleStatusBadgeProps {
  status: 'available' | 'on-trip' | 'maintenance' | 'inactive';
  className?: string;
}

export function VehicleStatusBadge({ status, className }: VehicleStatusBadgeProps) {
  const variants = {
    available: 'bg-green-100 text-green-800 border-green-200',
    'on-trip': 'bg-blue-100 text-blue-800 border-blue-200',
    maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const labels = {
    available: 'Available',
    'on-trip': 'On Trip',
    maintenance: 'Maintenance',
    inactive: 'Inactive',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', variants[status], className)}>
      {labels[status]}
    </Badge>
  );
}
