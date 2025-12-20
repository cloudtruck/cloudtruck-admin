'use client';

import { create } from 'zustand';
import type { Driver, DriverFilters, Pagination } from '@/types';

interface DriverState {
  drivers: Driver[];
  filters: DriverFilters;
  pagination: Pagination;
  selectedDriver: Driver | null;
  setDrivers: (drivers: Driver[]) => void;
  setFilters: (filters: DriverFilters) => void;
  setPagination: (pagination: Pagination) => void;
  setSelectedDriver: (driver: Driver | null) => void;
  clearFilters: () => void;
  updateDriverInList: (driverId: string, updates: Partial<Driver>) => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  drivers: [],
  filters: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  selectedDriver: null,

  setDrivers: (drivers) => set({ drivers }),

  setFilters: (filters) => set({ filters }),

  setPagination: (pagination) => set({ pagination }),

  setSelectedDriver: (driver) => set({ selectedDriver: driver }),

  clearFilters: () => set({ filters: {} }),

  updateDriverInList: (driverId, updates) =>
    set((state) => ({
      drivers: state.drivers.map((driver) =>
        driver._id === driverId ? { ...driver, ...updates } : driver
      ),
    })),
}));
