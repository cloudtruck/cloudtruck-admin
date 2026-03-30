import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SupplierStatusBadgeProps {
  status: 'pending' | 'documents-submitted' | 'verified' | 'rejected';
  className?: string;
}

export function SupplierStatusBadge({ status, className }: SupplierStatusBadgeProps) {
  const variants: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'documents-submitted': 'bg-blue-100 text-blue-800 border-blue-200',
    verified: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    'documents-submitted': 'Docs Submitted',
    verified: 'Verified',
    rejected: 'Rejected',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', variants[status], className)}>
      {labels[status] ?? status}
    </Badge>
  );
}
