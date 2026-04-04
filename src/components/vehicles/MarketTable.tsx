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
import { TruckCommentModal } from './TruckCommentModal';
import { EditVehicleModal } from './EditVehicleModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Vehicle, Pagination } from '@/types';
import {
  ChevronDown,
  FileText,
  Trash2,
  Pencil,
  Phone,
  MessageCircle,
  FileCheck,
  XCircle,
  Settings2,
} from 'lucide-react';

// ─── Badges ──────────────────────────────────────────────────────────────────

function KycBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    verified: { label: 'Verified', cls: 'bg-green-100 text-green-700' },
    pending: { label: 'Verification', cls: 'bg-yellow-100 text-yellow-700' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-600' },
    expired: { label: 'Expired', cls: 'bg-orange-100 text-orange-600' },
  };
  const { label, cls } = map[status ?? ''] ?? {
    label: status ?? '—',
    cls: 'bg-gray-100 text-gray-500',
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    available: { label: 'Waiting for Load', cls: 'bg-blue-50 text-blue-600' },
    'on-trip': { label: 'Loading', cls: 'bg-green-100 text-green-700' },
    maintenance: { label: 'Maintenance', cls: 'bg-orange-100 text-orange-600' },
    offline: { label: 'Offline', cls: 'bg-gray-100 text-gray-500' },
  };
  const { label, cls } = map[status ?? ''] ?? {
    label: status ?? '—',
    cls: 'bg-gray-100 text-gray-500',
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
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

// ─── Action Cell ─────────────────────────────────────────────────────────────

function VehicleActions({
  vehicle,
  onDelete,
  onRejectKyc,
}: {
  vehicle: Vehicle;
  onDelete?: (id: string) => void;
  onRejectKyc?: (id: string, reason: string) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const ownerRefItem =
    vehicle.ownerRef?.item && typeof vehicle.ownerRef.item === 'object'
      ? vehicle.ownerRef.item
      : null;
  const legacyOwner = typeof vehicle.owner === 'object' ? vehicle.owner : null;
  const resolvedOwner = ownerRefItem ?? legacyOwner;
  const driver = typeof vehicle.driver === 'object' ? vehicle.driver : null;
  const phone =
    (resolvedOwner as { phone?: string } | null)?.phone ||
    (driver as { phone?: string } | null)?.phone;

  const handleCall = () => {
    if (phone) window.open(`tel:${phone}`);
  };

  const handleConfirmDelete = () => {
    onDelete?.(vehicle._id);
    setDeleteOpen(false);
  };

  const handleConfirmReject = () => {
    if (rejectReason.trim().length < 5) return;
    onRejectKyc?.(vehicle._id, rejectReason.trim());
    setRejectOpen(false);
    setRejectReason('');
  };

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Tooltip label="Edit">
            <button
              className="text-blue-400 hover:text-blue-600 p-0.5"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          <Tooltip label={phone ? `Call ${phone}` : 'No phone available'}>
            <button
              className={`p-0.5 ${phone ? 'text-blue-400 hover:text-blue-600' : 'text-gray-300 cursor-not-allowed'}`}
              onClick={handleCall}
              disabled={!phone}
            >
              <Phone className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          <Tooltip label="Comment">
            <button
              className="text-blue-400 hover:text-blue-600 p-0.5"
              onClick={() => setCommentOpen(true)}
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          <Tooltip label="Delete">
            <button
              className="text-red-400 hover:text-red-600 p-0.5"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip label="Preview Documents">
            <Link href={`/vehicles/${vehicle._id}`}>
              <button className="text-blue-400 hover:text-blue-600 p-0.5">
                <FileCheck className="h-3.5 w-3.5" />
              </button>
            </Link>
          </Tooltip>
          <Tooltip label="Reject KYC">
            <button
              className="text-red-400 hover:text-red-600 p-0.5"
              onClick={() => setRejectOpen(true)}
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{vehicle.vehicleNumber}</span>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject KYC</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting KYC for{' '}
              <span className="font-semibold">{vehicle.vehicleNumber}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor={`reject-reason-${vehicle._id}`}>Reason</Label>
            <Textarea
              id={`reject-reason-${vehicle._id}`}
              placeholder="Enter rejection reason (min. 5 characters)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={rejectReason.trim().length < 5}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject KYC
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comment modal */}
      {commentOpen && (
        <TruckCommentModal
          vehicleId={vehicle._id}
          vehicleNumber={vehicle.vehicleNumber}
          onClose={() => setCommentOpen(false)}
        />
      )}

      {/* Edit modal */}
      {editOpen && (
        <EditVehicleModal
          vehicle={vehicle}
          isOpen={editOpen}
          onCloseAction={() => setEditOpen(false)}
          onSuccessAction={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

// ─── EditableCell ─────────────────────────────────────────────────────────────

function EditableCell({ value }: { value: string }) {
  return (
    <span className="flex items-center gap-1 text-sm text-gray-600">
      {value || '—'}
      <Pencil className="h-3 w-3 text-blue-400 flex-shrink-0" />
    </span>
  );
}

// ─── Market Table ─────────────────────────────────────────────────────────────

interface MarketTableProps {
  vehicles: Vehicle[] | undefined;
  loading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onDelete?: (id: string) => void;
  onRejectKyc?: (id: string, reason: string) => void;
}

export function MarketTable({
  vehicles,
  loading,
  pagination,
  onPageChange,
  onDelete,
  onRejectKyc,
}: MarketTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="bg-white rounded border p-12 flex flex-col items-center gap-2 text-gray-400">
        <FileText className="h-10 w-10 opacity-20" />
        <span className="text-sm">No data</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b">
            <TableHead className="text-xs font-semibold text-gray-600 w-24">
              <span className="flex items-center gap-1">
                <Settings2 className="h-3.5 w-3.5" /> Action
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Truck</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">ID</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                Truck Type <ChevronDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                Status <ChevronDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                KYC Status <ChevronDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Tracking</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Driver</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Supplier Count</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">City</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Region</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                Remarks <ChevronDown className="h-3 w-3" />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => {
            const owner = typeof vehicle.owner === 'object' ? vehicle.owner : null;
            const driver = typeof vehicle.driver === 'object' ? vehicle.driver : null;
            const driverObj = owner || driver;

            return (
              <TableRow key={vehicle._id} className="hover:bg-gray-50">
                {/* Action */}
                <TableCell className="py-2">
                  <VehicleActions vehicle={vehicle} onDelete={onDelete} onRejectKyc={onRejectKyc} />
                </TableCell>

                {/* Truck */}
                <TableCell>
                  <Link
                    href={`/vehicles/${vehicle._id}`}
                    className="text-blue-600 hover:underline text-sm font-semibold tracking-wide"
                  >
                    {vehicle.vehicleNumber}
                  </Link>
                </TableCell>

                {/* ID */}
                <TableCell className="text-sm text-gray-500">
                  {vehicle._id.slice(-4).toUpperCase()}
                </TableCell>

                {/* Truck Type */}
                <TableCell className="text-sm text-gray-700">{vehicle.truckType || '—'}</TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={vehicle.availability} />
                </TableCell>

                {/* KYC Status */}
                <TableCell>
                  <KycBadge status={vehicle.verificationStatus} />
                </TableCell>

                {/* Tracking — editable inline placeholder */}
                <TableCell>
                  <EditableCell value={vehicle.hasGPS ? 'GPS' : ''} />
                </TableCell>

                {/* Driver */}
                <TableCell>
                  {driverObj ? (
                    <EditableCell value={driverObj.phone || driverObj.name} />
                  ) : (
                    <EditableCell value="" />
                  )}
                </TableCell>

                {/* Supplier Count — placeholder (no model field yet) */}
                <TableCell className="text-sm text-gray-700 text-center">
                  {vehicle.supplierCount ?? 0}
                </TableCell>

                {/* City */}
                <TableCell className="text-sm text-gray-700">
                  {vehicle.registrationCity || '—'}
                </TableCell>

                {/* Region — placeholder */}
                <TableCell className="text-sm text-gray-700">{vehicle.region || '—'}</TableCell>

                {/* Remarks */}
                <TableCell className="text-sm text-gray-600">
                  {vehicle.remarks || vehicle.verificationStatus === 'pending'
                    ? 'Verification'
                    : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
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
