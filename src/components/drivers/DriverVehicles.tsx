'use client';

import { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Vehicle } from '@/types';
import { vehicleApi } from '@/lib/api';
import { toast } from 'sonner';

interface DriverVehiclesProps {
  driverId: string;
}

export function DriverVehicles({ driverId }: DriverVehiclesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await vehicleApi.getByDriver(driverId);
      setVehicles(response.data.data);
    } catch (error: unknown) {
      console.error('Failed to fetch vehicles:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicles ({vehicles.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No vehicles registered</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle._id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-lg">{vehicle.vehicleNumber}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.truckType}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      vehicle.availability === 'available'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : vehicle.availability === 'on-trip'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }
                  >
                    {vehicle.availability}
                  </Badge>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>
                    Length: {vehicle.length.value} {vehicle.length.unit}
                  </span>
                  <span>
                    Capacity: {vehicle.capacity.value} {vehicle.capacity.unit}
                  </span>
                  <span>Body: {vehicle.bodyType}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
