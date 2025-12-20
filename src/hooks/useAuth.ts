'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = true) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, requireAuth, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return { user, isAuthenticated, logout: handleLogout };
}

export function useRequireRole(allowedRoles: string[]) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, allowedRoles, router]);

  return user && allowedRoles.includes(user.role);
}
