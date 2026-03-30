'use client';

import { useState, useEffect } from 'react';
import { supplierApi } from '@/lib/api';
import { toast } from 'sonner';
import type { SupplierPaymentRecord, ApiErrorResponse } from '@/types';

interface PaymentFilters {
  supplierId?: string;
  bookingId?: string;
  status?: string;
  paymentType?: string;
  page?: number;
  limit?: number;
}

interface PaymentsPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export function useSupplierPayments(initialFilters?: PaymentFilters) {
  const [payments, setPayments] = useState<SupplierPaymentRecord[]>([]);
  const [pagination, setPagination] = useState<PaymentsPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [filters, setFilters] = useState<PaymentFilters>(initialFilters || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierApi.getPayments({
        ...filters,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      });
      setPayments(response.data.data.items);
      setPagination(response.data.data.pagination);
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      const message = e.response?.data?.message || 'Failed to fetch payments';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (data: {
    supplierId: string;
    bookingId: string;
    amount: number;
    paymentType: string;
    paymentMethod: string;
    remarks?: string;
  }): Promise<SupplierPaymentRecord | null> => {
    try {
      const response = await supplierApi.createPayment(data);
      if (response.data.success) {
        toast.success('Payment request created');
        await fetchPayments();
        return response.data.data;
      }
      return null;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to create payment');
      return null;
    }
  };

  const approvePayment = async (paymentId: string): Promise<boolean> => {
    try {
      const response = await supplierApi.approvePayment(paymentId);
      if (response.data.success) {
        toast.success('Payment approved');
        setPayments((prev) =>
          prev.map((p) => (p._id === paymentId ? { ...p, status: 'approved' as const } : p))
        );
        return true;
      }
      return false;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to approve payment');
      return false;
    }
  };

  const markPaid = async (
    paymentId: string,
    data: { referenceNumber: string; transactionDate?: string; remarks?: string }
  ): Promise<boolean> => {
    try {
      const response = await supplierApi.markPaid(paymentId, data);
      if (response.data.success) {
        toast.success('Payment marked as paid');
        setPayments((prev) =>
          prev.map((p) => (p._id === paymentId ? { ...p, status: 'paid' as const } : p))
        );
        return true;
      }
      return false;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to mark payment as paid');
      return false;
    }
  };

  const rejectPayment = async (paymentId: string, reason: string): Promise<boolean> => {
    try {
      const response = await supplierApi.rejectPayment(paymentId, reason);
      if (response.data.success) {
        toast.success('Payment rejected');
        setPayments((prev) =>
          prev.map((p) => (p._id === paymentId ? { ...p, status: 'failed' as const } : p))
        );
        return true;
      }
      return false;
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to reject payment');
      return false;
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage]);

  return {
    payments,
    pagination,
    filters,
    loading,
    error,
    setFilters,
    refetch: fetchPayments,
    createPayment,
    approvePayment,
    markPaid,
    rejectPayment,
  };
}

export function useSupplierLedger(supplierId: string) {
  const [ledger, setLedger] = useState<SupplierPaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await supplierApi.getSupplierLedger(supplierId);
      setLedger(response.data.data.items || response.data.data);
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      const message = e.response?.data?.message || 'Failed to fetch ledger';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supplierId) fetchLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  return { ledger, loading, error, refetch: fetchLedger };
}
