'use client';

import { useAuth } from '@/hooks/useAuth';
import { TopNav } from '@/components/layout/TopNav';
import { Truck } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAuth(true);

  if (!isHydrated || (isHydrated && !user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 animate-pulse" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopNav />
      <main className="relative flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-4 md:p-6">{children}</main>
    </div>
  );
}
