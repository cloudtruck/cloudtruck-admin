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
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { SupplierActions } from './SupplierActions';
import type { Supplier, Pagination } from '@/types';
import { format } from 'date-fns';

interface SupplierTableProps {
  suppliers: Supplier[] | undefined;
  loading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onRefresh: () => void;
}

export function SupplierTable({
  suppliers,
  loading,
  pagination,
  onPageChange,
  onRefresh,
}: SupplierTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        No suppliers found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b">
            <TableHead className="text-xs font-semibold text-gray-600 w-24">Action</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">ID</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Name</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Type</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Phone</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">City</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">GSTIN</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 text-right">Drivers</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 text-right">Bookings</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Registered</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier._id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center gap-1">
                  <SupplierActions supplier={supplier} onSuccess={onRefresh} />
                </div>
              </TableCell>

              <TableCell>
                <Link
                  href={`/suppliers/${supplier._id}`}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  {supplier._id.slice(-6).toUpperCase()}
                </Link>
              </TableCell>

              <TableCell>
                <Link
                  href={`/suppliers/${supplier._id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {supplier.displayName}
                </Link>
                {supplier.companyName && (
                  <p className="text-xs text-gray-400">{supplier.companyName}</p>
                )}
              </TableCell>

              <TableCell>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    supplier.supplierType === 'company'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {supplier.supplierType === 'company' ? 'Company' : 'Individual'}
                </span>
              </TableCell>

              <TableCell className="text-sm text-gray-700">{supplier.phone || '—'}</TableCell>

              <TableCell className="text-sm text-gray-700">{supplier.city || '—'}</TableCell>

              <TableCell className="text-sm text-gray-700">{supplier.gstin || '—'}</TableCell>

              <TableCell className="text-sm text-gray-700 text-right">
                {supplier.fleetStats.totalDrivers}
              </TableCell>

              <TableCell className="text-sm text-gray-700 text-right">
                {supplier.performance.totalBookings}
              </TableCell>

              <TableCell>
                <SupplierStatusBadge status={supplier.verificationStatus} />
                {supplier.isBlacklisted && (
                  <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Blacklisted
                  </span>
                )}
              </TableCell>

              <TableCell className="text-sm text-gray-500">
                {supplier.createdAt ? format(new Date(supplier.createdAt), 'dd-MMM-yy') : '—'}
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
