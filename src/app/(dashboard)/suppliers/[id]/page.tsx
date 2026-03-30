'use client';

import { use, useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { SupplierProfile } from '@/components/suppliers/SupplierProfile';
import { SupplierDocuments } from '@/components/suppliers/SupplierDocuments';
import { SupplierDriverList } from '@/components/suppliers/SupplierDriverList';
import { SupplierVehicleList } from '@/components/suppliers/SupplierVehicleList';
import { SupplierActions } from '@/components/suppliers/SupplierActions';
import { SupplierBankDetails } from '@/components/suppliers/SupplierBankDetails';
import { DriverProfile } from '@/components/drivers/DriverProfile';
import { DriverDocuments } from '@/components/drivers/DriverDocuments';
import { DriverVehicles } from '@/components/drivers/DriverVehicles';
import { DriverTripHistory } from '@/components/drivers/DriverTripHistory';
import { supplierApi, driverApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Supplier, Driver } from '@/types';

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

const COMPANY_TABS = ['overview', 'drivers', 'trucks', 'documents', 'account'] as const;
type CompanyTab = (typeof COMPANY_TABS)[number];

function SupplierDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  const rawTab = searchParams.get('tab') ?? 'overview';
  const activeTab: CompanyTab = (COMPANY_TABS as readonly string[]).includes(rawTab)
    ? (rawTab as CompanyTab)
    : 'overview';

  const setTab = (tab: CompanyTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    fetchSupplier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSupplier = async () => {
    setLoading(true);
    try {
      const response = await supplierApi.getById(id);
      const s: Supplier = response.data.data;
      setSupplier(s);

      // For individual suppliers, also fetch the linked driver record
      if (s.supplierType === 'individual' && s.driver?._id) {
        try {
          const driverRes = await driverApi.getById(s.driver._id);
          setDriver(driverRes.data.data);
        } catch {
          // driver fetch failure is non-fatal
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to fetch supplier');
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

  if (!supplier) {
    return (
      <PageHeader
        title="Supplier Not Found"
        description="The supplier you are looking for does not exist"
      />
    );
  }

  // ── Individual supplier layout ──────────────────────────────────────────────
  if (supplier.supplierType === 'individual') {
    return (
      <div className="space-y-6">
        <PageHeader
          title={supplier.displayName}
          description="Individual Supplier"
          actions={
            <div className="flex items-center gap-2">
              <Button onClick={fetchSupplier} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <SupplierActions supplier={supplier} onSuccess={fetchSupplier} />
            </div>
          }
        />

        {driver ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <DriverProfile driver={driver} onSuccess={fetchSupplier} />
              <DriverTripHistory driverId={driver._id} />
            </div>
            <div className="space-y-6">
              <DriverDocuments driver={driver} />
              <DriverVehicles driverId={driver._id} />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No linked driver record found for this individual supplier.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Company supplier layout (5-tab) ─────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setTab(v as CompanyTab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="trucks">Trucks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <SupplierProfile supplier={supplier} onSuccess={fetchSupplier} />
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <SupplierDriverList supplierId={supplier._id} />
        </TabsContent>

        <TabsContent value="trucks" className="mt-6">
          <SupplierVehicleList supplierId={supplier._id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <SupplierDocuments supplier={supplier} onSuccess={fetchSupplier} />
        </TabsContent>

        <TabsContent value="account" className="mt-6">
          <SupplierBankDetails supplier={supplier} onSuccess={fetchSupplier} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <SupplierDetailContent id={id} />
    </Suspense>
  );
}
