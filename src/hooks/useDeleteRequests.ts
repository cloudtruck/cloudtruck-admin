import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { deleteRequestsApi } from '@/lib/api';
import type { DeleteRequest, DeleteRequestPagination } from '@/types';

interface UseDeleteRequestsOptions {
  status?: string;
  resource?: string;
  autoFetch?: boolean;
}

export function useDeleteRequests(options: UseDeleteRequestsOptions = {}) {
  const { status = 'pending', resource, autoFetch = true } = options;
  const [items, setItems] = useState<DeleteRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchPending = useCallback(async (params?: { page?: number; limit?: number }) => {
    try {
      setLoading(true);
      const res = await deleteRequestsApi.listPending({ status, resource, ...params });
      if (res.data.success) {
        const payload = res.data.data as DeleteRequestPagination;
        setItems(payload.items);
        setTotal(payload.pagination.total);
      }
    } catch {
      toast.error('Failed to fetch delete requests');
    } finally {
      setLoading(false);
    }
  }, [status, resource]);

  const fetchMine = useCallback(async (params?: { page?: number; limit?: number }) => {
    try {
      setLoading(true);
      const res = await deleteRequestsApi.listMine({ status, ...params });
      if (res.data.success) {
        const payload = res.data.data as DeleteRequestPagination;
        setItems(payload.items);
        setTotal(payload.pagination.total);
      }
    } catch {
      toast.error('Failed to fetch your delete requests');
    } finally {
      setLoading(false);
    }
  }, [status]);

  const approve = async (id: string) => {
    try {
      await deleteRequestsApi.approve(id);
      toast.success('Delete request approved — resource has been deleted');
      await fetchPending();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to approve delete request');
    }
  };

  const reject = async (id: string, rejectionReason: string) => {
    try {
      await deleteRequestsApi.reject(id, rejectionReason);
      toast.success('Delete request rejected');
      await fetchPending();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to reject delete request');
    }
  };

  const createDeleteRequest = async (data: {
    resource: string;
    resourceId: string;
    resourceModel: string;
    reason?: string;
  }) => {
    try {
      await deleteRequestsApi.create(data);
      toast.success('Delete request submitted for approval');
      return true;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Failed to submit delete request');
      return false;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPending();
    }
  }, [autoFetch, fetchPending]);

  return { items, loading, total, fetchPending, fetchMine, approve, reject, createDeleteRequest };
}
