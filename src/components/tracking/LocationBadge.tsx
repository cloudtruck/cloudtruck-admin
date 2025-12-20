import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationBadgeProps {
  city: string;
  lastUpdated?: string;
  className?: string;
}

export function LocationBadge({ city, lastUpdated, className }: LocationBadgeProps) {
  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <MapPin className="h-3 w-3" />
      {city}
      {lastUpdated && <span className="text-xs opacity-70">• {lastUpdated}</span>}
    </Badge>
  );
}
