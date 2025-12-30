'use client';

import { useState } from 'react';
import { BookingCard } from '@/components/bookings/BookingCard';
import { BookingFilters } from '@/components/bookings/BookingFilters';
import { Button } from '@/components/ui/button';
import { useBookings } from '@/hooks/useBookings';
import { useBookingStore } from '@/store/bookingStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { AssignDriverModal } from '@/components/bookings/AssignDriverModal';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function NewRequestsPage() {
  const { bookings, loading, error, refetch } = useBookings();
  const { filters, pagination, setFilters, clearFilters, setPagination } = useBookingStore();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Filter bookings to show only new requests (created or under-review)
  const newRequestBookings = bookings?.filter(
    (booking) => booking.status === 'created' || booking.status === 'under-review'
  ) || [];

  const handleAssignDriver = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowAssignModal(true);
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
    refetch();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">New Booking Requests</h1>
          <p className="text-muted-foreground">Review and assign drivers to new bookings</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Booking Requests</h1>
          <p className="text-muted-foreground">Review and assign drivers to new bookings</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{newRequestBookings.length}</p>
          <p className="text-sm text-muted-foreground">Pending Requests</p>
        </div>
      </div>

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
      {!loading && newRequestBookings.length === 0 && (
        <EmptyState
          icon={Package}
          title="No new booking requests"
          description="All booking requests have been reviewed and assigned"
        />
      )}

      {/* Bookings Grid */}
      {!loading && newRequestBookings.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newRequestBookings.map((booking) => (
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

      {selectedBookingId && (
        <AssignDriverModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedBookingId(null);
          }}
          booking={bookings.find((b) => b._id === selectedBookingId)!}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
