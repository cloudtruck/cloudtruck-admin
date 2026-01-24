'use client';

import { create } from 'zustand';
import type { EwayBill, EwayBillFilters, Pagination } from '@/types';

interface EwayBillState {
  ewayBills: EwayBill[];
  filters: EwayBillFilters;
  pagination: Pagination;
  selectedBill: EwayBill | null;
  createModalOpen: boolean;
  updateModalOpen: boolean;
  detailsModalOpen: boolean;
  loading: boolean;
  error: string | null;
  prefilledBookingId?: string;

  // Actions
  setEwayBills: (ewayBills: EwayBill[]) => void;
  addEwayBill: (ewayBill: EwayBill) => void;
  updateEwayBill: (id: string, updates: Partial<EwayBill>) => void;
  setFilters: (filters: EwayBillFilters) => void;
  clearFilters: () => void;
  setPagination: (pagination: Pagination) => void;
  setSelectedBill: (bill: EwayBill | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Modal controls
  openCreateModal: (prefilledBookingId?: string) => void;
  openUpdateModal: (bill: EwayBill) => void;
  openDetailsModal: (bill: EwayBill) => void;
  closeCreateModal: () => void;
  closeUpdateModal: () => void;
  closeDetailsModal: () => void;
  closeAllModals: () => void;
}

export const useEwayBillStore = create<EwayBillState>((set) => ({
  ewayBills: [],
  filters: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  selectedBill: null,
  createModalOpen: false,
  updateModalOpen: false,
  detailsModalOpen: false,
  loading: false,
  error: null,
  prefilledBookingId: undefined,

  setEwayBills: (ewayBills) => set({ ewayBills }),

  addEwayBill: (ewayBill) =>
    set((state) => ({
      ewayBills: [ewayBill, ...state.ewayBills],
    })),

  updateEwayBill: (id, updates) =>
    set((state) => ({
      ewayBills: state.ewayBills.map((bill) =>
        bill._id === id ? { ...bill, ...updates } : bill
      ),
      selectedBill:
        state.selectedBill?._id === id
          ? { ...state.selectedBill, ...updates }
          : state.selectedBill,
    })),

  setFilters: (filters) => set({ filters }),

  clearFilters: () => set({ filters: {} }),

  setPagination: (pagination) => set({ pagination }),

  setSelectedBill: (bill) => set({ selectedBill: bill }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  openCreateModal: (prefilledBookingId) =>
    set({
      createModalOpen: true,
      prefilledBookingId,
      selectedBill: null,
    }),

  openUpdateModal: (bill) =>
    set({
      updateModalOpen: true,
      selectedBill: bill,
    }),

  openDetailsModal: (bill) =>
    set({
      detailsModalOpen: true,
      selectedBill: bill,
    }),

  closeCreateModal: () =>
    set({
      createModalOpen: false,
      prefilledBookingId: undefined,
    }),

  closeUpdateModal: () =>
    set({
      updateModalOpen: false,
    }),

  closeDetailsModal: () =>
    set({
      detailsModalOpen: false,
    }),

  closeAllModals: () =>
    set({
      createModalOpen: false,
      updateModalOpen: false,
      detailsModalOpen: false,
      selectedBill: null,
      prefilledBookingId: undefined,
    }),
}));
