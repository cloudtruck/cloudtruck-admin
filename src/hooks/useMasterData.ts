import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { masterDataApi } from '@/lib/api';
import { toast } from 'sonner';
import type { MasterData, ApiErrorResponse } from '@/types';

export function useMasterData(category?: string) {
  const [data, setData] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = category
        ? await masterDataApi.getByCategory(category)
        : await masterDataApi.list();

      if (response.data.success) {
        setData(response.data.data || []);
      }
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to fetch master data');
      logger.error('Error fetching master data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (itemData: Partial<MasterData> | FormData) => {
    try {
      const response = await masterDataApi.create(itemData);

      if (response.data?.success) {
        toast.success('Master data created successfully');
        await fetchData();
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create master data');
      return null;
    }
  };

  const updateItem = async (id: string, itemData: Partial<MasterData> | FormData) => {
    try {
      const response = await masterDataApi.update(id, itemData);

      if (response.data?.success) {
        toast.success('Master data updated successfully');
        await fetchData();
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update master data');
      return null;
    }
  };

  const reorderItems = async (items: Array<{ id: string; displayOrder: number }>) => {
    try {
      const response = await masterDataApi.reorder(items);

      if (response.data.success) {
        toast.success('Display order updated successfully');
        await fetchData();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update order');
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const response = await masterDataApi.delete(id);

      if (response.status === 200) {
        return response;
      }

      if (response.data.success) {
        toast.success('Master data deleted successfully');
        await fetchData();
      }
      return response;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to delete master data');
      return null;
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return {
    data,
    loading,
    refetch: fetchData,
    createItem,
    updateItem,
    reorderItems,
    deleteItem,
  };
}
