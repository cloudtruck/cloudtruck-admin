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
import { DriverActions } from './DriverActions';
import type { Driver, Pagination } from '@/types';
import { format } from 'date-fns';
import { ChevronDown, CheckCircle2, XCircle } from 'lucide-react';

// ─── Badges ──────────────────────────────────────────────────────────────────

function KycBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    verified:  { label: 'Verified',   cls: 'bg-green-100 text-green-700' },
    submitted: { label: 'Submitted',  cls: 'bg-blue-100 text-blue-700' },
    pending:   { label: 'Pending',    cls: 'bg-yellow-100 text-yellow-700' },
    rejected:  { label: 'Rejected',   cls: 'bg-red-100 text-red-600' },
  };
  const { label, cls } = map[status ?? ''] ?? { label: status ?? '—', cls: 'bg-gray-100 text-gray-500' };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function AvailabilityBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    available: { label: 'Available', cls: 'bg-green-100 text-green-700' },
    'on-trip': { label: 'On Trip',   cls: 'bg-blue-100 text-blue-700' },
    offline:   { label: 'Offline',   cls: 'bg-gray-100 text-gray-500' },
    blocked:   { label: 'Blocked',   cls: 'bg-red-100 text-red-600' },
  };
  const { label, cls } = map[status ?? ''] ?? { label: status ?? '—', cls: 'bg-gray-100 text-gray-500' };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

// ─── Table ───────────────────────────────────────────────────────────────────

interface DriverTableProps {
  drivers: Driver[] | undefined;
  loading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onRefresh: () => void;
}

export function DriverTable({ drivers, loading, pagination, onPageChange, onRefresh }: DriverTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (!drivers || drivers.length === 0) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        No drivers found.
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
            <TableHead className="text-xs font-semibold text-gray-600">Mobile</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">License No.</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">PAN</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">City <ChevronDown className="h-3 w-3" /></span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Truck Types</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 text-right">Trips</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">TDS</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">KYC Status <ChevronDown className="h-3 w-3" /></span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">Availability <ChevronDown className="h-3 w-3" /></span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Reg. At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver._id} className="hover:bg-gray-50">

              {/* Action */}
              <TableCell>
                <div className="flex items-center gap-1">
                  <DriverActions driver={driver} onSuccess={onRefresh} />
                </div>
              </TableCell>

              {/* ID */}
              <TableCell>
                <Link
                  href={`/drivers/${driver._id}`}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  {driver._id.slice(-6).toUpperCase()}
                </Link>
              </TableCell>

              {/* Name */}
              <TableCell>
                <div className="flex flex-col">
                  <Link
                    href={`/drivers/${driver._id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {driver.name}
                  </Link>
                </div>
              </TableCell>

              {/* Mobile */}
              <TableCell className="text-sm text-gray-700">
                {driver.phone || '—'}
              </TableCell>

              {/* License No. */}
              <TableCell className="text-sm text-gray-700">
                {driver.licenseNumber || '—'}
              </TableCell>

              {/* PAN */}
              <TableCell className="text-sm text-gray-700">
                {driver.panNumber || '—'}
              </TableCell>

              {/* City */}
              <TableCell className="text-sm text-gray-700">
                {driver.city || '—'}
              </TableCell>

              {/* Truck Types */}
              <TableCell>
                {driver.preferredTruckTypes && driver.preferredTruckTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {driver.preferredTruckTypes.slice(0, 2).map((t) => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                    {driver.preferredTruckTypes.length > 2 && (
                      <span className="text-xs text-gray-400">+{driver.preferredTruckTypes.length - 2}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </TableCell>

              {/* Trips */}
              <TableCell className="text-sm text-gray-700 text-right">
                {driver.totalTrips ?? 0}
              </TableCell>

              {/* TDS Uploaded */}
              <TableCell>
                {driver.tdsDocument ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-300" />
                )}
              </TableCell>

              {/* KYC Status */}
              <TableCell>
                <KycBadge status={driver.kycStatus} />
              </TableCell>

              {/* Availability */}
              <TableCell>
                <AvailabilityBadge status={driver.status} />
              </TableCell>

              {/* Reg. At */}
              <TableCell className="text-sm text-gray-500">
                {driver.createdAt
                  ? format(new Date(driver.createdAt), 'dd-MMM-yy')
                  : '—'}
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
          <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
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
