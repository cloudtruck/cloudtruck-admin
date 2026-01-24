'use client';

import { useCallback, useEffect, useState } from 'react';
import { useEwayBillStore } from '@/store/ewayBillStore';
import { ewayBillApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import EwayBillsTable from '@/components/ewayBills/EwayBillsTable';
import EwayBillFilters from '@/components/ewayBills/EwayBillFilters';
import CreateEwayBillModal from '@/components/ewayBills/CreateEwayBillModal';
import UpdatePartBModal from '@/components/ewayBills/UpdatePartBModal';
import EwayBillDetailsModal from '@/components/ewayBills/EwayBillDetailsModal';
import { toast } from 'sonner';

type TabValue = 'part-b-pending' | 'active' | 'expiring' | 'expired' | 'manual-override';

export default function EwayBillsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('part-b-pending');
  const {
    setEwayBills,
    setPagination,
    setLoading,
    setError,
    filters,
    pagination,
    openCreateModal,
  } = useEwayBillStore();

  const canCreateEwayBill = user?.role === 'admin' || user?.role === 'super-admin';

  const fetchEwayBills = useCallback(async (tab: TabValue) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams: Record<string, string | number | undefined> = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters,
      };

      // Apply tab-specific filters
      switch (tab) {
        case 'part-b-pending':
          queryParams.partBStatus = 'pending';
          break;
        case 'active':
          queryParams.status = 'active';
          break;
        case 'expiring':
          queryParams.status = 'expiring';
          break;
        case 'expired':
          queryParams.status = 'expired';
          break;
        case 'manual-override':
          queryParams.partBStatus = 'manual-override';
          break;
      }

      const response = await ewayBillApi.getAll(queryParams);
      if (response.data.success) {
        setEwayBills(response.data.data.ewayBills);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || 'Failed to fetch E-way bills';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage, setEwayBills, setError, setLoading, setPagination]);

  useEffect(() => {
    fetchEwayBills(activeTab);
  }, [activeTab, fetchEwayBills]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  const handleRefresh = () => {
    fetchEwayBills(activeTab);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">E-way Bills</h1>
          <p className="text-muted-foreground mt-1">
            Manage E-way bills and Part-B vehicle updates
          </p>
        </div>
        {canCreateEwayBill && (
          <Button onClick={() => openCreateModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Create E-way Bill
          </Button>
        )}
      </div>

      {/* Filters */}
      <EwayBillFilters onRefreshAction={handleRefresh} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="part-b-pending">Part-B Pending</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expiring">Expiring (48h)</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="manual-override">Manual Override</TabsTrigger>
        </TabsList>

        <TabsContent value="part-b-pending" className="space-y-4">
          <EwayBillsTable />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <EwayBillsTable />
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <EwayBillsTable />
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <EwayBillsTable />
        </TabsContent>

        <TabsContent value="manual-override" className="space-y-4">
          <EwayBillsTable />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateEwayBillModal onSuccessAction={handleRefresh} />
      <UpdatePartBModal onSuccessAction={handleRefresh} />
      <EwayBillDetailsModal />
    </div>
  );
}
