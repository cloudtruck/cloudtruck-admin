'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

interface Column<T> {
  header: string;
  accessor: keyof T | string;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage?: number;
  };
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { _id: string }>({
  columns,
  data,
  loading,
  pagination,
  onPageChange,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data || !data.length) {
    return <EmptyState title={emptyMessage} />;
  }

  const itemsPerPage = pagination?.itemsPerPage || 20;
  const startItem = pagination ? (pagination.currentPage - 1) * itemsPerPage + 1 : 1;
  const endItem = pagination
    ? Math.min(pagination.currentPage * itemsPerPage, pagination.totalItems)
    : data.length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row._id}>
                {columns.map((column, index) => (
                  <TableCell key={index}>
                    {column.cell
                      ? column.cell(row)
                      : (row[column.accessor as keyof T] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-500">
            Showing {startItem} to {endItem} of {pagination.totalItems} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center px-3 text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
