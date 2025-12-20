'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, CheckCircle, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Payment, Pagination } from '@/types';
import { format } from 'date-fns';

interface PaymentTableProps {
  payments: Payment[] | undefined;
  loading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onMarkAsReceived: (paymentId: string) => void;
  onDownloadInvoice: (paymentId: string) => void;
}

export function PaymentTable({
  payments,
  loading,
  pagination,
  onPageChange,
  onMarkAsReceived,
  onDownloadInvoice,
}: PaymentTableProps) {
  const columns = [
    {
      header: 'Booking ID',
      accessor: 'booking',
      cell: (payment: Payment) => (
        <div>
          <Link
            href={`/bookings/${payment.booking._id}`}
            className="font-semibold hover:underline"
          >
            {payment.booking.bookingId}
          </Link>
          <p className="text-xs text-muted-foreground">
            {payment.booking.customer.companyName}
          </p>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (payment: Payment) => (
        <div>
          <p className="font-semibold">₹{payment.amount.toLocaleString('en-IN')}</p>
          {payment.advanceAmount && payment.advanceAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Advance: ₹{payment.advanceAmount.toLocaleString('en-IN')}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Payment Status',
      accessor: 'paymentStatus',
      cell: (payment: Payment) => <PaymentStatusBadge status={payment.paymentStatus} />,
    },
    {
      header: 'Method',
      accessor: 'paymentMethod',
      cell: (payment: Payment) => (
        <Badge variant="outline" className="capitalize">
          {payment.paymentMethod || 'Not Set'}
        </Badge>
      ),
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      cell: (payment: Payment) => (
        <div className="text-sm">
          <p>{format(new Date(payment.createdAt), 'MMM dd, yyyy')}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(payment.createdAt), 'HH:mm')}
          </p>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      cell: (payment: Payment) => (
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/payments/${payment._id}`}>View</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {payment.paymentStatus === 'unpaid' && (
                <DropdownMenuItem onClick={() => onMarkAsReceived(payment._id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Received
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDownloadInvoice(payment._id)}>
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={payments}
      loading={loading}
      pagination={pagination}
      onPageChange={onPageChange}
    />
  );
}
