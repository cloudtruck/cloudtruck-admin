import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { addressApi } from '@/lib/api';
import type { OrgAddress } from '@/types';

export function useAddress() {
  const [addresses, setAddresses] = useState<OrgAddress[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await addressApi.list();
      setAddresses(res.data.data ?? []);
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createAddress = async (data: Omit<OrgAddress, '_id' | 'isPrimary' | 'isActive'>) => {
    try {
      await addressApi.create(data);
      toast.success('Address added');
      await refetch();
      return true;
    } catch {
      toast.error('Failed to add address');
      return false;
    }
  };

  const updateAddress = async (id: string, data: Partial<OrgAddress>) => {
    try {
      await addressApi.update(id, data);
      toast.success('Address updated');
      await refetch();
      return true;
    } catch {
      toast.error('Failed to update address');
      return false;
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await addressApi.delete(id);
      toast.success('Address deleted');
      await refetch();
      return true;
    } catch {
      toast.error('Failed to delete address');
      return false;
    }
  };

  const setPrimaryAddress = async (id: string) => {
    try {
      await addressApi.setPrimary(id);
      toast.success('Primary address updated');
      await refetch();
      return true;
    } catch {
      toast.error('Failed to set primary address');
      return false;
    }
  };

  return {
    addresses,
    loading,
    refetch,
    createAddress,
    updateAddress,
    deleteAddress,
    setPrimaryAddress,
  };
}
