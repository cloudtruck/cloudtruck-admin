'use client';

import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api';
import { useBookingStore } from '@/store/bookingStore';
import { toast } from 'sonner';

export function useBookings() {
  const { bookings, filters, pagination, setBookings, setPagination } = useBookingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingApi.getAll({
        ...filters,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      });
      setBookings(response.data.data.bookings);
      setPagination(response.data.data.pagination);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Failed to fetch bookings';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filters, pagination.currentPage]);

  return { bookings, loading, error, refetch: fetchBookings };
}

export function useBookingById(id: string) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await bookingApi.getById(id);
        setBooking(response.data.data);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        const message = error.response?.data?.message || 'Failed to fetch booking';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBooking();
    }
  }, [id]);

  return { booking, loading, error };
}
