'use client';

import { create } from 'zustand';
import type { Supplier, SupplierFilters, Pagination } from '@/types';

interface SupplierState {
  suppliers: Supplier[];
  filters: SupplierFilters;
  pagination: Pagination;
  selectedSupplier: Supplier | null;
  setSuppliers: (suppliers: Supplier[]) => void;
  setFilters: (filters: SupplierFilters) => void;
  setPagination: (pagination: Pagination) => void;
  setSelectedSupplier: (supplier: Supplier | null) => void;
  clearFilters: () => void;
  updateSupplierInList: (supplierId: string, updates: Partial<Supplier>) => void;
}

export const useSupplierStore = create<SupplierState>((set) => ({
  suppliers: [],
  filters: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  selectedSupplier: null,

  setSuppliers: (suppliers) => set({ suppliers }),

  setFilters: (filters) => set({ filters }),

  setPagination: (pagination) => set({ pagination }),

  setSelectedSupplier: (supplier) => set({ selectedSupplier: supplier }),

  clearFilters: () => set({ filters: {} }),

  updateSupplierInList: (supplierId, updates) =>
    set((state) => ({
      suppliers: state.suppliers.map((supplier) =>
        supplier._id === supplierId ? { ...supplier, ...updates } : supplier
      ),
    })),
}));
