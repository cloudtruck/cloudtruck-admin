'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyPaymentTable } from '@/components/suppliers/CompanyPaymentTable';
import { supplierApi } from '@/lib/api';
import { toast } from 'sonner';
import type { SupplierPaymentRecord, Pagination } from '@/types';

function usePayments(status?: string) {
  const [payments, setPayments] = useState<SupplierPaymentRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [loading, setLoading] = useState(false);

  const fetchPayments = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page, limit: 20 };
        if (status) params.status = status;
        const res = await supplierApi.getPayments(params);
        setPayments(res.data.data.items || []);
        setPagination(
          res.data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 20,
          }
        );
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        toast.error(e.response?.data?.message || 'Failed to fetch payments');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status]
  );

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  return {
    payments,
    pagination,
    loading,
    refetch: () => fetchPayments(1),
    setPage: (p: number) => fetchPayments(p),
  };
}

export default function SupplierPayoutsPage() {
  const pending = usePayments('pending');
  const approved = usePayments('approved');
  const all = usePayments();

  const handleRefreshAll = () => {
    pending.refetch();
    approved.refetch();
    all.refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Payouts"
        description="Manage supplier payment requests — two-step: approve then mark paid"
        actions={
          <Button onClick={handleRefreshAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Approval
            {pending.pagination.totalItems > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pending.pagination.totalItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            Approved
            {approved.pagination.totalItems > 0 && (
              <Badge variant="secondary" className="ml-1">
                {approved.pagination.totalItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <CompanyPaymentTable
            payments={pending.payments}
            loading={pending.loading}
            pagination={pending.pagination}
            onPageChange={pending.setPage}
            onRefresh={pending.refetch}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <CompanyPaymentTable
            payments={approved.payments}
            loading={approved.loading}
            pagination={approved.pagination}
            onPageChange={approved.setPage}
            onRefresh={approved.refetch}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <CompanyPaymentTable
            payments={all.payments}
            loading={all.loading}
            pagination={all.pagination}
            onPageChange={all.setPage}
            onRefresh={all.refetch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
