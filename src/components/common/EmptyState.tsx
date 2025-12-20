import { FileX, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function EmptyState({
  title = 'No data found',
  description = 'There are no items to display.',
  icon: Icon,
}: EmptyStateProps) {
  const IconComponent = Icon || FileX;
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <IconComponent className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
