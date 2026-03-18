'use client';

import { useCallback, useEffect, useState } from 'react';
import { useEwayBillStore } from '@/store/ewayBillStore';
import { ewayBillApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import EwayBillsTable from '@/components/ewayBills/EwayBillsTable';
import CreateEwayBillModal from '@/components/ewayBills/CreateEwayBillModal';
import UpdatePartBModal from '@/components/ewayBills/UpdatePartBModal';
import EwayBillDetailsModal from '@/components/ewayBills/EwayBillDetailsModal';
import FindEwayBillModal from '@/components/ewayBills/FindEwayBillModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TabValue = 'part-b-pending' | 'active' | 'expiring' | 'expired' | 'manual-override';

const TABS: { label: string; value: TabValue }[] = [
  { label: 'Part-B Pending', value: 'part-b-pending' },
  { label: 'Active', value: 'active' },
  { label: 'Expiring', value: 'expiring' },
  { label: 'Expired', value: 'expired' },
  { label: 'Manual', value: 'manual-override' },
];

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
    openFindModal,
  } = useEwayBillStore();

  const fetchEwayBills = useCallback(
    async (tab: TabValue) => {
      setLoading(true);
      setError(null);
      try {
        const queryParams: Record<string, string | number | undefined> = {
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
          ...filters,
        };
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
        if (response.data.success && response.data.data) {
          setEwayBills(response.data.data.ewayBills || []);
          setPagination(
            response.data.data.pagination || {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              itemsPerPage: 20,
            }
          );
        }
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } };
        const errorMsg = err.response?.data?.message || 'Failed to fetch E-way bills';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [
      filters,
      pagination.currentPage,
      pagination.itemsPerPage,
      setEwayBills,
      setError,
      setLoading,
      setPagination,
    ]
  );

  useEffect(() => {
    fetchEwayBills(activeTab);
  }, [activeTab, fetchEwayBills]);

  const handleRefresh = () => fetchEwayBills(activeTab);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Tabs + Find button */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                activeTab === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-8 px-4"
          onClick={() => openFindModal()}
        >
          Find Eway-bill
        </Button>
      </div>

      {/* Table */}
      <EwayBillsTable tab={activeTab} />

      {/* Modals */}
      <CreateEwayBillModal onSuccessAction={handleRefresh} />
      <UpdatePartBModal onSuccessAction={handleRefresh} />
      <EwayBillDetailsModal />
      <FindEwayBillModal onSuccessAction={handleRefresh} />
    </div>
  );
}
