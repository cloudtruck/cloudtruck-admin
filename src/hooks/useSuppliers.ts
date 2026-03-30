'use client';

import { useState, useEffect } from 'react';
import { supplierApi } from '@/lib/api';
import { useSupplierStore } from '@/store/supplierStore';
import { toast } from 'sonner';
import type { Supplier, CreateSupplierPayload, ApiErrorResponse } from '@/types';

export function useSuppliers() {
  const { suppliers, filters, pagination, setSuppliers, setPagination, updateSupplierInList } =
    useSupplierStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierApi.getAll({
        ...filters,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      });
      setSuppliers(response.data.data.items);
      setPagination(response.data.data.pagination);
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      const message = e.response?.data?.message || 'Failed to fetch suppliers';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (data: CreateSupplierPayload): Promise<Supplier | null> => {
    try {
      const response = await supplierApi.create(data);
      if (response.data.success) {
        toast.success('Supplier created successfully');
        await fetchSuppliers();
        return response.data.data;
      }
      return null;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to create supplier');
      return null;
    }
  };

  const updateSupplier = async (
    id: string,
    data: Partial<CreateSupplierPayload>
  ): Promise<Supplier | null> => {
    try {
      const response = await supplierApi.update(id, data);
      if (response.data.success) {
        toast.success('Supplier updated successfully');
        updateSupplierInList(id, response.data.data);
        return response.data.data;
      }
      return null;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to update supplier');
      return null;
    }
  };

  const verifySupplier = async (id: string): Promise<boolean> => {
    try {
      const response = await supplierApi.verify(id);
      if (response.data.success) {
        toast.success('Supplier verified');
        updateSupplierInList(id, { verificationStatus: 'verified' });
        return true;
      }
      return false;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to verify supplier');
      return false;
    }
  };

  const rejectSupplier = async (id: string, reason: string): Promise<boolean> => {
    try {
      const response = await supplierApi.reject(id, reason);
      if (response.data.success) {
        toast.success('Supplier rejected');
        updateSupplierInList(id, { verificationStatus: 'rejected', rejectionReason: reason });
        return true;
      }
      return false;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to reject supplier');
      return false;
    }
  };

  const blacklistSupplier = async (id: string, reason: string): Promise<boolean> => {
    try {
      const response = await supplierApi.blacklist(id, reason);
      if (response.data.success) {
        toast.success('Supplier blacklisted');
        updateSupplierInList(id, { isBlacklisted: true, blacklistReason: reason });
        return true;
      }
      return false;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to blacklist supplier');
      return false;
    }
  };

  const removeFromBlacklist = async (id: string): Promise<boolean> => {
    try {
      const response = await supplierApi.removeBlacklist(id);
      if (response.data.success) {
        toast.success('Supplier removed from blacklist');
        updateSupplierInList(id, { isBlacklisted: false, blacklistReason: undefined });
        return true;
      }
      return false;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to remove from blacklist');
      return false;
    }
  };

  useEffect(() => {
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage]);

  return {
    suppliers,
    loading,
    error,
    refetch: fetchSuppliers,
    createSupplier,
    updateSupplier,
    verifySupplier,
    rejectSupplier,
    blacklistSupplier,
    removeFromBlacklist,
  };
}

export function useSupplier(id: string) {
  const { updateSupplierInList } = useSupplierStore();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplier = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierApi.getById(id);
      setSupplier(response.data.data);
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      const message = e.response?.data?.message || 'Failed to fetch supplier';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const addDriverToFleet = async (driverId: string): Promise<boolean> => {
    try {
      const response = await supplierApi.addDriver(id, driverId);
      if (response.data.success) {
        toast.success('Driver added to fleet');
        await fetchSupplier();
        updateSupplierInList(id, response.data.data);
        return true;
      }
      return false;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to add driver to fleet');
      return false;
    }
  };

  const removeDriverFromFleet = async (driverId: string): Promise<boolean> => {
    try {
      const response = await supplierApi.removeDriver(id, driverId);
      if (response.data.success) {
        toast.success('Driver removed from fleet');
        await fetchSupplier();
        if (response.data.data) updateSupplierInList(id, response.data.data);
        return true;
      }
      return false;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to remove driver from fleet');
      return false;
    }
  };

  useEffect(() => {
    if (id) fetchSupplier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return {
    supplier,
    loading,
    error,
    refetch: fetchSupplier,
    addDriverToFleet,
    removeDriverFromFleet,
  };
}
