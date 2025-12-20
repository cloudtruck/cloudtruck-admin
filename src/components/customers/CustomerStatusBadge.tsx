import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CustomerStatusBadgeProps {
  status: string;
}

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  const variants: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800',
    'blocked': 'bg-red-100 text-red-800',
    'pending': 'bg-yellow-100 text-yellow-800',
  };

  const variant = variants[status] || 'bg-gray-100 text-gray-800';

  return (
    <Badge variant="outline" className={cn('font-medium', variant)}>
      {status.toUpperCase()}
    </Badge>
  );
}
