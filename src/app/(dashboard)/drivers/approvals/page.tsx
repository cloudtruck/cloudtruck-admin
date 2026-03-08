'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DriverCard } from '@/components/drivers/DriverCard';
import { driverApi } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Driver, Pagination } from '@/types';

export default function DriverApprovalsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  const fetchPendingDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await driverApi.getAll({
        kycStatus: 'submitted',
        page: pagination.currentPage,
        limit: 20,
      });
      setDrivers(response.data?.data?.drivers || []);
      setPagination(response.data?.data?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
      });
    } catch (error: unknown) {
      console.error('Failed to fetch pending drivers:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch pending drivers');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage]);

  useEffect(() => {
    fetchPendingDrivers();
  }, [fetchPendingDrivers]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Driver Approvals"
          description="Review and approve pending driver registrations"
        />
        <div className="flex justify-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Approvals"
        description={`${pagination.totalItems} pending driver registration${
          pagination.totalItems !== 1 ? 's' : ''
        }`}
        actions={
          <Button onClick={fetchPendingDrivers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {drivers?.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium">No pending approvals</p>
            <p className="text-sm mt-1">All driver registrations have been reviewed</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => (
              <DriverCard key={driver._id} driver={driver} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
                }
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
                onClick={() =>
                  setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
                }
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
