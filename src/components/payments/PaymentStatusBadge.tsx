import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PaymentStatusBadgeProps {
  status: 'unpaid' | 'partial' | 'paid' | 'failed';
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const variants = {
    unpaid: 'bg-red-100 text-red-800 border-red-200',
    partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const labels = {
    unpaid: 'Unpaid',
    partial: 'Partial',
    paid: 'Paid',
    failed: 'Failed',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', variants[status], className)}>
      {labels[status]}
    </Badge>
  );
}
