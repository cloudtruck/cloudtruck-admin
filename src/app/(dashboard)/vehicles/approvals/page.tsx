'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { vehicleApi } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Vehicle, Pagination } from '@/types';

export default function VehicleApprovalsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  const fetchPendingVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await vehicleApi.getAll({
        verificationStatus: 'pending',
        page: pagination.currentPage,
        limit: 20,
      });
      setVehicles(response.data?.data?.vehicles || []);
      setPagination(response.data?.data?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
      });
    } catch (error: unknown) {
      console.error('Failed to fetch pending vehicles:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch pending vehicles');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage]);

  useEffect(() => {
    fetchPendingVehicles();
  }, [fetchPendingVehicles]);

  const handleRefresh = () => {
    fetchPendingVehicles();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vehicle Approvals"
          description="Review and approve new vehicle registrations"
        />
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Approvals"
        description="Review and approve new vehicle registrations"
        actions={
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {vehicles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No pending vehicle approvals</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle._id} vehicle={vehicle} onSuccess={fetchPendingVehicles} />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}