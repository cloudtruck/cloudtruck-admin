'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LiveTripCard } from '@/components/tracking/LiveTripCard';
import { LiveTripFilters } from '@/components/tracking/LiveTripFilters';
import { TrackingDetailModal } from '@/components/tracking/TrackingDetailModal';
import { trackingApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Booking, Pagination } from '@/types';
import Link from 'next/link';

export default function LiveTripsPage() {
  const [bookings, setBookings] = useState<(Booking & { lastLocation?: { location?: { coordinates: [number, number] }; timestamp?: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const fetchLiveTrips = useCallback(async () => {
    setLoading(true);
    try {
      const response = await trackingApi.getLiveTrips();
      let data = response.data?.data || [];
      
      // Client-side filtering as this endpoint currently returns all live trips
      if (statusFilter !== 'all') {
        data = data.filter(b => b.status === statusFilter);
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        data = data.filter(b => 
          b.bookingId.toLowerCase().includes(q) || 
          b.customer?.companyName?.toLowerCase().includes(q) ||
          b.driver?.name?.toLowerCase().includes(q)
        );
      }

      setBookings(data);
      // Update pagination
      setPagination(prev => {
        const totalItems = data.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / prev.itemsPerPage));
        return {
          ...prev,
          totalItems,
          totalPages,
          currentPage: prev.currentPage > totalPages ? totalPages : prev.currentPage
        };
      });
    } catch (error) {
      console.error('Failed to fetch live trips:', error);
      toast.error('Failed to fetch live trips');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchLiveTrips();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchLiveTrips, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveTrips]);

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setTrackingModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Trips"
        description={`${pagination.totalItems} active shipment${pagination.totalItems !== 1 ? 's' : ''}`}
        actions={
          <div className="flex gap-2">
            <Button onClick={fetchLiveTrips} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/tracking/map">
                <MapIcon className="h-4 w-4 mr-2" />
                Map View
              </Link>
            </Button>
          </div>
        }
      />

      <LiveTripFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={fetchLiveTrips}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={handleClearFilters}
        hasActiveFilters={Boolean(hasActiveFilters)}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : !bookings || bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <MapIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No active trips</p>
            <p className="text-sm mt-1">All shipments have been delivered</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings
              .slice(
                (pagination.currentPage - 1) * pagination.itemsPerPage,
                pagination.currentPage * pagination.itemsPerPage
              )
              .map((booking) => (
                <LiveTripCard
                  key={booking._id}
                  booking={booking}
                  onViewDetailsAction={handleViewDetails}
                />
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

      <TrackingDetailModal
        booking={selectedBooking}
        open={trackingModalOpen}
        onCloseAction={() => setTrackingModalOpen(false)}
        onBookingUpdate={fetchLiveTrips}
      />
    </div>
  );
}
