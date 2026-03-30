import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { branchApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Branch, ApiErrorResponse } from '@/types';

export function useBranches(filters?: { region?: string; isActive?: boolean }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await branchApi.list(filters);

      if (response.data.success) {
        setBranches(response.data.data || []);
      }
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to fetch branches');
      logger.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async (data: Partial<Branch>) => {
    try {
      const response = await branchApi.create(data);

      if (response.data.success) {
        toast.success('Branch created successfully');
        await fetchBranches();
        return response.data.data;
      }
      return null;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to create branch');
      return null;
    }
  };

  const updateBranch = async (id: string, data: Partial<Branch>) => {
    try {
      const response = await branchApi.update(id, data);

      if (response.data.success) {
        toast.success('Branch updated successfully');
        await fetchBranches();
        return response.data.data;
      }
      return null;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update branch');
      return null;
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      const response = await branchApi.delete(id);

      if (response.data.success) {
        toast.success('Branch deleted successfully');
        await fetchBranches();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to delete branch');
      return false;
    }
  };

  const assignEmployee = async (branchId: string, staffId: string) => {
    try {
      const response = await branchApi.assignEmployee(branchId, staffId);

      if (response.data.success) {
        toast.success('Employee assigned successfully');
        await fetchBranches();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to assign employee');
      return false;
    }
  };

  const removeEmployee = async (branchId: string, staffId: string) => {
    try {
      const response = await branchApi.removeEmployee(branchId, staffId);

      if (response.data.success) {
        toast.success('Employee removed successfully');
        await fetchBranches();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to remove employee');
      return false;
    }
  };

  const setBranchManager = async (branchId: string, staffId: string) => {
    try {
      const response = await branchApi.setBranchManager(branchId, staffId);
      if (response.data.success) {
        toast.success('Branch manager assigned');
        await fetchBranches();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to assign branch manager');
      return false;
    }
  };

  const setTrafficCoordinator = async (branchId: string, staffId: string) => {
    try {
      const response = await branchApi.setTrafficCoordinator(branchId, staffId);
      if (response.data.success) {
        toast.success('Traffic coordinator assigned');
        await fetchBranches();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to assign traffic coordinator');
      return false;
    }
  };

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.region, filters?.isActive]);

  return {
    branches,
    loading,
    refetch: fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    assignEmployee,
    removeEmployee,
    setBranchManager,
    setTrafficCoordinator,
  };
}
