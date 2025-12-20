'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { notificationApi } from '@/lib/api';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.getAll({ page: 1, limit: 5 });
      setNotifications(response.data?.data?.notifications || []);
    } catch (error: unknown) {
      // Silently fail if notification API doesn't exist yet (404) or network error
      const err = error as { response?: { status?: number }; message?: string };
      if (err.response?.status !== 404 && err.message !== 'Network Error') {
        console.error('Failed to fetch notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.data?.data?.count || 0);
    } catch (error: unknown) {
      // Silently fail if notification API doesn't exist yet (404) or network error
      const err = error as { response?: { status?: number }; message?: string };
      if (err.response?.status !== 404 && err.message !== 'Network Error') {
        console.error('Failed to fetch unread count:', error);
      }
    }
  };

  const handleNotificationClick = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error: unknown) {
      console.error('Failed to mark as read:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error: unknown) {
      console.error('Failed to mark all as read:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to mark all as read');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-0 text-xs font-normal hover:underline"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-[200px]">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-2 p-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification._id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center px-4">
              <Bell className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/notifications')}
              >
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
