'use client';

import { useState } from 'react';
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
import type { Driver, Pagination } from '@/types';
import { FileText, FileCheck, XCircle, Settings2, Search, Pencil } from 'lucide-react';
import { format } from 'date-fns';

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50 pointer-events-none">
          {label}
        </span>
      )}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ driver }: { driver: Driver }) {
  if (!driver.isVerified) {
    return <span className="text-xs text-gray-500">Verification</span>;
  }
  const map: Record<string, { label: string; cls: string }> = {
    available: { label: 'Available', cls: 'bg-green-100 text-green-700' },
    'on-trip': { label: 'On Trip',   cls: 'bg-blue-100 text-blue-700' },
    offline:   { label: 'Offline',   cls: 'bg-gray-100 text-gray-500' },
    blocked:   { label: 'Blocked',   cls: 'bg-red-100 text-red-600' },
  };
  const { label, cls } = map[driver.status] ?? { label: driver.status, cls: 'bg-gray-100 text-gray-500' };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

// ─── Action Cell ──────────────────────────────────────────────────────────────

function DriverActions({
  driver,
  onRejectKyc,
}: {
  driver: Driver;
  onRejectKyc?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {/* Row 1: View (green file) */}
      <div className="flex items-center gap-1">
        <Tooltip label="View Driver">
          <Link href={`/drivers/${driver._id}`}>
            <button className="text-green-500 hover:text-green-700 p-0.5">
              <FileText className="h-3.5 w-3.5" />
            </button>
          </Link>
        </Tooltip>
      </div>
      {/* Row 2: Preview Docs + Reject KYC */}
      <div className="flex items-center gap-1">
        <Tooltip label="Preview Documents">
          <Link href={`/drivers/${driver._id}`}>
            <button className="text-blue-400 hover:text-blue-600 p-0.5">
              <FileCheck className="h-3.5 w-3.5" />
            </button>
          </Link>
        </Tooltip>
        <Tooltip label="Reject KYC">
          <button
            className="text-red-400 hover:text-red-600 p-0.5"
            onClick={() => onRejectKyc?.(driver._id)}
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── Editable Name Cell ───────────────────────────────────────────────────────

function EditableNameCell({ name }: { name?: string }) {
  return (
    <span className="flex items-center gap-1 text-sm text-gray-700">
      {name || <span className="text-gray-400">—</span>}
      <Pencil className="h-3 w-3 text-blue-400 flex-shrink-0" />
    </span>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface DriverTabTableProps {
  drivers: Driver[] | undefined;
  loading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onRejectKyc?: (id: string) => void;
}

export function DriverTabTable({
  drivers,
  loading,
  pagination,
  onPageChange,
  onRejectKyc,
}: DriverTabTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (!drivers || drivers.length === 0) {
    return (
      <div className="bg-white rounded border p-12 flex flex-col items-center gap-2 text-gray-400">
        <FileText className="h-10 w-10 opacity-20" />
        <span className="text-sm">No drivers found</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b">
            <TableHead className="text-xs font-semibold text-gray-600 w-16">
              <span className="flex items-center gap-1">
                <Settings2 className="h-3.5 w-3.5" /> Action
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">ID</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Truck</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1"><Search className="h-3 w-3" /> Name</span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1"><Search className="h-3 w-3" /> Short Name</span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1"><Search className="h-3 w-3" /> Mobile</span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1"><Search className="h-3 w-3" /> Ownership</span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1"><Search className="h-3 w-3" /> Licence No</span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">L.Valid Till</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1"><Search className="h-3 w-3" /> Aadhar No</span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Bank A/C</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver, idx) => {
            const firstVehicle = driver.vehicles?.[0];
            const shortId = `SMD${idx + 1}`;
            const licenseExpiry = driver.licenseExpiry;
            const isExpiring = licenseExpiry
              ? new Date(licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : false;

            return (
              <TableRow key={driver._id} className="hover:bg-gray-50">
                {/* Action */}
                <TableCell className="py-2">
                  <DriverActions driver={driver} onRejectKyc={onRejectKyc} />
                </TableCell>

                {/* ID */}
                <TableCell className="text-sm text-blue-600 font-medium">
                  {shortId}
                </TableCell>

                {/* Truck */}
                <TableCell>
                  {firstVehicle ? (
                    <Link
                      href={`/vehicles/${firstVehicle._id}`}
                      className="text-blue-600 hover:underline text-sm font-semibold"
                    >
                      {firstVehicle.vehicleNumber}
                    </Link>
                  ) : (
                    <EditableNameCell name="" />
                  )}
                </TableCell>

                {/* Name */}
                <TableCell>
                  <Link
                    href={`/drivers/${driver._id}`}
                    className="text-sm font-medium text-gray-800 hover:underline"
                  >
                    {driver.name}
                  </Link>
                </TableCell>

                {/* Short Name — inline editable placeholder */}
                <TableCell>
                  <EditableNameCell name={driver.name?.split(' ')[0]} />
                </TableCell>

                {/* Mobile */}
                <TableCell className="text-sm text-gray-700">
                  {driver.phone || '—'}
                </TableCell>

                {/* Ownership — from first vehicle type or default Market */}
                <TableCell className="text-sm text-gray-600 capitalize">
                  {firstVehicle ? (firstVehicle.truckType || 'Market') : 'Market'}
                </TableCell>

                {/* Licence No */}
                <TableCell className="text-sm text-gray-700">
                  {driver.licenseNumber || '—'}
                </TableCell>

                {/* L.Valid Till */}
                <TableCell
                  className={`text-sm ${isExpiring ? 'text-red-500 font-medium' : 'text-gray-600'}`}
                >
                  {licenseExpiry ? format(new Date(licenseExpiry), 'dd-MMM-yy') : '—'}
                </TableCell>

                {/* Aadhar No */}
                <TableCell className="text-sm text-gray-700">
                  {driver.aadhaarNumber
                    ? `XXXX-XXXX-${driver.aadhaarNumber.slice(-4)}`
                    : '—'}
                </TableCell>

                {/* Bank A/C */}
                <TableCell className="text-sm text-gray-700">
                  {driver.bankDetails?.accountNumber
                    ? `••••${driver.bankDetails.accountNumber.slice(-4)}`
                    : '—'}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge driver={driver} />
                </TableCell>
              </TableRow>
            );
          })}
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
