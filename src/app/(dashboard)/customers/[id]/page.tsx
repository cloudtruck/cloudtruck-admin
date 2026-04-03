'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { customerApi, bookingApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Customer } from '@/types';
import { Pencil, Trash2, Plus, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts?: string) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

function InlineField({
  label,
  value,
  onSave,
}: {
  label: string;
  value?: string | null;
  onSave?: (v: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(val);
      setEditing(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5 truncate">
        {label}
      </p>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="border border-blue-400 rounded px-1.5 py-0.5 text-sm outline-none w-28"
          />
          <button
            onClick={save}
            disabled={saving}
            className="text-[10px] text-blue-600 font-medium"
          >
            {saving ? '...' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} className="text-[10px] text-gray-400">
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm text-gray-800 truncate" title={value || undefined}>
            {value || '—'}
          </span>
          {onSave && (
            <button onClick={() => setEditing(true)} className="text-blue-400 hover:text-blue-600">
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab content components ────────────────────────────────────────────────────

function EmptyState({ text = 'No data' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Inbox className="h-10 w-10 mb-2 opacity-20" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function LocationTab({
  customerId,
  customer,
  onRefresh,
}: {
  customerId: string;
  customer: Customer;
  onRefresh: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    source: '',
    pincode: '',
    loadingPoint: '',
    locationName: '',
    address: '',
    supervisor: '',
  });
  const [saving, setSaving] = useState(false);
  const locations = customer.locations || [];

  async function handleAddLocation() {
    if (!form.source.trim() || !form.locationName.trim()) {
      toast.error('Source and Location Name are required');
      return;
    }
    setSaving(true);
    try {
      await customerApi.addLocation(customerId, form);
      await onRefresh();
      setForm({
        source: '',
        pincode: '',
        loadingPoint: '',
        locationName: '',
        address: '',
        supervisor: '',
      });
      toast.success('Location added');
    } catch {
      toast.error('Failed to add location');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveLocation(locId: string) {
    try {
      await customerApi.removeLocation(customerId, locId);
      await onRefresh();
      toast.success('Location removed');
    } catch {
      toast.error('Failed to remove location');
    }
  }

  return (
    <div className="flex gap-0">
      {/* Sidebar list */}
      <div className="w-40 border-r border-gray-100 pr-3 shrink-0">
        <button
          onClick={handleAddLocation}
          disabled={saving}
          className="mb-3 text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? '...' : '+ Add Location'}
        </button>
        {locations.length === 0 && <p className="text-xs text-gray-400">No locations</p>}
        {locations.map((l) => (
          <div
            key={l._id}
            className="flex items-center justify-between text-xs text-gray-700 py-1 border-b border-gray-50 group"
          >
            <span>{l.locationName || l.source}</span>
            <button
              onClick={() => l._id && handleRemoveLocation(l._id)}
              className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      {/* Form */}
      <div className="flex-1 pl-6 bg-gray-50 rounded-lg p-5">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <input
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            placeholder="Source Location *"
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={form.pincode}
            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
            placeholder="Pincode"
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={form.loadingPoint}
            onChange={(e) => setForm((f) => ({ ...f, loadingPoint: e.target.value }))}
            placeholder="Loading Point"
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input
            value={form.locationName}
            onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))}
            placeholder="Location Name *"
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Address *"
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <select
            value={form.supervisor}
            onChange={(e) => setForm((f) => ({ ...f, supervisor: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="">Select Supervisor</option>
          </select>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleAddLocation}
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : '+ Add Location'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChargesTab({
  customerId,
  customer,
  onRefresh,
}: {
  customerId: string;
  customer: Customer;
  onRefresh: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [chargeType, setChargeType] = useState<'add' | 'reduce'>('add');
  const [form, setForm] = useState({ type: '', amount: '', remarks: '' });
  const [saving, setSaving] = useState(false);
  const charges = customer.charges || [];

  async function handleAddCharge() {
    if (!form.type.trim() || !form.amount) {
      toast.error('Type and Amount are required');
      return;
    }
    setSaving(true);
    try {
      await customerApi.addCharge(customerId, {
        type: form.type,
        amount: parseFloat(form.amount),
        remarks: form.remarks,
        chargeType,
      });
      await onRefresh();
      setForm({ type: '', amount: '', remarks: '' });
      setShowForm(false);
      toast.success('Charge added');
    } catch {
      toast.error('Failed to add charge');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveCharge(chargeId: string) {
    try {
      await customerApi.removeCharge(customerId, chargeId);
      await onRefresh();
      toast.success('Charge removed');
    } catch {
      toast.error('Failed to remove charge');
    }
  }

  return (
    <div>
      <div className="flex gap-3 justify-end mb-4">
        <button
          onClick={() => {
            setChargeType('add');
            setShowForm(true);
          }}
          className="flex flex-col items-center gap-1 border border-gray-200 rounded-lg px-4 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Charges</span>
        </button>
        <button
          onClick={() => {
            setChargeType('reduce');
            setShowForm(true);
          }}
          className="flex flex-col items-center gap-1 border border-gray-200 rounded-lg px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
        >
          <span className="text-base leading-none">−</span>
          <span>Reduce Charges</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-4 gap-3 items-end">
          <input
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            placeholder="Charge Type *"
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Amount *"
            type="number"
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            value={form.remarks}
            onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            placeholder="Remarks"
            className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCharge}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? '...' : 'Save'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded text-sm text-gray-500 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Type</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Amount</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">
              Charge Type
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Remarks</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody>
          {charges.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState />
              </td>
            </tr>
          ) : (
            charges.map((c) => (
              <tr key={c._id} className="border-b border-gray-50">
                <td className="py-2.5 px-3 text-gray-700">{c.type}</td>
                <td className="py-2.5 px-3 text-gray-700">{c.amount}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={cn(
                      'text-xs font-medium capitalize',
                      c.chargeType === 'reduce' ? 'text-red-500' : 'text-green-600'
                    )}
                  >
                    {c.chargeType || 'add'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-gray-500">{c.remarks || '—'}</td>
                <td className="py-2.5 px-3">
                  <button
                    onClick={() => c._id && handleRemoveCharge(c._id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AllTripsTab({ customerId }: { customerId: string }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingApi
      .getAll({ customerId, limit: 50 })
      .then((res) => setBookings(res.data.data?.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading)
    return (
      <div className="p-6 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          {['Booking ID', 'Route', 'Material', 'Status', 'Date'].map((h) => (
            <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bookings.length === 0 ? (
          <tr>
            <td colSpan={5}>
              <EmptyState />
            </td>
          </tr>
        ) : (
          bookings.map((b: any, i) => (
            <tr
              key={i}
              className={cn('border-b border-gray-50', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}
            >
              <td className="py-2.5 px-3 text-blue-600 font-medium">
                {b.bookingId || b._id?.slice(-6)}
              </td>
              <td className="py-2.5 px-3 text-gray-700">
                {b.pickup?.city} → {b.drop?.city}
              </td>
              <td className="py-2.5 px-3 text-gray-600">{b.materialType || '—'}</td>
              <td className="py-2.5 px-3">
                <span
                  className={cn(
                    'text-xs font-medium capitalize',
                    b.status === 'delivered'
                      ? 'text-green-600'
                      : b.status === 'cancelled'
                        ? 'text-red-500'
                        : 'text-blue-600'
                  )}
                >
                  {b.status?.replace(/-/g, ' ')}
                </span>
              </td>
              <td className="py-2.5 px-3 text-gray-500">{fmtDate(b.createdAt)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function PaymentTermsTab({ customer }: { customer: Customer }) {
  const sections = [
    {
      label: 'Own',
      rows: [
        { type: 'Advance', pct: 0, days: 0 },
        { type: 'On-Delivery', pct: 0, days: 0 },
        { type: 'CPD', pct: 0, days: 0 },
        { type: 'POD Balance', pct: 100, days: 0 },
      ],
    },
    {
      label: 'Attached',
      rows: [
        { type: 'Advance', pct: 0, days: 0 },
        { type: 'On-Delivery', pct: 0, days: 0 },
        { type: 'CPS', pct: 0, days: 0 },
        { type: 'CPD', pct: 0, days: 0 },
        { type: 'POD Balance', pct: 100, days: 0 },
      ],
    },
    {
      label: 'Market',
      rows: [
        { type: 'Advance', pct: 0, days: 0 },
        { type: 'On-Delivery', pct: 0, days: 0 },
        { type: 'CPS', pct: 0, days: 0 },
        { type: 'POD Balance', pct: 100, days: 0 },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-6">
      {sections.map((sec) => (
        <div key={sec.label}>
          <p className="text-sm font-semibold text-gray-700 mb-2">{sec.label}</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500">Type</th>
                <th className="text-left py-2 text-gray-500">Percentage</th>
                <th className="text-left py-2 text-gray-500">Days</th>
                <th className="text-left py-2 text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {sec.rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{r.type}</td>
                  <td className="py-2 text-gray-700">{r.pct}</td>
                  <td className="py-2 text-gray-700">{r.days}</td>
                  <td className="py-2">
                    <button
                      className="text-gray-300 cursor-not-allowed"
                      title="Payment terms editing coming soon"
                      onClick={() => toast.info('Payment terms editing is coming soon')}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function AddressTab({ customer }: { customer: Customer }) {
  const addr = customer.address;
  const locations = customer.locations || [];
  const locationOptions = locations.map((l) => l.locationName || l.source || l._id);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <p className="text-sm font-semibold text-gray-700">Default Address :</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">From</span>
          <select className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white outline-none focus:border-blue-500 min-w-[160px]">
            <option value="">Select Address</option>
            {locationOptions.map((l, i) => (
              <option key={i} value={l}>
                {l}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500">To</span>
          <select className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white outline-none focus:border-blue-500 min-w-[160px]">
            <option value="">Select Address</option>
            {locationOptions.map((l, i) => (
              <option key={i} value={l}>
                {l}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              toast.info(
                'Default address preference saved locally. Backend persistence coming soon.'
              )
            }
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {[
              'Primary',
              'Name',
              'Address',
              'HSN Code',
              'Vendor Code',
              'City',
              'GSTIN',
              'PAN',
              'Action',
            ].map((h) => (
              <th key={h} className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {addr ? (
            <tr className="border-b border-gray-50">
              <td className="py-2.5 px-2">
                <input type="radio" checked readOnly />
              </td>
              <td className="py-2.5 px-2 text-gray-700">{customer.companyName}</td>
              <td className="py-2.5 px-2 text-gray-600">
                {[addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') ||
                  '—'}
              </td>
              <td className="py-2.5 px-2 text-gray-500">—</td>
              <td className="py-2.5 px-2 text-gray-500">—</td>
              <td className="py-2.5 px-2 text-gray-700">{addr.city || '—'}</td>
              <td className="py-2.5 px-2 text-gray-500">{customer.gstNumber || '—'}</td>
              <td className="py-2.5 px-2 text-gray-500">{customer.pan || '—'}</td>
              <td className="py-2.5 px-2 flex items-center gap-2">
                <button
                  className="text-red-400 hover:text-red-600 opacity-40 cursor-not-allowed"
                  title="Primary address cannot be deleted"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  className="text-blue-400 hover:text-blue-600 opacity-40 cursor-not-allowed"
                  title="Edit via profile fields above"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ) : (
            <tr>
              <td colSpan={9}>
                <EmptyState />
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-gray-400">
        Billing address is set during customer registration. Use the Location tab to manage
        pickup/delivery locations.
      </p>
    </div>
  );
}

function UsersTab({
  customerId,
  customer,
  onRefresh,
}: {
  customerId: string;
  customer: Customer;
  onRefresh: () => Promise<void>;
}) {
  const contacts = customer.contactPerson ? [customer.contactPerson] : [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      await customerApi.update(customerId, { contactPerson: form } as Partial<Customer>);
      await onRefresh();
      setShowForm(false);
      setForm({ name: '', phone: '', email: '' });
      toast.success('Contact person updated');
    } catch {
      toast.error('Failed to save contact');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Edit Contact'}
        </button>
      </div>
      {showForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contact name"
              className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Phone *</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone number"
              className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email (optional)"
              className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 w-48"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Name', 'Mobile Number', 'Email', 'App User', 'Action'].map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState text="No contact person set. Click 'Edit Contact' to add one." />
              </td>
            </tr>
          ) : (
            contacts.map((c, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="py-2.5 px-3 text-gray-700">{c.name || '—'}</td>
                <td className="py-2.5 px-3 text-gray-700">{c.phone || '—'}</td>
                <td className="py-2.5 px-3 text-gray-500">{c.email || '—'}</td>
                <td className="py-2.5 px-3 text-gray-500">No</td>
                <td className="py-2.5 px-3">
                  <button
                    onClick={() => {
                      setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '' });
                      setShowForm(true);
                    }}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function CommentTab({ customerId }: { customerId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getComments(customerId);
      setComments(res.data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await customerApi.addComment(customerId, { topic: 'Customer', comment: text });
      setText('');
      await loadComments();
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Please enter comments"
          rows={3}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded text-sm font-medium transition-colors h-fit self-start"
        >
          {submitting ? '...' : 'Submit'}
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Topic', 'Comment', 'Created By', 'Created On'].map((h) => (
                <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comments.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              comments.map((c, i) => (
                <tr
                  key={c._id || i}
                  className={cn(
                    'border-b border-gray-50',
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  )}
                >
                  <td className="py-2.5 px-3 text-gray-700">{c.topic}</td>
                  <td className="py-2.5 px-3 text-gray-700">{c.comment}</td>
                  <td className="py-2.5 px-3 text-gray-600">{c.createdBy}</td>
                  <td className="py-2.5 px-3 text-gray-500">{fmtDate(c.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type TabKey =
  | 'location'
  | 'charges'
  | 'all-trips'
  | 'users'
  | 'payment-terms'
  | 'address'
  | 'comment';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'charges', label: 'Charges' },
  { key: 'all-trips', label: 'All Trips' },
  { key: 'users', label: 'Users' },
  { key: 'payment-terms', label: 'Payment Terms' },
  { key: 'address', label: 'Address' },
  { key: 'comment', label: 'Comment' },
];

export default function CustomerDetailPage({ params }: Props) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('location');

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getById(id);
      setCustomer(res.data.data);
    } catch {
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  async function saveField(field: string, value: string) {
    await customerApi.update(id, { [field]: value } as Partial<Customer>);
    await fetchCustomer();
    toast.success('Saved');
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!customer)
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        Customer not found
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">{customer.companyName} —</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchCustomer} className="text-gray-400 hover:text-gray-600 p-1">
              <RefreshCw className="h-4 w-4" />
            </button>
            <span
              className={cn(
                'text-xs font-medium px-3 py-1 rounded-full border',
                customer.status === 'active'
                  ? 'border-gray-300 text-gray-600'
                  : 'border-red-300 text-red-600'
              )}
            >
              {customer.status === 'active' ? 'Active' : customer.status}
            </span>
          </div>
        </div>

        {/* Info grid row 1 */}
        <div className="grid grid-cols-6 gap-x-8 gap-y-3 mb-3">
          <InlineField label="PAN" value={customer.pan} onSave={(v) => saveField('pan', v)} />
          <InlineField
            label="GSTIN"
            value={customer.gstNumber}
            onSave={(v) => saveField('gstNumber', v)}
          />
          <InlineField
            label="Trans"
            value={customer.transporter}
            onSave={(v) => saveField('transporter', v)}
          />
          <InlineField
            label="Type"
            value={customer.customerType || customer.companyType}
            onSave={(v) => saveField('customerType', v)}
          />
          <InlineField
            label="POD-Type"
            value={customer.podType}
            onSave={(v) => saveField('podType', v)}
          />
          <InlineField
            label="Customer Admin"
            value={customer.customerAdmin}
            onSave={(v) => saveField('customerAdmin', v)}
          />
        </div>

        {/* Info grid row 2 */}
        <div className="grid grid-cols-6 gap-x-8">
          <InlineField
            label="Material Type"
            value={customer.materialType}
            onSave={(v) => saveField('materialType', v)}
          />
          <InlineField
            label="Customer Code"
            value={customer.customerCode}
            onSave={(v) => saveField('customerCode', v)}
          />
          <InlineField label="Phone" value={customer.contactPerson?.phone || customer.phone} />
          <InlineField label="Email" value={customer.contactPerson?.email || customer.email} />
          <InlineField label="City" value={customer.address?.city} />
          <div />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none px-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0',
              tab === t.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="p-6">
        {tab === 'location' && (
          <LocationTab customerId={id} customer={customer} onRefresh={fetchCustomer} />
        )}
        {tab === 'charges' && (
          <ChargesTab customerId={id} customer={customer} onRefresh={fetchCustomer} />
        )}
        {tab === 'all-trips' && <AllTripsTab customerId={id} />}
        {tab === 'users' && (
          <UsersTab customerId={id} customer={customer} onRefresh={fetchCustomer} />
        )}
        {tab === 'payment-terms' && <PaymentTermsTab customer={customer} />}
        {tab === 'address' && <AddressTab customer={customer} />}
        {tab === 'comment' && <CommentTab customerId={id} />}
      </div>
    </div>
  );
}
