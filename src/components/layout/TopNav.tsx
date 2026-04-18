'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Truck, Plus, LogOut, Settings } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Indents', href: '/indents' },
  { label: 'Trips', href: '/trips' },
  { label: 'E-way Bill', href: '/eway-bills' },
  { label: 'Customers', href: '/customers' },
  { label: 'Suppliers', href: '/suppliers' },
  { label: 'Trucks', href: '/vehicles' },
  { label: 'Organisation', href: '/organization' },
  { label: 'Analytics', href: '/reports' },
];

export function TopNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/suppliers')
      return pathname.startsWith('/suppliers') || pathname.startsWith('/drivers');
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center h-14 px-4 gap-4">
        {/* Logo + Brand */}
        <div className="flex items-center gap-2 text-gray-900 shrink-0 mr-2">
          <Truck className="h-5 w-5 text-blue-600" />
          <span className="text-base font-bold text-gray-900">Cloudtruck</span>
        </div>

        {/* + Indent Button */}
        <Button
          size="sm"
          onClick={() => router.push('/bookings/create')}
          className="relative z-10 bg-gray-900 hover:bg-gray-700 text-white shrink-0 h-7 px-3 text-xs font-semibold rounded-full"
        >
          <Plus className="h-3 w-3 mr-1" />
          Indent
        </Button>

        {/* Nav Items */}
        <nav className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors',
                isActive(item.href)
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600 rounded-none pb-3 -mb-px'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-8">
                <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {(user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
