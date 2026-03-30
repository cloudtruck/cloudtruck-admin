'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierCard } from '@/components/suppliers/SupplierCard';
import { DriverCard } from '@/components/drivers/DriverCard';
import { supplierApi, driverApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Supplier, Driver, Pagination } from '@/types';

function useCompanyApprovals() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await supplierApi.getAll({
        verificationStatus: 'documents-submitted',
        supplierType: 'company',
        page,
        limit: 20,
      });
      setSuppliers(response.data?.data?.items || []);
      setPagination(
        response.data?.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20,
        }
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to fetch pending suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(1);
  }, [fetch]);

  return { suppliers, pagination, loading, refetch: () => fetch(1), setPage: fetch };
}

function useIndividualKyc() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await driverApi.getAll({
        kycStatus: 'submitted',
        driverRole: 'individual',
        page,
        limit: 20,
      });
      setDrivers(response.data?.data?.drivers || []);
      setPagination(
        response.data?.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20,
        }
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to fetch individual KYC queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(1);
  }, [fetch]);

  return { drivers, pagination, loading, refetch: () => fetch(1), setPage: fetch };
}

function PaginationBar({
  pagination,
  onPageChange,
}: {
  pagination: Pagination;
  onPageChange: (p: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
      >
        Previous
      </Button>
      <div className="flex items-center px-4">
        <span className="text-sm text-muted-foreground">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
      </div>
      <Button
        variant="outline"
        onClick={() => onPageChange(pagination.currentPage + 1)}
        disabled={pagination.currentPage === pagination.totalPages}
      >
        Next
      </Button>
    </div>
  );
}

export default function SupplierApprovalsPage() {
  const company = useCompanyApprovals();
  const individual = useIndividualKyc();

  const handleRefresh = () => {
    company.refetch();
    individual.refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Approvals"
        description="Review and verify pending supplier and driver registrations"
        actions={
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            Company Verification
            {company.pagination.totalItems > 0 && (
              <Badge variant="secondary" className="ml-1">
                {company.pagination.totalItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="individual" className="gap-2">
            Individual KYC
            {individual.pagination.totalItems > 0 && (
              <Badge variant="secondary" className="ml-1">
                {individual.pagination.totalItems}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          {company.loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : company.suppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No pending company approvals</p>
              <p className="text-sm mt-1">All company registrations have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {company.suppliers.map((supplier) => (
                  <SupplierCard key={supplier._id} supplier={supplier} />
                ))}
              </div>
              <PaginationBar pagination={company.pagination} onPageChange={company.setPage} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          {individual.loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : individual.drivers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No pending individual KYC</p>
              <p className="text-sm mt-1">All individual driver verifications have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {individual.drivers.map((driver) => (
                  <DriverCard key={driver._id} driver={driver} />
                ))}
              </div>
              <PaginationBar pagination={individual.pagination} onPageChange={individual.setPage} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
