'use client';

import { cn } from '@/lib/utils';
import { Bell, Package, CreditCard, Truck, FileText, AlertCircle } from 'lucide-react';

interface NotificationIconProps {
  type: string;
}

export function NotificationIcon({ type }: NotificationIconProps) {
  const iconMap: Record<string, { icon: React.ReactNode; className: string }> = {
    'booking-created': {
      icon: <Package className="h-4 w-4" />,
      className: 'bg-blue-100 text-blue-600',
    },
    'driver-assigned': {
      icon: <Truck className="h-4 w-4" />,
      className: 'bg-green-100 text-green-600',
    },
    'status-updated': {
      icon: <AlertCircle className="h-4 w-4" />,
      className: 'bg-purple-100 text-purple-600',
    },
    'payment-received': {
      icon: <CreditCard className="h-4 w-4" />,
      className: 'bg-yellow-100 text-yellow-600',
    },
    'pod-uploaded': {
      icon: <FileText className="h-4 w-4" />,
      className: 'bg-orange-100 text-orange-600',
    },
    'default': {
      icon: <Bell className="h-4 w-4" />,
      className: 'bg-gray-100 text-gray-600',
    },
  };

  const { icon, className } = iconMap[type] || iconMap['default'];

  return (
    <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', className)}>
      {icon}
    </div>
  );
}
