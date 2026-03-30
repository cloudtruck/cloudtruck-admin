'use client';

import { use, useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { DriverProfile } from '@/components/drivers/DriverProfile';
import { DriverDocuments } from '@/components/drivers/DriverDocuments';
import { DriverVehicles } from '@/components/drivers/DriverVehicles';
import { DriverTripHistory } from '@/components/drivers/DriverTripHistory';
import { DriverActions } from '@/components/drivers/DriverActions';
import { DriverBankDetails } from '@/components/drivers/DriverBankDetails';
import { driverApi } from '@/lib/api';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { Driver } from '@/types';

interface DriverDetailPageProps {
  params: Promise<{ id: string }>;
}

const DRIVER_TABS = ['overview', 'documents', 'vehicles', 'trips', 'account'] as const;
type DriverTab = (typeof DRIVER_TABS)[number];

function DriverDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  const rawTab = searchParams.get('tab') ?? 'overview';
  const activeTab: DriverTab = (DRIVER_TABS as readonly string[]).includes(rawTab)
    ? (rawTab as DriverTab)
    : 'overview';

  const setTab = (tab: DriverTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    fetchDriver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDriver = async () => {
    setLoading(true);
    try {
      const response = await driverApi.getById(id);
      setDriver(response.data.data);
    } catch (error: unknown) {
      logger.error('Failed to fetch driver:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch driver');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!driver) {
    return (
      <PageHeader
        title="Driver Not Found"
        description="The driver you are looking for does not exist"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={driver.name}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={fetchDriver} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <DriverActions driver={driver} onSuccess={fetchDriver} />
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setTab(v as DriverTab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <DriverProfile driver={driver} onSuccess={fetchDriver} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DriverDocuments driver={driver} />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6">
          <DriverVehicles driverId={driver._id} />
        </TabsContent>

        <TabsContent value="trips" className="mt-6">
          <DriverTripHistory driverId={driver._id} />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <DriverBankDetails driver={driver} onSuccess={fetchDriver} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <DriverDetailContent id={id} />
    </Suspense>
  );
}
