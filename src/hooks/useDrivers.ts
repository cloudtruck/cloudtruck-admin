'use client';

import { useState, useEffect } from 'react';
import { driverApi } from '@/lib/api';
import { useDriverStore } from '@/store/driverStore';
import { toast } from 'sonner';
import type { Driver } from '@/types';

export function useDrivers() {
  const { drivers, filters, pagination, setDrivers, setPagination } = useDriverStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await driverApi.getAll({
        ...filters,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      });
      setDrivers(response.data.data.drivers);
      setPagination(response.data.data.pagination);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Failed to fetch drivers';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [filters, pagination.currentPage]);

  return { drivers, loading, error, refetch: fetchDrivers };
}

export function useAvailableDrivers(params?: { truckType?: string; city?: string; lat?: number; lng?: number }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await driverApi.getAvailable(params);
      setDrivers(response.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || 'Failed to fetch available drivers';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableDrivers();
  }, [JSON.stringify(params)]);

  return { drivers, loading, error, refetch: fetchAvailableDrivers };
}
