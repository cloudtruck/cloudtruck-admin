'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  MapPin,
  DollarSign,
  FileText,
  Settings,
  ChevronDown,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Bookings',
    href: '/bookings',
    icon: Package,
    children: [
      { label: 'All Bookings', href: '/bookings', icon: Package },
      { label: 'New Requests', href: '/bookings/new-requests', icon: Package },
    ],
  },
  {
    label: 'Drivers',
    href: '/drivers',
    icon: Users,
    children: [
      { label: 'All Drivers', href: '/drivers', icon: Users },
      { label: 'Available Drivers', href: '/drivers/available', icon: Users },
      { label: 'Approvals', href: '/drivers/approvals', icon: Users },
    ],
  },
  {
    label: 'Vehicles',
    href: '/vehicles',
    icon: Truck,
  },
  {
    label: 'Tracking',
    href: '/tracking',
    icon: MapPin,
    children: [
      { label: 'Live Trips', href: '/tracking/live-trips', icon: MapPin },
      { label: 'Map View', href: '/tracking/map', icon: MapPin },
    ],
  },
  {
    label: 'Payments',
    href: '/payments',
    icon: DollarSign,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="space-y-1 p-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.label);
        const active = isActive(item.href);

        return (
          <div key={item.label}>
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(item.label)}
                className={cn(
                  'w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-zinc-900 text-white **:text-white!'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-zinc-900 text-white **:text-white!'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )}

            {/* Children */}
            {hasChildren && isExpanded && (
              <div className="mt-1 ml-6 space-y-1 border-l-2 border-border pl-2">
                {item.children?.map((child) => {
                  const ChildIcon = child.icon;
                  const childActive = pathname === child.href;

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        childActive
                          ? 'bg-zinc-900 text-white **:text-white!'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <ChildIcon className="h-3 w-3" />
                      <span>{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
