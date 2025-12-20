import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface KycStatusBadgeProps {
  status: string;
}

export function KycStatusBadge({ status }: KycStatusBadgeProps) {
  const variants: Record<string, { className: string; icon: React.ReactNode }> = {
    'verified': {
      className: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    'pending': {
      className: 'bg-yellow-100 text-yellow-800',
      icon: <Clock className="h-3 w-3" />,
    },
    'rejected': {
      className: 'bg-red-100 text-red-800',
      icon: <XCircle className="h-3 w-3" />,
    },
    'not-submitted': {
      className: 'bg-gray-100 text-gray-800',
      icon: <AlertCircle className="h-3 w-3" />,
    },
  };

  const variant = variants[status] || variants['not-submitted'];

  return (
    <Badge variant="outline" className={cn('font-medium flex items-center gap-1', variant.className)}>
      {variant.icon}
      {status.replace(/-/g, ' ').toUpperCase()}
    </Badge>
  );
}
