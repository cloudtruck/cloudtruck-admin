'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { bookingApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Booking } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface CustomerBookingHistoryProps {
  customerId: string;
}

export function CustomerBookingHistory({ customerId }: CustomerBookingHistoryProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  useEffect(() => {
    fetchBookings();
  }, [customerId, pagination.currentPage]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingApi.getAll({
        customerId,
        page: pagination.currentPage,
        limit: 10,
      });
      setBookings(response.data.data.bookings);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to fetch booking history');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Booking ID',
      accessor: 'bookingId',
      cell: (booking: Booking) => (
        <Link
          href={`/bookings/${booking._id}`}
          className="font-medium hover:underline"
        >
          {booking.bookingId}
        </Link>
      ),
    },
    {
      header: 'Route',
      accessor: 'route',
      cell: (booking: Booking) => (
        <div className="text-sm">
          <div>{booking.pickup?.city}</div>
          <div className="text-muted-foreground">→ {booking.drop?.city}</div>
        </div>
      ),
    },
    {
      header: 'Material',
      accessor: 'materialType',
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (booking: Booking) => <StatusBadge status={booking.status} />,
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      cell: (booking: Booking) => (
        <span className="text-sm">
          {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      cell: (booking: Booking) => (
        <Link href={`/bookings/${booking._id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking History</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={bookings}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, currentPage: page })}
        />
      </CardContent>
    </Card>
  );
}
