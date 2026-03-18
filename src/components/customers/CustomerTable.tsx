'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import type { Customer } from '@/types';
import {
  Trash2,
  XCircle,
  CheckCircle,
  XCircle as CancelCircle,
  Pencil,
  ChevronDown,
} from 'lucide-react';

// ─── Inline Edit Cell ────────────────────────────────────────────────────────

interface InlineEditCellProps {
  value: string | undefined;
  onSave: (val: string) => void;
}

function InlineEditCell({ value, onSave }: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-[120px]">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-7 text-sm px-2 py-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <button
          onClick={handleSave}
          className="text-green-500 hover:text-green-600 shrink-0"
          title="Confirm"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          className="text-blue-400 hover:text-blue-500 shrink-0"
          title="Cancel"
        >
          <CancelCircle className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <span className="flex items-center gap-1 group">
      <span className="text-sm">{value || '—'}</span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition-opacity"
        title="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

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

// ─── KYC Badge ───────────────────────────────────────────────────────────────

function KycBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    verified:      { label: 'Verified',      cls: 'bg-green-100 text-green-700' },
    pending:       { label: 'Pending',        cls: 'bg-yellow-100 text-yellow-700' },
    rejected:      { label: 'Rejected',       cls: 'bg-red-100 text-red-600' },
    'not-submitted': { label: 'Not Submitted', cls: 'bg-gray-100 text-gray-500' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

// ─── Table ───────────────────────────────────────────────────────────────────

interface CustomerTableProps {
  customers: Customer[] | undefined;
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange?: (page: number) => void;
  onInlineUpdate?: (id: string, field: string, value: string) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function CustomerTable({
  customers,
  loading,
  pagination,
  onPageChange,
  onInlineUpdate,
  onDelete,
  onApprove,
  onReject,
}: CustomerTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        No customers found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b">
            <TableHead className="text-xs font-semibold text-gray-600 w-16">Action</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">ID</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Name</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Contact Person</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">City <ChevronDown className="h-3 w-3" /></span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">GSTIN</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">Company <ChevronDown className="h-3 w-3" /></span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">PAN</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">Type <ChevronDown className="h-3 w-3" /></span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">Payment Terms <ChevronDown className="h-3 w-3" /></span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 text-right">Bookings</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">KYC Status <ChevronDown className="h-3 w-3" /></span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer._id} className="hover:bg-gray-50">

              {/* Action */}
              <TableCell>
                <div className="flex items-center gap-1">
                  <Tooltip label="Delete">
                    <button
                      className="text-red-500 hover:text-red-600"
                      onClick={() => onDelete?.(customer._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  {customer.kycStatus !== 'verified' && (
                    <>
                      <Tooltip label="Approve">
                        <button
                          className="text-green-500 hover:text-green-600"
                          onClick={() => onApprove?.(customer._id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip label="Reject">
                        <button
                          className="text-red-400 hover:text-red-500"
                          onClick={() => onReject?.(customer._id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              </TableCell>

              {/* ID */}
              <TableCell>
                <Link
                  href={`/customers/${customer._id}`}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  {customer.customerCode || customer._id.slice(-6).toUpperCase()}
                </Link>
              </TableCell>

              {/* Name */}
              <TableCell>
                <InlineEditCell
                  value={customer.companyName}
                  onSave={(val) => onInlineUpdate?.(customer._id, 'companyName', val)}
                />
              </TableCell>

              {/* Contact Person */}
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{customer.contactPerson?.name || '—'}</span>
                  {customer.contactPerson?.phone && (
                    <span className="text-xs text-gray-500">{customer.contactPerson.phone}</span>
                  )}
                </div>
              </TableCell>

              {/* City */}
              <TableCell className="text-sm text-gray-700">
                {customer.address?.city || '—'}
              </TableCell>

              {/* GSTIN */}
              <TableCell>
                <InlineEditCell
                  value={customer.gstNumber}
                  onSave={(val) => onInlineUpdate?.(customer._id, 'gst', val)}
                />
              </TableCell>

              {/* Company (companyType) */}
              <TableCell className="text-sm text-gray-700">
                {customer.companyType || '—'}
              </TableCell>

              {/* PAN */}
              <TableCell className="text-sm text-gray-700">
                {customer.pan || '—'}
              </TableCell>

              {/* Type */}
              <TableCell>
                <InlineEditCell
                  value={customer.customerType}
                  onSave={(val) => onInlineUpdate?.(customer._id, 'customerType', val)}
                />
              </TableCell>

              {/* Payment Terms */}
              <TableCell>
                <span className="text-sm capitalize text-gray-700">
                  {customer.paymentTerms || '—'}
                </span>
              </TableCell>

              {/* Total Bookings */}
              <TableCell className="text-sm text-gray-700 text-right">
                {customer.totalBookings ?? 0}
              </TableCell>

              {/* KYC Status */}
              <TableCell>
                <KycBadge status={customer.kycStatus} />
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
