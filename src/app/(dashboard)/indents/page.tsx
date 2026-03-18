'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Trash2,
  Pencil,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Inbox,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bookingApi, staffApi } from '@/lib/api';
import { Booking, Staff } from '@/types';
import { AssignDriverModal } from '@/components/bookings/AssignDriverModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CreateBookingModal } from '@/components/bookings/CreateBookingModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(ts?: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en', { month: 'short' });
  const yr = String(d.getFullYear()).slice(2);
  return `${day}-${mon}-${yr}`;
}

function tatHours(from?: string, to?: string): string {
  if (!from) return '—';
  const end = to ? new Date(to) : new Date();
  const diff = (end.getTime() - new Date(from).getTime()) / 3600000;
  return diff < 0 ? '—' : diff.toFixed(1);
}

function statusColor(status: string): string {
  const s = status?.toLowerCase() || '';
  if (s === 'created' || s === 'under-review') return 'bg-yellow-100 text-yellow-800';
  if (s === 'assigned') return 'bg-blue-100 text-blue-800';
  if (s === 'in-transit' || s === 'loaded') return 'bg-purple-100 text-purple-800';
  if (s === 'delivered' || s === 'pod-received') return 'bg-green-100 text-green-800';
  if (s === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    created: 'New',
    'under-review': 'Under Review',
    assigned: 'Assigned',
    'in-transit': 'In Transit',
    loaded: 'Loaded',
    delivered: 'Delivered',
    'pod-received': 'POD Received',
    cancelled: 'Cancelled',
  };
  return map[status] || status;
}

// ─── Table primitives ─────────────────────────────────────────────────────────

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 border-b border-gray-200 select-none',
        className
      )}
    >
      {children}
    </th>
  );
}

function ThSearch({ label }: { label: string }) {
  return (
    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 border-b border-gray-200 select-none">
      <div className="flex items-center gap-1">
        {label} <Search className="h-2.5 w-2.5 opacity-40 shrink-0" />
      </div>
    </th>
  );
}

function Td({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <td
      title={title}
      className={cn(
        'px-3 py-2 text-xs text-gray-600 whitespace-nowrap border-b border-gray-100',
        className
      )}
    >
      {children}
    </td>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────

const DELETE_REASONS = ['Cancelled by customer', 'Placement failure'] as const;

function DeleteModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState<string>('Placement failure');
  const [remarks, setRemarks] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await bookingApi.cancel(booking._id, { reason: remarks ? `${reason}: ${remarks}` : reason });
      toast.success('Indent deleted successfully');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to delete indent');
    } finally {
      setDeleting(false);
    }
  }

  const createdAt = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) +
      ' ' +
      new Date(booking.createdAt).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
  const expiryAt = booking.expiryTime
    ? new Date(booking.expiryTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) +
      ' ' +
      new Date(booking.expiryTime).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Delete Indent</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Route + size */}
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              {booking.pickup?.city || '—'}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
              {booking.drop?.city || '—'}
            </span>
            {booking.length && (
              <span className="text-gray-600">
                {booking.length.value} {booking.length.unit === 'ft' ? 'Feet' : 'm'}
              </span>
            )}
          </div>

          {/* Type + timestamps */}
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-0.5">{booking.bookingType || 'Indent'}</p>
            <p>
              Created at: <span className="text-gray-800">{createdAt}</span>
              {'  '}
              Expiring at: <span className="text-gray-800">{expiryAt}</span>
            </p>
          </div>

          {/* Reason radio */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              <span className="text-red-500 mr-1">*</span>Reason
            </p>
            <div className="flex items-center gap-6">
              {DELETE_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
                >
                  <input
                    type="radio"
                    name="delete-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-blue-600 h-4 w-4"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <p className="text-sm text-gray-700 mb-1.5">Remarks</p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add Remarks"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none placeholder-gray-400"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              {deleting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Manage Indent Modal ──────────────────────────────────────────────────────

function timeLeftStr(expiryTime?: string): string {
  if (!expiryTime) return '';
  const diff = new Date(expiryTime).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  return `${h}h`;
}

const EXPIRY_PRESETS = [24, 36, 48];

function ManageIndentModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [materialTypes, setMaterialTypes] = useState<string[]>([]);
  const [truckTypes, setTruckTypes] = useState<string[]>([]);
  const [trafficStaff, setTrafficStaff] = useState<Staff[]>([]);

  // Form state — pre-fill from booking
  const [trafficController, setTrafficController] = useState(booking.trafficController?._id || '');
  const [numberOfTrucks, setNumberOfTrucks] = useState(String(booking.numberOfTrucks ?? 1));
  const [weight, setWeight] = useState(String(booking.weight?.value ?? ''));
  const [materialType, setMaterialType] = useState(booking.materialType || '');
  const [customerPrice, setCustomerPrice] = useState(String(booking.customerPrice ?? 0));
  const [supplierPrice, setSupplierPrice] = useState(String(booking.supplierPrice ?? 0));
  const [truckTypeNeeded, setTruckTypeNeeded] = useState(booking.truckTypeNeeded || '');
  const [expiryTime, setExpiryTime] = useState(booking.expiryTime || '');
  const [postToSupplier, setPostToSupplier] = useState(booking.postToSupplier !== false);

  useEffect(() => {
    // Material types are hardcoded in the backend validator — use same list
    setMaterialTypes([
      'FMCG',
      'electronics',
      'furniture',
      'steel',
      'cement',
      'tiles',
      'chemicals',
      'textiles',
      'agriculture',
      'automobile-parts',
      'machinery',
      'paper',
      'pharma',
      'plastic',
      'food-grains',
      'vegetables-fruits',
      'general-cargo',
      'other',
    ]);
    // Truck types come from master data
    const { masterDataApi } = require('@/lib/api');
    masterDataApi
      .getByCategory('truck-type', false)
      .then((res: any) => setTruckTypes((res.data.data || []).map((x: any) => x.value || x.name)))
      .catch(() => {});
    // Traffic staff
    staffApi
      .getAll({ department: 'traffic', limit: 100 })
      .then((res: any) => setTrafficStaff(res.data.data.staff || []))
      .catch(() => {});
  }, []);

  function applyExpiryPreset(hours: number) {
    const d = new Date(Date.now() + hours * 3600000);
    setExpiryTime(d.toISOString());
  }

  async function handleSave() {
    setSaving(true);
    try {
      await bookingApi.update(booking._id, {
        trafficController: trafficController || undefined,
        numberOfTrucks: Number(numberOfTrucks) || 1,
        weight: weight ? Number(weight) : undefined,
        materialType: materialType || undefined,
        customerPrice: customerPrice !== '' ? Number(customerPrice) : undefined,
        supplierPrice: supplierPrice !== '' ? Number(supplierPrice) : undefined,
        truckTypeNeeded: truckTypeNeeded || undefined,
        expiryTime: expiryTime || undefined,
        postToSupplier,
      } as any);
      toast.success('Indent updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update indent');
    } finally {
      setSaving(false);
    }
  }

  const tLeft = timeLeftStr(booking.expiryTime);
  const createdStr = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      }) +
      ' ' +
      new Date(booking.createdAt).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const expiryStr = expiryTime
    ? new Date(expiryTime).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      }) +
      ' ' +
      new Date(expiryTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 overflow-y-auto">
      {/* Nav bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1a2744] text-white shrink-0">
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold">Manage Indent</span>
      </div>

      <div className="flex flex-col items-center py-6 px-4">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Booking header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">
                #{booking.bookingId?.slice(-6).toUpperCase() || booking._id.slice(-6).toUpperCase()}{' '}
                | {booking.trafficController?.name || booking.createdByStaff?.name || '—'}
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{createdStr}</span>
                {tLeft && <span className="text-blue-500 font-medium">| Time Left: {tLeft}</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  {booking.pickup?.city || '—'}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  {booking.drop?.city || '—'}
                </div>
              </div>
              <span className="text-xs border border-blue-200 text-blue-600 rounded px-2 py-0.5 font-medium bg-blue-50">
                0 Stop(s)
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="px-5 py-5 space-y-4">
            <p className="text-xs text-gray-500">{booking.bookingType || 'Indent'}</p>

            {/* Traffic + No of Vehicles */}
            <div className="grid grid-cols-2 gap-3">
              <FloatSelect
                label="Traffic"
                value={trafficController}
                onChange={setTrafficController}
              >
                <option value="">— None —</option>
                {trafficStaff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </FloatSelect>
              <FloatInput
                label="No of Vehicle *"
                value={numberOfTrucks}
                onChange={setNumberOfTrucks}
                type="number"
              />
            </div>

            {/* Ton + Material type */}
            <div className="grid grid-cols-2 gap-3">
              <FloatSelect label="Ton" value={weight} onChange={setWeight}>
                <option value="">—</option>
                {[1, 2, 3, 5, 10, 15, 20, 25].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </FloatSelect>
              <FloatSelect label="Material type" value={materialType} onChange={setMaterialType}>
                <option value="">Select</option>
                {materialTypes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </FloatSelect>
            </div>

            {/* Customer Price + Supplier Price */}
            <div className="grid grid-cols-2 gap-3">
              <FloatInput
                label="Customer Price"
                value={customerPrice}
                onChange={setCustomerPrice}
                type="number"
              />
              <FloatInput
                label="Supplier Price"
                value={supplierPrice}
                onChange={setSupplierPrice}
                type="number"
              />
            </div>

            {/* Truck Type */}
            <FloatSelect label="Truck Type" value={truckTypeNeeded} onChange={setTruckTypeNeeded}>
              <option value="">Select</option>
              {truckTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </FloatSelect>

            {/* Expiry time + presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Expiry time: <span className="font-medium text-gray-800">{expiryStr}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {EXPIRY_PRESETS.map((h) => (
                    <button
                      key={h}
                      onClick={() => applyExpiryPreset(h)}
                      className="px-2.5 py-0.5 rounded-full border border-purple-400 text-purple-600 text-xs font-medium hover:bg-purple-50 transition-colors"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Post to Supplier */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={postToSupplier}
                onChange={(e) => setPostToSupplier(e.target.checked)}
                className="h-4 w-4 accent-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Post to Supplier</span>
            </label>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{' '}
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Float input / select helpers ─────────────────────────────────────────────

function FloatInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="relative border border-gray-300 rounded-lg px-3 pt-4 pb-2 focus-within:border-blue-500 transition-colors">
      <label className="absolute left-3 -top-2 text-[10px] text-blue-500 bg-white px-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm outline-none bg-transparent text-gray-800"
      />
    </div>
  );
}

function FloatSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative border border-gray-300 rounded-lg focus-within:border-blue-500 transition-colors">
      <label className="absolute left-3 -top-2 text-[10px] text-gray-500 bg-white px-1 z-10">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm appearance-none outline-none bg-transparent pr-8 rounded-lg"
      >
        {children}
      </select>
      <ChevronLeft className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 -rotate-90 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── Indent Comment Modal ──────────────────────────────────────────────────────

function CommentDrawer({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    bookingApi
      .getAuditLogs(booking._id)
      .then((res) => setLogs(res.data.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [booking._id]);

  async function handleSubmitNote() {
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      await bookingApi.addNote(booking._id, { text: noteText });
      setNoteText('');
      const res = await bookingApi.getAuditLogs(booking._id);
      setLogs(res.data.data || []);
    } catch {
      toast.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Indent Comment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input row */}
        <div className="flex gap-3 px-5 py-4 border-b border-gray-100">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleSubmitNote()}
            placeholder="Please enter comments"
            rows={3}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-xs outline-none focus:border-blue-500 resize-none"
          />
          <button
            onClick={handleSubmitNote}
            disabled={submitting || !noteText.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors h-fit self-start mt-0.5 whitespace-nowrap"
          >
            {submitting ? (
              <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Submit'
            )}
          </button>
        </div>

        {/* Comments table */}
        <div className="flex-1 overflow-y-auto max-h-80">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Inbox className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">No data</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-32">
                    Topic
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    Comment
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-32 whitespace-nowrap">
                    Created By
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-32 whitespace-nowrap">
                    Created On
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, i) => {
                  const topic =
                    typeof log.action === 'string'
                      ? log.action
                          .replace(/_/g, ' ')
                          .toLowerCase()
                          .replace(/^\w/, (c: string) => c.toUpperCase())
                      : 'Note';
                  const comment = log.context?.description || log.message || log.text || '—';
                  const user =
                    log.user?.name ||
                    log.user?.email ||
                    (typeof log.user === 'string' ? log.user : '—');
                  const date = fmtDate(log.createdAt || log.timestamp);
                  return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{topic}</td>
                      <td className="px-4 py-2.5 text-gray-700">{comment}</td>
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{user}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bidding Modal ────────────────────────────────────────────────────────────

function BiddingModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [saving, setSaving] = useState(false);

  const [supplierId, setSupplierId] = useState(''); // maps to driverId
  const [bidPrice, setBidPrice] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [truckStatus, setTruckStatus] = useState('');
  const [truckLocation, setTruckLocation] = useState('');

  // Load available drivers on mount
  useEffect(() => {
    const { driverApi } = require('@/lib/api');
    driverApi
      .getAvailable({})
      .then((res: any) => setDrivers(res?.data?.data || []))
      .catch(() => {
        // fallback to getAll if getAvailable fails
        driverApi
          .getAll({ limit: 200 })
          .then((r: any) => setDrivers(r?.data?.data?.drivers || []))
          .catch(() => {});
      });
  }, []);

  // Fetch vehicles for selected driver, auto-fill status + location from first vehicle
  useEffect(() => {
    if (!supplierId) {
      setVehicles([]);
      setVehicleId('');
      setTruckStatus('');
      setTruckLocation('');
      return;
    }
    const { vehicleApi } = require('@/lib/api');
    setLoadingVehicles(true);
    vehicleApi
      .getByDriver(supplierId)
      .then((res: any) => {
        const vList: any[] = res?.data?.data || [];
        setVehicles(vList);
        if (vList.length > 0) {
          setVehicleId(vList[0]._id);
          fillVehicleFields(vList[0]);
        } else {
          setVehicleId('');
          setTruckStatus('');
          setTruckLocation('');
        }
      })
      .catch(() => {
        setVehicles([]);
        setVehicleId('');
        setTruckStatus('');
        setTruckLocation('');
      })
      .finally(() => setLoadingVehicles(false));
  }, [supplierId]);

  function fillVehicleFields(v: any) {
    setTruckStatus(v.availability || v.status || '');
    setTruckLocation(
      v.lastKnownLocation?.city || v.lastKnownLocation?.state || v.registrationCity || ''
    );
  }

  function handleVehicleChange(id: string) {
    setVehicleId(id);
    const v = vehicles.find((x: any) => x._id === id);
    if (v) fillVehicleFields(v);
    else {
      setTruckStatus('');
      setTruckLocation('');
    }
  }

  async function handleSubmit() {
    if (!supplierId || !vehicleId) {
      toast.error('Please select a supplier and truck');
      return;
    }
    setSaving(true);
    try {
      await bookingApi.assignDriver(booking._id, { driverId: supplierId, vehicleId });
      if (bidPrice) {
        await bookingApi.update(booking._id, { supplierPrice: Number(bidPrice) } as any);
      }
      toast.success('Bid submitted successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit bid');
    } finally {
      setSaving(false);
    }
  }

  const tLeft = timeLeftStr(booking.expiryTime);
  const createdStr = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      }) +
      ' ' +
      new Date(booking.createdAt).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 overflow-y-auto">
      {/* Nav bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1a2744] text-white shrink-0">
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold">Bidding</span>
      </div>

      <div className="flex flex-col items-center py-6 px-4">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Booking header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">
                #{booking.bookingId?.slice(-6).toUpperCase() || booking._id.slice(-6).toUpperCase()}{' '}
                | {booking.trafficController?.name || booking.createdByStaff?.name || '—'}
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{createdStr}</span>
                {tLeft && <span className="text-blue-500 font-medium">| Time Left: {tLeft}</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  {booking.pickup?.city || '—'}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  {booking.drop?.city || '—'}
                </div>
              </div>
              <span className="text-xs border border-blue-200 text-blue-600 rounded px-2 py-0.5 font-medium bg-blue-50">
                0 Stop(s)
              </span>
            </div>
          </div>

          {/* Info table */}
          <div className="border-b border-gray-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Employee
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Truck Type
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Ton
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Material Type
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Lane Code
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-gray-700">
                    {booking.trafficController?.name || '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{booking.truckTypeNeeded || '—'}</td>
                  <td className="px-4 py-2 text-gray-700">{booking.weight?.value ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-700">{booking.materialType || '—'}</td>
                  <td className="px-4 py-2 text-gray-700">{booking.laneCode || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Form */}
          <div className="px-5 py-5 space-y-4">
            <p className="text-xs text-gray-500">indent</p>

            {/* Supplier select */}
            <div className="relative border border-blue-500 rounded-lg focus-within:border-blue-600 transition-colors">
              <label className="absolute left-3 -top-2 text-[10px] text-blue-500 bg-white px-1 z-10">
                Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm appearance-none outline-none bg-transparent pr-8 rounded-lg"
              >
                <option value="">Select Supplier</option>
                {drivers.map((d: any) => (
                  <option key={d._id} value={d._id}>
                    {d.name ||
                      d.user?.name ||
                      `${d.firstName || ''} ${d.lastName || ''}`.trim() ||
                      d._id}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 -rotate-90 text-gray-400 pointer-events-none" />
            </div>

            {/* Bid Price */}
            <input
              type="number"
              value={bidPrice}
              onChange={(e) => setBidPrice(e.target.value)}
              placeholder="Bid Price"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
            />

            {/* Truck No */}
            <div className="relative border border-gray-300 rounded-lg focus-within:border-blue-500 transition-colors">
              <label className="absolute left-3 -top-2 text-[10px] text-gray-500 bg-white px-1 z-10">
                Truck No
              </label>
              <select
                value={vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                disabled={!supplierId || loadingVehicles}
                className="w-full px-3 py-3 text-sm appearance-none outline-none bg-transparent pr-8 rounded-lg disabled:opacity-50"
              >
                <option value="">{loadingVehicles ? 'Loading...' : 'Select Truck'}</option>
                {vehicles.map((v: any) => (
                  <option key={v._id} value={v._id}>
                    {v.vehicleNumber || v._id}
                  </option>
                ))}
              </select>
              <ChevronLeft className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 -rotate-90 text-gray-400 pointer-events-none" />
            </div>

            {/* Truck Status — auto-filled from vehicle.availability */}
            <div className="relative border border-gray-300 rounded-lg bg-gray-50">
              <label className="absolute left-3 -top-2 text-[10px] text-gray-500 bg-gray-50 px-1 z-10">
                Truck Status *
              </label>
              <input
                type="text"
                value={truckStatus}
                readOnly
                placeholder="Auto-filled on truck selection"
                className="w-full px-3 py-3 text-sm outline-none bg-transparent text-gray-700 cursor-default"
              />
            </div>

            {/* Truck Location — auto-filled from vehicle.lastKnownLocation */}
            <div className="relative border border-gray-300 rounded-lg bg-gray-50">
              <label className="absolute left-3 -top-2 text-[10px] text-gray-500 bg-gray-50 px-1 z-10">
                Truck Location *
              </label>
              <input
                type="text"
                value={truckLocation}
                readOnly
                placeholder="Auto-filled on truck selection"
                className="w-full px-3 py-3 text-sm outline-none bg-transparent text-gray-700 cursor-default"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{' '}
                  Submitting...
                </>
              ) : (
                'Submit Bid'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Matched Trucks Modal ─────────────────────────────────────────────────────

type TruckTab = 'bidding' | 'market' | 'history' | 'own' | 'unloading';

function MatchedTrucksModal({
  booking,
  initialTab,
  onClose,
  onAssign,
}: {
  booking: Booking;
  initialTab: TruckTab;
  onClose: () => void;
  onAssign: () => void;
}) {
  const [tab, setTab] = useState<TruckTab>(initialTab);
  const [ownVehicles, setOwnVehicles] = useState<any[]>([]);
  const [marketVehicles, setMarketVehicles] = useState<any[]>([]);
  const [biddingDrivers, setBiddingDrivers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [unloadingTrucks, setUnloadingTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const { vehicleApi, bookingApi: bApi } = require('@/lib/api');

    Promise.all([
      // Own: available vehicles matching truckType
      vehicleApi.getAll({
        limit: 50,
        ...(booking.truckTypeNeeded ? { truckType: booking.truckTypeNeeded } : {}),
      }),
      // Full booking for interestedDrivers + statusHistory
      bApi.getById(booking._id),
      // Unloading: trucks at destination whose dropCity matches this indent's pickupCity
      booking.pickup?.city
        ? bApi.getUnloadingTrucks({ dropCity: booking.pickup.city, limit: 50 })
        : Promise.resolve(null),
    ])
      .then(([vRes, bRes, uRes]: any[]) => {
        const vehicles: any[] = vRes?.data?.data?.vehicles || [];
        setOwnVehicles(vehicles.filter((v: any) => v.availability === 'available'));
        setMarketVehicles(vehicles);

        const full = bRes?.data?.data;
        // Bidding: interestedDrivers populated or just IDs
        const interested: any[] = full?.interestedDrivers || [];
        setBiddingDrivers(interested);
        // History: statusHistory
        setHistory(full?.statusHistory || []);

        // Unloading trucks
        setUnloadingTrucks(uRes?.data?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [booking._id, booking.truckTypeNeeded, booking.pickup?.city]);

  const TABS: { key: TruckTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'bidding',
      label: 'Bidding',
      icon: (
        <span className="inline-flex items-center justify-center h-4 w-7 rounded-full border border-blue-500 text-[8px] font-bold text-blue-600">
          BID
        </span>
      ),
    },
    {
      key: 'market',
      label: 'Matched',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-orange-500" fill="currentColor">
          <path d="M18 2H6L2 8h20L18 2zm-8 4 1-3h2l1 3H10zm-4 0 1.5-3H9L8 6H6zm8 0-1-3h1.5L16 6h-2zM2 9v11h9v-4h2v4h9V9H2zm14 7h-3v-3h3v3z" />
        </svg>
      ),
    },
    { key: 'history', label: 'History', icon: null },
    {
      key: 'own',
      label: 'Own',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500" fill="currentColor">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5 1.96 2.5H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
      ),
    },
    {
      key: 'unloading',
      label: 'Unloading',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-500" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L11 13.17V7h2v6.17l2.59-2.58L17 12l-5 5z" />
        </svg>
      ),
    },
  ];

  function AssignBtn() {
    return (
      <button
        onClick={() => {
          onAssign();
          onClose();
        }}
        className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition-colors"
        title="Assign"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  function TruckTable({
    rows,
    type,
  }: {
    rows: any[];
    type: 'vehicle' | 'driver' | 'history' | 'market' | 'unloading';
  }) {
    if (loading)
      return (
        <div className="p-6 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      );
    if (rows.length === 0)
      return (
        <div className="flex flex-col items-center justify-center py-14 text-gray-400">
          <Inbox className="h-10 w-10 mb-2 opacity-20" />
          <p className="text-sm">No data</p>
        </div>
      );

    // History tab
    if (type === 'history')
      return (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Note
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2.5 text-gray-700 capitalize">
                  {h.status?.replace(/-/g, ' ') || '—'}
                </td>
                <td className="px-4 py-2.5 text-gray-600">{h.note || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                  {fmtDate(h.timestamp || h.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    // Market/Matched tab — extra Supplier, Truck Type, Destination columns
    if (type === 'market')
      return (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Actions
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Supplier
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Truck No
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Truck Type
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Destination
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                TAT(hrs)
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Distance(km)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2.5">
                  <AssignBtn />
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {v.owner?.name || v.driver?.name || '—'}
                </td>
                <td className="px-4 py-2.5 text-gray-700 font-medium">{v.vehicleNumber || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">{v.truckType || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">
                  {v.lastKnownLocation?.city || v.registrationCity || '—'}
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {tatHours(booking.createdAt, booking.expiryTime)}
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {booking.actualKm ? `${booking.actualKm} km` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    // Bidding tab — Actions, Supplier, Supplier Price, Remark, Created by
    if (type === 'driver')
      return (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Actions
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Supplier
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Supplier Price
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Remark
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Created by
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2.5">
                  <AssignBtn />
                </td>
                <td className="px-4 py-2.5 text-gray-700 font-medium">
                  {row.name || row.user?.name || '—'}
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {booking.supplierPrice ? `₹${booking.supplierPrice}` : '—'}
                </td>
                <td className="px-4 py-2.5 text-gray-600">{row.remark || row.notes || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{row.createdBy || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    // Unloading tab — trucks currently unloading at a city matching our pickup
    if (type === 'unloading')
      return (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Actions
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Truck No
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Truck Type
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Driver
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                At City
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2.5">
                  <AssignBtn />
                </td>
                <td className="px-4 py-2.5 text-gray-700 font-medium">
                  {row.vehicle?.vehicleNumber || '—'}
                </td>
                <td className="px-4 py-2.5 text-gray-600">{row.vehicle?.truckType || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">{row.driver?.name || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">{row.dropCity || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 capitalize">
                    {row.status?.replace(/-/g, ' ') || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    // Own tab — Actions, Truck No, TAT, Distance
    return (
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
              Actions
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
              Truck No
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
              TAT(hrs)
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase">
              Distance(km)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, i: number) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2.5">
                <AssignBtn />
              </td>
              <td className="px-4 py-2.5 text-gray-700 font-medium">{row.vehicleNumber || '—'}</td>
              <td className="px-4 py-2.5 text-gray-600">
                {tatHours(booking.createdAt, booking.expiryTime)}
              </td>
              <td className="px-4 py-2.5 text-gray-600">
                {booking.actualKm ? `${booking.actualKm} km` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const activeRows =
    tab === 'own'
      ? ownVehicles
      : tab === 'market'
        ? marketVehicles
        : tab === 'bidding'
          ? biddingDrivers
          : tab === 'unloading'
            ? unloadingTrucks
            : history;
  const activeType: 'vehicle' | 'driver' | 'history' | 'market' | 'unloading' =
    tab === 'history'
      ? 'history'
      : tab === 'market'
        ? 'market'
        : tab === 'bidding'
          ? 'driver'
          : tab === 'unloading'
            ? 'unloading'
            : 'vehicle';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[80vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {booking.pickup?.city || '—'}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {booking.drop?.city || '—'}
            </span>
            {booking.truckTypeNeeded && (
              <span className="text-gray-500">Truck type: {booking.truckTypeNeeded}</span>
            )}
            {booking.trafficController?.name && (
              <span className="text-gray-500">Traffic: {booking.trafficController.name}</span>
            )}
            {booking.customer && (
              <span className="text-gray-500">
                Customer: {(booking.customer as any)?.companyName || 'Indent'}
              </span>
            )}
          </div>
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <TruckTable rows={activeRows} type={activeType} />
        </div>
      </div>
    </div>
  );
}

// ─── BID Tag ──────────────────────────────────────────────────────────────────

function BidTag({ bookingType, onClick }: { bookingType?: string; onClick?: () => void }) {
  const label =
    bookingType === 'direct-load' ? 'DL' : bookingType === 'direct-invoice' ? 'DI' : 'BID';
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white leading-none transition-colors"
    >
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'created,under-review', label: 'New' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in-transit,loaded', label: 'In Transit' },
  { key: 'delivered,pod-received', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 25;

export default function IndentsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [unloadingCounts, setUnloadingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [commentTarget, setCommentTarget] = useState<Booking | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [bidTarget, setBidTarget] = useState<Booking | null>(null);
  const [truckModalTarget, setTruckModalTarget] = useState<{
    booking: Booking;
    tab: TruckTab;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [indentTypeEditId, setIndentTypeEditId] = useState<string | null>(null);
  const [savingIndentType, setSavingIndentType] = useState<string | null>(null);

  const updateIndentType = async (id: string, value: 'FTL' | 'PTL' | 'LCL') => {
    setSavingIndentType(id);
    try {
      await bookingApi.update(id, { indentType: value });
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, indentType: value } : b)));
      toast.success('Transaction type updated');
    } catch {
      toast.error('Failed to update transaction type');
    } finally {
      setSavingIndentType(null);
      setIndentTypeEditId(null);
    }
  };

  const fetchBookings = useCallback(
    async (opts?: { page?: number; search?: string; status?: string }) => {
      setLoading(true);
      try {
        const status = opts?.status ?? (activeTab === 'all' ? undefined : activeTab);
        const res = await bookingApi.getAll({
          page: opts?.page ?? page,
          limit: PAGE_SIZE,
          search: (opts?.search ?? search) || undefined,
          status,
        });
        setBookings(res.data.data.bookings || []);
        const p = res.data.data.pagination;
        setTotalPages(p.totalPages ?? 1);
        setTotalItems(p.totalItems ?? 0);
      } catch {
        toast.error('Failed to fetch indents');
      } finally {
        setLoading(false);
      }
    },
    [activeTab, page, search]
  );

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  // Fetch unloading truck counts for all visible indents
  useEffect(() => {
    if (bookings.length === 0) return;
    const uniqueCities = [
      ...new Set(bookings.map((b) => b.pickup?.city).filter(Boolean)),
    ] as string[];
    Promise.all(
      uniqueCities.map((city) =>
        bookingApi
          .getUnloadingTrucks({ dropCity: city, limit: 50 })
          .then((res) => ({ city, count: (res.data.data || []).length }))
          .catch(() => ({ city, count: 0 }))
      )
    ).then((results) => {
      const cityCountMap: Record<string, number> = {};
      results.forEach(({ city, count }) => {
        cityCountMap[city] = count;
      });
      const counts: Record<string, number> = {};
      bookings.forEach((b) => {
        if (b.pickup?.city) counts[b._id] = cityCountMap[b.pickup.city] ?? 0;
      });
      setUnloadingCounts(counts);
    });
  }, [bookings]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchBookings({ page: 1 });
  }

  function handleTabChange(key: string) {
    setActiveTab(key);
    setPage(1);
  }

  function handleApprove(b: Booking) {
    setConfirmTarget(b);
  }

  const activeTabLabel = STATUS_TABS.find((t) => t.key === activeTab)?.label || 'All';

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Status Tabs ── */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-0 overflow-x-auto scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              'px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider ml-1">
          {activeTabLabel}
        </span>

        <div className="flex-1" />

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search indents..."
              className="h-7 pl-7 pr-3 text-xs w-52 border-gray-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  fetchBookings({ page: 1, search: '' });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-xs">
            Search
          </Button>
        </form>

        <button
          onClick={() => fetchBookings()}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 ml-1"
          title="Refresh"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto bg-white">
        {loading ? (
          <div className="space-y-0">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-10 border-b border-gray-100 bg-white flex items-center px-3 gap-3"
              >
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Inbox className="h-12 w-12 mb-2 opacity-25" />
            <p className="text-sm font-medium">No indents found</p>
            <p className="text-xs mt-1 text-gray-400">
              Try adjusting your filters or create a new indent
            </p>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse min-w-max">
            <thead className="sticky top-0 z-10">
              <tr>
                <Th className="w-28">Actions</Th>
                <ThSearch label="Id" />
                <ThSearch label="Branch" />
                <Th>Lane Code</Th>
                <Th>Is Adhoc Indent</Th>
                <Th>Indent Type</Th>
                <ThSearch label="Traffic" />
                <ThSearch label="Customer" />
                <ThSearch label="Source" />
                <ThSearch label="Source Code" />
                <ThSearch label="Destination" />
                <Th>Destination Code</Th>
                <Th>Truck Type</Th>
                <th
                  className="bg-gray-50 border-b border-gray-200 select-none whitespace-nowrap"
                  colSpan={3}
                >
                  <div className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    Matched trucks
                  </div>
                  <div className="flex border-t border-gray-200">
                    <div className="flex-1 px-2 py-1.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">
                      Own
                    </div>
                    <div className="flex-1 px-2 py-1.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">
                      Market
                    </div>
                    <div className="flex-1 px-2 py-1.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wide">
                      Bidding
                    </div>
                  </div>
                </th>
                <Th>Indent date</Th>
                <Th>TAT(hrs)</Th>
                <ThSearch label="Created by" />
                <Th>Count</Th>
                <Th>Remarks</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr
                  key={b._id}
                  className={cn(
                    'hover:bg-blue-50/40 transition-colors',
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  )}
                >
                  {/* Actions */}
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <button
                        aria-label="Approve / View"
                        onClick={() => handleApprove(b)}
                        className="text-green-500 hover:text-green-700 p-0.5"
                        title="Load Confirmation"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Delete"
                        onClick={() => setDeleteTarget(b)}
                        className="text-red-400 hover:text-red-600 p-0.5"
                        title="Delete indent"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Edit"
                        onClick={() => setEditTarget(b)}
                        className="text-blue-400 hover:text-blue-600 p-0.5"
                        title="Manage Indent"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Comments"
                        onClick={() => setCommentTarget(b)}
                        className="text-blue-400 hover:text-blue-600 p-0.5"
                        title="Notes & activity"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                      <BidTag bookingType={b.bookingType} onClick={() => setBidTarget(b)} />
                    </div>
                  </Td>

                  {/* Id */}
                  <Td>
                    <Link
                      href={`/bookings/${b._id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {b.bookingId?.slice(-6).toUpperCase() || '—'}
                    </Link>
                  </Td>

                  {/* Branch — using pickup city as branch */}
                  <Td>{b.pickup?.city || '—'}</Td>

                  {/* Lane Code */}
                  <Td>{b.laneCode || '—'}</Td>

                  {/* Is Adhoc Indent */}
                  <Td>
                    <span
                      className={cn('font-medium', b.isAdhoc ? 'text-orange-600' : 'text-gray-500')}
                    >
                      {b.isAdhoc ? 'Yes' : 'No'}
                    </span>
                  </Td>

                  {/* Indent Type */}
                  <Td>
                    {indentTypeEditId === b._id ? (
                      <select
                        autoFocus
                        defaultValue={b.indentType || ''}
                        onChange={(e) =>
                          updateIndentType(b._id, e.target.value as 'FTL' | 'PTL' | 'LCL')
                        }
                        onBlur={() => setIndentTypeEditId(null)}
                        disabled={savingIndentType === b._id}
                        className="text-xs font-medium text-gray-700 border border-blue-400 rounded px-1.5 py-0.5 bg-white focus:outline-none disabled:opacity-50"
                      >
                        <option value="">—</option>
                        <option value="FTL">FTL</option>
                        <option value="LTL">LTL</option>
                        <option value="PTL">PTL</option>
                      </select>
                    ) : (
                      <span className="flex items-center gap-1 group">
                        <span className="font-medium text-gray-700">{b.indentType || '—'}</span>
                        <button
                          onClick={() => setIndentTypeEditId(b._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500"
                          title="Edit transaction type"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </Td>

                  {/* Traffic */}
                  <Td>
                    {b.trafficController?.name ? (
                      <a
                        href={
                          b.trafficController.phone ? `tel:${b.trafficController.phone}` : undefined
                        }
                        className="flex items-center gap-1 text-gray-800 hover:text-blue-600 transition-colors group"
                        title={
                          b.trafficController.phone
                            ? `Call ${b.trafficController.name}`
                            : b.trafficController.name
                        }
                      >
                        <Phone
                          className={`h-3.5 w-3.5 shrink-0 ${b.trafficController.phone ? 'text-blue-500 group-hover:text-blue-700' : 'text-gray-300'}`}
                        />
                        <span>{b.trafficController.name}</span>
                      </a>
                    ) : (
                      '—'
                    )}
                  </Td>

                  {/* Customer */}
                  <Td>
                    {b.customer?.companyName ? (
                      <Link
                        href={`/customers/${b.customer._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {b.customer.companyName}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </Td>

                  {/* Source */}
                  <Td>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500 shrink-0" />
                      {b.pickup?.city || '—'}
                    </span>
                  </Td>

                  {/* Source Code */}
                  <Td>{b.sourceCode || '—'}</Td>

                  {/* Destination */}
                  <Td>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      {b.drop?.city || '—'}
                    </span>
                  </Td>

                  {/* Destination Code */}
                  <Td>{b.destinationCode || '—'}</Td>

                  {/* Truck Type */}
                  <Td>{b.truckTypeNeeded || '—'}</Td>

                  {/* Matched trucks — Own / Market / Bidding / Unloading */}
                  <td colSpan={3} className="px-0 py-2 border-b border-gray-100">
                    <div className="flex divide-x divide-gray-200">
                      {/* Own */}
                      <button
                        onClick={() => setTruckModalTarget({ booking: b, tab: 'own' })}
                        className="flex-1 flex items-center gap-1.5 px-2 py-0.5 min-w-[52px] hover:bg-blue-50 transition-colors rounded-l"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-blue-500 shrink-0"
                          fill="currentColor"
                        >
                          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5 1.96 2.5H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">
                          {b.vehicle ? 1 : 0}
                        </span>
                      </button>
                      {/* Market */}
                      <button
                        onClick={() => setTruckModalTarget({ booking: b, tab: 'market' })}
                        className="flex-1 flex items-center gap-1.5 px-2 py-0.5 min-w-[52px] hover:bg-orange-50 transition-colors"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-orange-500 shrink-0"
                          fill="currentColor"
                        >
                          <path d="M18 2H6L2 8h20L18 2zm-8 4 1-3h2l1 3H10zm-4 0 1.5-3H9L8 6H6zm8 0-1-3h1.5L16 6h-2zM2 9v11h9v-4h2v4h9V9H2zm14 7h-3v-3h3v3z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">
                          {b.marketTrucks ?? 0}
                        </span>
                      </button>
                      {/* Bidding */}
                      <button
                        onClick={() => setTruckModalTarget({ booking: b, tab: 'bidding' })}
                        className="flex-1 flex items-center gap-1.5 px-2 py-0.5 min-w-[52px] hover:bg-blue-50 transition-colors"
                      >
                        <span className="inline-flex items-center justify-center h-4 w-7 rounded-full border border-blue-500 text-[8px] font-bold text-blue-600 leading-none shrink-0">
                          BID
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {b.interestedCount ?? b.interestedDrivers?.length ?? 0}
                        </span>
                      </button>
                      {/* Unloading */}
                      <button
                        onClick={() => setTruckModalTarget({ booking: b, tab: 'unloading' })}
                        className="flex-1 flex items-center gap-1.5 px-2 py-0.5 min-w-[52px] hover:bg-green-50 transition-colors rounded-r"
                        title="Trucks currently unloading near pickup city"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-green-500 shrink-0"
                          fill="currentColor"
                        >
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L11 13.17V7h2v6.17l2.59-2.58L17 12l-5 5z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">
                          {unloadingCounts[b._id] ?? 0}
                        </span>
                      </button>
                    </div>
                  </td>

                  {/* Indent date */}
                  <Td>{fmtDate(b.createdAt)}</Td>

                  {/* TAT (hrs) — time remaining until expiry, green */}
                  <Td>
                    {b.expiryTime ? (
                      <span className="font-semibold text-green-600">
                        {Math.max(
                          0,
                          Math.floor((new Date(b.expiryTime).getTime() - Date.now()) / 3600000)
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </Td>

                  {/* Created by */}
                  <Td>{b.createdByStaff?.name || '—'}</Td>

                  {/* Count — assigned of total requested */}
                  <Td className="text-center">
                    <span className="text-gray-700">
                      {b.vehicle ? 1 : 0} of {b.numberOfTrucks ?? 1}
                    </span>
                  </Td>

                  {/* Remarks */}
                  <Td className="max-w-[120px] truncate" title={b.remarks}>
                    {b.remarks || '—'}
                  </Td>

                  {/* Status — Active for open indents, otherwise status label */}
                  <Td>
                    {(() => {
                      const isOpen = ['created', 'under-review'].includes(b.status);
                      const isClosed = [
                        'cancelled',
                        'closed',
                        'delivered',
                        'pod-received',
                      ].includes(b.status);
                      const label = isOpen
                        ? 'Active'
                        : isClosed
                          ? statusLabel(b.status)
                          : statusLabel(b.status);
                      const color = isOpen
                        ? 'text-orange-600'
                        : isClosed
                          ? 'text-red-500'
                          : 'text-blue-600';
                      return <span className={cn('text-xs font-medium', color)}>{label}</span>;
                    })()}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-white shrink-0">
          <span className="text-xs text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} of{' '}
            {totalItems}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
              Prev
            </Button>
            <span className="text-xs text-gray-600 px-2">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {editTarget && (
        <ManageIndentModal
          booking={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null);
            fetchBookings();
          }}
        />
      )}

      {confirmTarget && (
        <AssignDriverModal
          isOpen={!!confirmTarget}
          booking={confirmTarget}
          onCloseAction={() => setConfirmTarget(null)}
          onSuccessAction={() => {
            setConfirmTarget(null);
            fetchBookings();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          booking={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => fetchBookings()}
        />
      )}

      {commentTarget && (
        <CommentDrawer booking={commentTarget} onClose={() => setCommentTarget(null)} />
      )}

      {truckModalTarget && (
        <MatchedTrucksModal
          booking={truckModalTarget.booking}
          initialTab={truckModalTarget.tab}
          onClose={() => setTruckModalTarget(null)}
          onAssign={() => {
            setTruckModalTarget(null);
            setConfirmTarget(truckModalTarget!.booking);
          }}
        />
      )}

      {bidTarget && (
        <BiddingModal
          booking={bidTarget}
          onClose={() => setBidTarget(null)}
          onSuccess={() => {
            setBidTarget(null);
            fetchBookings();
          }}
        />
      )}

      <CreateBookingModal
        isOpen={createOpen}
        onCloseAction={() => setCreateOpen(false)}
        onSuccessAction={() => {
          setCreateOpen(false);
          fetchBookings();
        }}
      />
    </div>
  );
}
