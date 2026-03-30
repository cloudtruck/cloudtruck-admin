'use client';

import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SupplierPaymentApproveDialog } from './SupplierPaymentApproveDialog';
import type { SupplierPaymentRecord, Pagination } from '@/types';
import { format } from 'date-fns';

interface CompanyPaymentTableProps {
  payments: SupplierPaymentRecord[];
  loading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onRefresh: () => void;
}

const statusVariants: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

function rupees(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function CompanyPaymentTable({
  payments,
  loading,
  pagination,
  onPageChange,
  onRefresh,
}: CompanyPaymentTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">Loading...</div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        No payment records found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b">
            <TableHead className="text-xs font-semibold text-gray-600">Supplier</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Booking</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Type</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Method</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 text-right">Amount</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Reference</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Requested</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 w-28">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment._id} className="hover:bg-gray-50">
              <TableCell className="text-sm font-medium">
                <Link
                  href={`/suppliers/${payment.supplier._id}`}
                  className="text-blue-600 hover:underline"
                >
                  {payment.supplier.displayName}
                </Link>
              </TableCell>

              <TableCell>
                <Link
                  href={`/bookings/${payment.booking._id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {payment.booking.bookingId}
                </Link>
              </TableCell>

              <TableCell>
                <span className="text-xs capitalize bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  {payment.paymentType}
                </span>
              </TableCell>

              <TableCell className="text-sm text-gray-700 capitalize">{payment.paymentMethod}</TableCell>

              <TableCell className="text-sm font-semibold text-gray-900 text-right">
                {rupees(payment.amount)}
              </TableCell>

              <TableCell>
                <Badge
                  variant="outline"
                  className={`${statusVariants[payment.status] ?? 'bg-gray-100'} text-xs font-medium`}
                >
                  {payment.status}
                </Badge>
              </TableCell>

              <TableCell className="text-sm text-gray-600">
                {payment.referenceNumber || '—'}
              </TableCell>

              <TableCell className="text-sm text-gray-500">
                {format(new Date(payment.requestedAt), 'dd-MMM-yy')}
              </TableCell>

              <TableCell>
                {(payment.status === 'pending' || payment.status === 'approved') && (
                  <SupplierPaymentApproveDialog payment={payment} onSuccess={onRefresh} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage <= 1}
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
