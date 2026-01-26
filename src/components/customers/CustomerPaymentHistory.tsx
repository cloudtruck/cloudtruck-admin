'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { paymentApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Payment } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface CustomerPaymentHistoryProps {
  customerId: string;
}

export function CustomerPaymentHistory({ customerId }: CustomerPaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, pagination.currentPage]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await paymentApi.getAll({
        customerId,
        page: pagination.currentPage,
        limit: 10,
      });
      setPayments(response.data.data.payments);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Booking ID',
      accessor: 'bookingId',
      cell: (payment: Payment) => (
        <Link
          href={`/bookings/${payment.booking._id}`}
          className="font-medium hover:underline"
        >
          {payment.booking.bookingId}
        </Link>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (payment: Payment) => (
        <div className="text-sm">
          <div className="font-medium">₹{payment.amount.toLocaleString('en-IN')}</div>
          {payment.advanceAmount && payment.advanceAmount > 0 && (
            <div className="text-xs text-muted-foreground">
              Adv: ₹{payment.advanceAmount.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'paymentStatus',
      cell: (payment: Payment) => <PaymentStatusBadge status={payment.paymentStatus} />,
    },
    {
      header: 'Method',
      accessor: 'paymentMethod',
      cell: (payment: Payment) => (
        <Badge variant="outline" className="capitalize">
          {payment.paymentMethod || 'N/A'}
        </Badge>
      ),
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      cell: (payment: Payment) => (
        <span className="text-sm">
          {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, currentPage: page })}
        />
      </CardContent>
    </Card>
  );
}
