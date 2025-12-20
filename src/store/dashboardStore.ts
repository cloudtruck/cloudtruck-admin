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
    total: 0,
  },
  loading: false,

  setStats: (stats) => set({ stats }),
  
  setLoading: (loading) => set({ loading }),
}));
