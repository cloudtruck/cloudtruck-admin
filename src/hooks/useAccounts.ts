import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { accountApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Account, ApiErrorResponse } from '@/types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountApi.list();

      if (response.data.success) {
        setAccounts(response.data.data || []);
      }
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to fetch accounts');
      logger.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (data: Partial<Account>) => {
    try {
      const response = await accountApi.create(data);

      if (response.data.success) {
        toast.success('Account created successfully');
        await fetchAccounts();
        return response.data.data;
      }
      return null;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to create account');
      return null;
    }
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    try {
      const response = await accountApi.update(id, data);

      if (response.data.success) {
        toast.success('Account updated successfully');
        await fetchAccounts();
        return response.data.data;
      }
      return null;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update account');
      return null;
    }
  };

  const setPrimaryAccount = async (id: string) => {
    try {
      const response = await accountApi.setPrimary(id);

      if (response.data.success) {
        toast.success('Primary account updated successfully');
        await fetchAccounts();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to set primary account');
      return false;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const response = await accountApi.delete(id);

      if (response.data.success) {
        toast.success('Account deleted successfully');
        await fetchAccounts();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to delete account');
      return false;
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return {
    accounts,
    loading,
    refetch: fetchAccounts,
    createAccount,
    updateAccount,
    setPrimaryAccount,
    deleteAccount,
  };
}
