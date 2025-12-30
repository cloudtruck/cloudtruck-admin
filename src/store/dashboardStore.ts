'use client';

import { create } from 'zustand';
import type { BookingStats } from '@/types';

interface DashboardState {
  stats: BookingStats;
  loading: boolean;
  setStats: (stats: BookingStats) => void;
  setLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: {
    newRequests: 0,
    assigned: 0,
    inTransit: 0,
    delivered: 0,
    podPending: 0,
    cancelled: 0,
    total: 0,
    newRequestsChange: { value: 0, isPositive: false },
    assignedChange: { value: 0, isPositive: false },
    inTransitChange: { value: 0, isPositive: false },
    deliveredChange: { value: 0, isPositive: false },
    podPendingChange: { value: 0, isPositive: false }
  },
  loading: false,

  setStats: (stats) => set({ stats }),
  
  setLoading: (loading) => set({ loading }),
}));
