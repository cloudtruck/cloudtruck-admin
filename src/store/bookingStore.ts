'use client';

import { create } from 'zustand';
import type { Booking, BookingFilters, Pagination } from '@/types';

interface BookingState {
  bookings: Booking[];
  filters: BookingFilters;
  pagination: Pagination;
  selectedBooking: Booking | null;
  setBookings: (bookings: Booking[]) => void;
  setFilters: (filters: BookingFilters) => void;
  setPagination: (pagination: Pagination) => void;
  setSelectedBooking: (booking: Booking | null) => void;
  clearFilters: () => void;
  updateBookingInList: (bookingId: string, updates: Partial<Booking>) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  filters: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  selectedBooking: null,

  setBookings: (bookings) => set({ bookings }),

  setFilters: (filters) => set({ filters }),

  setPagination: (pagination) => set({ pagination }),

  setSelectedBooking: (booking) => set({ selectedBooking: booking }),

  clearFilters: () => set({ filters: {} }),

  updateBookingInList: (bookingId, updates) =>
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking._id === bookingId ? { ...booking, ...updates } : booking
      ),
    })),
}));
