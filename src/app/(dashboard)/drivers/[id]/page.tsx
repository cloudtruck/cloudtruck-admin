'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DriverProfile } from '@/components/drivers/DriverProfile';
import { DriverDocuments } from '@/components/drivers/DriverDocuments';
import { DriverVehicles } from '@/components/drivers/DriverVehicles';
import { DriverTripHistory } from '@/components/drivers/DriverTripHistory';
import { DriverActions } from '@/components/drivers/DriverActions';
import { driverApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Driver } from '@/types';

interface DriverDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DriverDetailPage({ params }: DriverDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriver();
  }, [id]);

  const fetchDriver = async () => {
    setLoading(true);
    try {
      const response = await driverApi.getById(id);
      setDriver(response.data.data);
    } catch (error: unknown) {
      console.error('Failed to fetch driver:', error);
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
      <div className="space-y-6">
        <PageHeader
          title="Driver Not Found"
          description="The driver you are looking for does not exist"
        />
        <div className="flex justify-center">
          <Button onClick={() => router.push('/drivers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={driver.name}
        description={`Driver ID: ${driver._id}`}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={fetchDriver} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <DriverActions driver={driver} onSuccess={fetchDriver} />
            <Button onClick={() => router.push('/drivers')} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DriverProfile driver={driver} />
          <DriverTripHistory driverId={driver._id} />
        </div>
        <div className="space-y-6">
          <DriverDocuments driver={driver} />
          <DriverVehicles driverId={driver._id} />
        </div>
      </div>
    </div>
  );
}
