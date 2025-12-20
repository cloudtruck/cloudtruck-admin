'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Truck, User, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { VehicleStatusBadge } from '@/components/vehicles/VehicleStatusBadge';
import { VehicleDocuments } from '@/components/vehicles/VehicleDocuments';
import { StatusBadge } from '@/components/common/StatusBadge';
import { vehicleApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Vehicle, Booking } from '@/types';
import { format } from 'date-fns';

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripHistory, setTripHistory] = useState<Booking[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  useEffect(() => {
    fetchVehicle();
    fetchTripHistory();
  }, [id]);

  const fetchVehicle = async () => {
    setLoading(true);
    try {
      const response = await vehicleApi.getById(id);
      setVehicle(response.data.data);
    } catch (error: unknown) {
      console.error('Failed to fetch vehicle:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch vehicle');
    } finally {
      setLoading(false);
    }
  };

  const fetchTripHistory = async () => {
    setLoadingTrips(true);
    try {
      // Temporarily commented out until vehicleId filter is added to API
      // const response = await bookingApi.getAll({ vehicleId: id, limit: 10 });
      // setTripHistory(response.data.data.bookings);
      setTripHistory([]);
    } catch (error) {
      console.error('Failed to fetch trip history:', error);
    } finally {
      setLoadingTrips(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vehicle Not Found"
          description="The vehicle you are looking for does not exist"
        />
        <div className="flex justify-center">
          <Button onClick={() => router.push('/vehicles')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={vehicle.vehicleNumber}
        description={`Vehicle ID: ${vehicle._id}`}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={fetchVehicle} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => router.push('/vehicles')} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="h-10 w-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{vehicle.vehicleNumber}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <VehicleStatusBadge status={vehicle.status} />
                    <Badge variant="secondary">{vehicle.truckType}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Truck Type</p>
                    <p className="font-medium">{vehicle.truckType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Body Type</p>
                    <p className="font-medium capitalize">{vehicle.bodyType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registered</p>
                    <p className="font-medium">
                      {format(new Date(vehicle.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                {vehicle.owner && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Owner</p>
                      <Link
                        href={`/drivers/${vehicle.owner._id}`}
                        className="font-medium hover:underline"
                      >
                        {vehicle.owner.name}
                      </Link>
                    </div>
                  </div>
                )}

                {vehicle.driver && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Driver</p>
                      <Link
                        href={`/drivers/${vehicle.driver._id}`}
                        className="font-medium hover:underline"
                      >
                        {vehicle.driver.name}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Length</p>
                  <p className="text-2xl font-bold">
                    {vehicle.length.value} {vehicle.length.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                  <p className="text-2xl font-bold">
                    {vehicle.capacity.value} {vehicle.capacity.unit}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trip History ({tripHistory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTrips ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : tripHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No trips completed yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tripHistory.map((trip) => (
                    <div
                      key={trip._id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/bookings/${trip._id}`}
                              className="font-semibold hover:underline"
                            >
                              {trip.bookingId}
                            </Link>
                            <StatusBadge status={trip.status} type="booking" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {trip.pickup.city} → {trip.drop.city}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(trip.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Material: <span className="text-foreground">{trip.materialType}</span>
                        </span>
                        {trip.driver && (
                          <span className="text-muted-foreground">
                            Driver:{' '}
                            <Link
                              href={`/drivers/${trip.driver._id}`}
                              className="text-foreground hover:underline"
                            >
                              {trip.driver.name}
                            </Link>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <VehicleDocuments vehicle={vehicle} />
        </div>
      </div>
    </div>
  );
}
