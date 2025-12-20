'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { notificationApi } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCheck, RefreshCw } from 'lucide-react';

interface Notification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  useEffect(() => {
    fetchNotifications();
  }, [filter, pagination.currentPage]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; read?: boolean } = {
        page: pagination.currentPage,
        limit: 20,
      };

      if (filter === 'unread') {
        params.read = false;
      } else if (filter === 'read') {
        params.read = true;
      }

      const response = await notificationApi.getAll(params);
      setNotifications(response.data.data.notifications);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="View and manage your notifications"
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="default" size="sm">
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            )}
            <Button onClick={fetchNotifications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="flex items-center justify-between">
        <Select value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread' | 'read')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notifications</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
            <SelectItem value="read">Read Only</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground">
          {unreadCount > 0 && `${unreadCount} unread`}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : notifications.length > 0 ? (
        <>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClick={() => !notification.read && handleMarkAsRead(notification._id)}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <CheckCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-sm text-muted-foreground">
            {filter === 'unread'
              ? "You're all caught up!"
              : 'You have no notifications yet'}
          </p>
        </div>
      )}
    </div>
  );
}
