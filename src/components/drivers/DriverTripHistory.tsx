'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Booking, Pagination } from '@/types';
import { driverApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DriverTripHistoryProps {
  driverId: string;
}

export function DriverTripHistory({ driverId }: DriverTripHistoryProps) {
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  useEffect(() => {
    fetchTripHistory();
  }, [driverId, pagination.currentPage]);

  const fetchTripHistory = async () => {
    setLoading(true);
    try {
      const response = await driverApi.getTripHistory(driverId, {
        page: pagination.currentPage,
        limit: 10,
      });
      setTrips(response.data.data.trips);
      setPagination(response.data.data.pagination);
    } catch (error: unknown) {
      console.error('Failed to fetch trip history:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch trip history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trip History</CardTitle>
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
        <CardTitle>Trip History ({pagination.totalItems})</CardTitle>
      </CardHeader>
      <CardContent>
        {trips?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No trips completed yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
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
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <p>{trip.pickup.city}</p>
                        <p className="flex items-center gap-1">
                          <span>→</span>
                          <span>{trip.drop.city}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(trip.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Material: <span className="text-foreground">{trip.materialType}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Truck: <span className="text-foreground">{trip.truckTypeNeeded}</span>
                  </span>
                </div>
              </div>
            ))}

            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
                  }
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
