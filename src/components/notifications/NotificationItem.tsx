'use client';

import { Card } from '@/components/ui/card';
import { NotificationIcon } from './NotificationIcon';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  return (
    <Card
      className={cn(
        'p-4 cursor-pointer hover:bg-accent/50 transition-colors',
        !notification.read && 'bg-accent/30'
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <NotificationIcon type={notification.type} />
        <div className="flex-1 space-y-1">
          <p className={cn('text-sm', !notification.read && 'font-semibold')}>
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-primary mt-2" />
        )}
      </div>
    </Card>
  );
}
