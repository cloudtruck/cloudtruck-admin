import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VehicleStatusBadgeProps {
  status: string;
  className?: string;
}

export function VehicleStatusBadge({ status, className }: VehicleStatusBadgeProps) {
  const variants: Record<string, string> = {
    available: 'bg-green-100 text-green-800 border-green-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    'on-trip': 'bg-blue-100 text-blue-800 border-blue-200',
    maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'under-maintenance': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    retired: 'bg-red-100 text-red-800 border-red-200',
    verified: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-orange-100 text-orange-800 border-orange-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels: Record<string, string> = {
    available: 'Available',
    active: 'Active',
    'on-trip': 'On Trip',
    maintenance: 'Maintenance',
    'under-maintenance': 'Maintenance',
    inactive: 'Inactive',
    retired: 'Retired',
    verified: 'Verified',
    pending: 'Pending Approval',
    rejected: 'Rejected',
    expired: 'Expired',
  };

  return (
    <Badge variant="outline" className={cn('font-medium capitalize', variants[status] || 'bg-gray-100 text-gray-800', className)}>
      {labels[status] || status}
    </Badge>
  );
}
