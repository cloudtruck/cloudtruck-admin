'use client';

import { DataTable } from '@/components/common/DataTable';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { KycStatusBadge } from './KycStatusBadge';
import type { Customer } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface CustomerTableProps {
  customers: Customer[] | undefined;
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange?: (page: number) => void;
}

export function CustomerTable({ customers, loading, pagination, onPageChange }: CustomerTableProps) {
  const columns = [
    {
      header: 'Company',
      accessor: 'companyName',
      cell: (customer: Customer) => (
        <div className="flex flex-col">
          <Link
            href={`/customers/${customer._id}`}
            className="font-medium hover:underline"
          >
            {customer.companyName}
          </Link>
          {customer.gstNumber && (
            <span className="text-xs text-muted-foreground">
              GST: {customer.gstNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessor: 'contactPerson',
      cell: (customer: Customer) => (
        <div className="flex flex-col">
          <span className="font-medium">{customer.contactPerson?.name}</span>
          <span className="text-xs text-muted-foreground">
            {customer.contactPerson?.phone}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (customer: Customer) => <CustomerStatusBadge status={customer.status} />,
    },
    {
      header: 'KYC Status',
      accessor: 'kycStatus',
      cell: (customer: Customer) => <KycStatusBadge status={customer.kycStatus} />,
    },
    {
      header: 'Total Bookings',
      accessor: 'totalBookings',
      cell: (customer: Customer) => (
        <span className="font-medium">{customer.totalBookings || 0}</span>
      ),
    },
    {
      header: 'Last Booking',
      accessor: 'lastBookingDate',
      cell: (customer: Customer) => (
        <span className="text-sm text-muted-foreground">
          {customer.lastBookingDate
            ? formatDistanceToNow(new Date(customer.lastBookingDate), { addSuffix: true })
            : 'Never'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      cell: (customer: Customer) => (
        <Link href={`/customers/${customer._id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={customers}
      loading={loading}
      pagination={pagination}
      onPageChange={onPageChange}
    />
  );
}
