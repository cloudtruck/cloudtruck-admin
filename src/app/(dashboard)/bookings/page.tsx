'use client';

import { useState } from 'react';
import { BookingCard } from '@/components/bookings/BookingCard';
import { BookingFilters } from '@/components/bookings/BookingFilters';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBookings } from '@/hooks/useBookings';
import { useBookingStore } from '@/store/bookingStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function AllBookingsPage() {
  const { bookings, loading, error, refetch } = useBookings();
  const { filters, pagination, setFilters, clearFilters, setPagination } = useBookingStore();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const handleAssignDriver = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    toast.info('Driver assignment modal will open here');
    // TODO: Implement assign driver modal
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
    refetch();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'all') {
      setFilters({ ...filters, status: undefined });
    } else {
      setFilters({ ...filters, status: value });
    }
  };

  // Filter bookings by tab
  const getFilteredBookings = () => {
    if (!bookings || bookings.length === 0) return [];
    if (activeTab === 'all') return bookings;
    return bookings.filter((booking) => {
      if (activeTab === 'new') {
        return booking.status === 'created' || booking.status === 'under-review';
      }
      if (activeTab === 'assigned') {
        return booking.status === 'assigned';
      }
      if (activeTab === 'in-transit') {
        return booking.status === 'in-transit';
      }
      if (activeTab === 'delivered') {
        return booking.status === 'delivered' || booking.status === 'pod-received';
      }
      return true;
    });
  };

  const filteredBookings = getFilteredBookings();

  // Count bookings by status for tabs
  const statusCounts = {
    all: bookings?.length || 0,
    new: bookings?.filter((b) => b.status === 'created' || b.status === 'under-review').length || 0,
    assigned: bookings?.filter((b) => b.status === 'assigned').length || 0,
    inTransit: bookings?.filter((b) => b.status === 'in-transit').length || 0,
    delivered: bookings?.filter(
      (b) => b.status === 'delivered' || b.status === 'pod-received'
    ).length || 0,
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Bookings</h1>
          <p className="text-muted-foreground">Manage all shipment bookings</p>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">All Bookings</h1>
        <p className="text-muted-foreground">Manage all shipment bookings</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="all">
            All <span className="ml-1 text-xs">({statusCounts.all})</span>
          </TabsTrigger>
          <TabsTrigger value="new">
            New <span className="ml-1 text-xs">({statusCounts.new})</span>
          </TabsTrigger>
          <TabsTrigger value="assigned">
            Assigned <span className="ml-1 text-xs">({statusCounts.assigned})</span>
          </TabsTrigger>
          <TabsTrigger value="in-transit">
            In Transit <span className="ml-1 text-xs">({statusCounts.inTransit})</span>
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered <span className="ml-1 text-xs">({statusCounts.delivered})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Filters */}
          <BookingFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredBookings.length === 0 && (
            <EmptyState
              icon={Package}
              title="No bookings found"
              description="Try adjusting your filters or create a new booking"
            />
          )}

          {/* Bookings Grid */}
          {!loading && filteredBookings.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    onAssignDriver={handleAssignDriver}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * 20) + 1} to{' '}
                    {Math.min(pagination.currentPage * 20, pagination.totalItems)} of{' '}
                    {pagination.totalItems} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
