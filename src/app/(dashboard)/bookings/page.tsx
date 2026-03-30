'use client';

import { useState, useEffect } from 'react';
import { BookingCard } from '@/components/bookings/BookingCard';
import { BookingFilters } from '@/components/bookings/BookingFilters';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBookings } from '@/hooks/useBookings';
import { useBookingStore } from '@/store/bookingStore';
import { bookingApi } from '@/lib/api';
import { logger } from '@/lib/logger';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { AssignDriverModal } from '@/components/bookings/AssignDriverModal';
import { CreateBookingModal } from '@/components/bookings/CreateBookingModal';
import { ChevronLeft, ChevronRight, Package, Plus } from 'lucide-react';
import type { BookingStats } from '@/types';

export default function AllBookingsPage() {
  const { bookings, loading, error, refetch } = useBookings();
  const { filters, pagination, setFilters, clearFilters, setPagination } = useBookingStore();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [stats, setStats] = useState<BookingStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await bookingApi.getStats();
        setStats(response.data.data);
      } catch (error) {
        logger.error('Failed to fetch booking stats:', error);
      }
    };
    fetchStats();
  }, [bookings]); // Refetch stats when bookings change (e.g. after status update)

  const handleAssignDriver = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setAssignModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
    refetch();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    let status: string | undefined = undefined;

    if (value === 'new') {
      status = 'created,under-review';
    } else if (value === 'assigned') {
      status = 'assigned';
    } else if (value === 'in-transit') {
      status = 'in-transit';
    } else if (value === 'delivered') {
      status = 'delivered,pod-received';
    } else if (value === 'cancelled') {
      status = 'cancelled';
    }

    setFilters({ ...filters, status });
  };

  // The bookings are already filtered by the backend based on the status set in handleTabChange
  const filteredBookings = bookings || [];

  // Count bookings by status for tabs using the stats from backend
  const statusCounts = {
    all: stats?.total || 0,
    new: stats?.newRequests || 0,
    assigned: stats?.assigned || 0,
    inTransit: stats?.inTransit || 0,
    delivered: stats?.delivered || 0,
    cancelled: stats?.cancelled || 0,
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Indents</h1>
          <p className="text-muted-foreground">Manage all shipment indents</p>
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
          <h1 className="text-3xl font-bold">All Indents</h1>
          <p className="text-muted-foreground">Manage all shipment indents</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Indent
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-3xl grid-cols-6">
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
          <TabsTrigger value="cancelled">
            Cancelled <span className="ml-1 text-xs">({statusCounts.cancelled})</span>
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
              title="No indents found"
              description="Try adjusting your filters or create a new indent"
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
                    Showing {(pagination.currentPage - 1) * 20 + 1} to{' '}
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

      {selectedBookingId && (
        <AssignDriverModal
          isOpen={assignModalOpen}
          onCloseAction={() => {
            setAssignModalOpen(false);
            setSelectedBookingId(null);
          }}
          booking={bookings.find((b) => b._id === selectedBookingId)!}
          onSuccessAction={refetch}
        />
      )}

      <CreateBookingModal
        isOpen={createModalOpen}
        onCloseAction={() => setCreateModalOpen(false)}
        onSuccessAction={() => {
          setCreateModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
