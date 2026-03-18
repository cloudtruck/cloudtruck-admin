'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Inbox,
  FileText,
  Trash2,
  Share2,
  MessageSquare,
  Loader2,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bookingApi, documentApi } from '@/lib/api';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts?: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('en', { month: 'short' })}-${String(d.getFullYear()).slice(2)}`;
}

function fmtDateTime(ts?: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const date = `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('en', { month: 'short' })}-${String(d.getFullYear()).slice(2)}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
}

function tatHours(from?: string, to?: string): string {
  if (!from) return '—';
  const end = to ? new Date(to) : new Date();
  const diff = (end.getTime() - new Date(from).getTime()) / 3600000;
  return diff < 0 ? '—' : diff.toFixed(1);
}

function profitLoss(b: Booking): number | null {
  if (b.customerPrice == null || b.supplierPrice == null) return null;
  return b.customerPrice - b.supplierPrice;
}

function profitPct(b: Booking): string {
  const pl = profitLoss(b);
  if (pl == null || !b.customerPrice) return '—';
  return ((pl / b.customerPrice) * 100).toFixed(1) + '%';
}

function statusBadge(status: string) {
  const s = status?.toLowerCase() || '';
  let cls = 'bg-gray-100 text-gray-700';
  if (s === 'created') cls = 'bg-gray-100 text-gray-600';
  if (s === 'under-review') cls = 'bg-yellow-100 text-yellow-800';
  if (s === 'assigned') cls = 'bg-blue-100 text-blue-800';
  if (s === 'driver-en-route' || s === 'reached-pickup') cls = 'bg-orange-100 text-orange-700';
  if (s === 'loaded' || s === 'in-transit') cls = 'bg-purple-100 text-purple-800';
  if (s === 'reached-destination') cls = 'bg-indigo-100 text-indigo-700';
  if (s === 'delivered') cls = 'bg-teal-100 text-teal-700';
  if (s === 'pod-received') cls = 'bg-green-100 text-green-800';
  if (s === 'closed') cls = 'bg-green-200 text-green-900';
  if (s === 'cancelled') cls = 'bg-red-100 text-red-800';
  const label = status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={cn('px-2 py-0.5 rounded text-xs font-medium', cls)}>{label || '—'}</span>;
}

// ─── Timestamp multi-row cell (Indent / Confirmed / S-in / I-C / C-Sin / Sin-Sout) ──

function TimestampCell({ b }: { b: Booking }) {
  // Map booking status history to key timestamps
  const getStatusTime = (status: string) =>
    b.statusHistory?.find((h) => h.status === status)?.timestamp;

  const indent = b.createdAt;
  const confirmed = b.assignedAt || getStatusTime('assigned');
  const sIn = getStatusTime('loaded') || getStatusTime('reached-pickup');
  const iC = getStatusTime('in-transit');
  const cSin = getStatusTime('reached-destination');
  const sinSout = b.podDetails?.deliveredAt || getStatusTime('delivered');

  const rows = [
    { label: 'Indent', value: fmtDateTime(indent) },
    { label: 'Confirmed', value: fmtDateTime(confirmed) },
    { label: 'S-in', value: fmtDateTime(sIn) },
    { label: 'I-C', value: fmtDateTime(iC) },
    { label: 'C-Sin', value: fmtDateTime(cSin) },
    { label: 'Sin-Sout', value: fmtDateTime(sinSout) },
  ];

  return (
    <div className="text-xs space-y-0.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-1">
          <span className="text-gray-400 w-16 shrink-0">{r.label}</span>
          <span className="text-gray-700">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── LR icon cell ─────────────────────────────────────────────────────────────

function LRCell({ b }: { b: Booking }) {
  const hasLR = !!(
    b.lrDetails?.lrNumber ||
    b.lrNumber ||
    (b.lrDetails?.documents && b.lrDetails.documents.length > 0)
  );
  return (
    <span title={hasLR ? `LR: ${b.lrDetails?.lrNumber || b.lrNumber}` : 'No LR uploaded'}>
      {hasLR ? (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer">
          LR
        </span>
      ) : (
        '—'
      )}
    </span>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const NON_LOADING_TABS = ['confirmed', 'intransit-o', 'intransit-i', 'unloading'] as const;
const ALL_NON_SAPPROVAL = [
  'confirmed',
  'loading',
  'intransit-o',
  'intransit-i',
  'unloading',
] as const;

const TABS = [
  { key: 's-approval', label: 'S Approval', statuses: ['under-review'] },
  { key: 'confirmed', label: 'Confirmed', statuses: ['assigned'] },
  { key: 'loading', label: 'Loading', statuses: ['loaded', 'driver-en-route', 'reached-pickup'] },
  { key: 'intransit-o', label: 'Intransit(O)', statuses: ['in-transit'] },
  { key: 'intransit-i', label: 'Intransit(I)', statuses: ['reached-destination'] },
  { key: 'unloading', label: 'Unloading', statuses: ['reached-destination'] },
  { key: 'available', label: 'Available', statuses: ['created'] },
  { key: 'pod-pending', label: 'POD Pending', statuses: ['delivered'] },
  { key: 'pod-received', label: 'POD Received', statuses: ['pod-received'] },
  { key: 'all', label: 'All', statuses: [] },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ─── Column definitions ───────────────────────────────────────────────────────

type Col = {
  key: string;
  header: string;
  groupHeader?: string; // if set, adjacent cols with same groupHeader get a colspan span
  tabs: readonly TabKey[] | 'all';
  searchable?: boolean;
  sortable?: boolean;
  render: (b: Booking) => React.ReactNode;
};

const COLS: Col[] = [
  // ── Id (all tabs) ──
  {
    key: 'id',
    header: 'Id',
    tabs: 'all',
    searchable: true,
    render: (b) => (
      <span className="font-mono text-xs text-blue-600 cursor-pointer hover:underline">
        {b.bookingId || b._id.slice(-8).toUpperCase()}
      </span>
    ),
  },

  // ── S Approval exclusive ──
  {
    key: 'cPrice',
    header: 'C Price',
    tabs: ['s-approval'] as const,
    render: (b) => (b.customerPrice != null ? `₹${b.customerPrice.toLocaleString()}` : '—'),
  },
  {
    key: 'tPrice',
    header: 'T Price',
    tabs: ['s-approval'] as const,
    render: (b) => (b.expectedAmount != null ? `₹${b.expectedAmount.toLocaleString()}` : '—'),
  },
  {
    key: 'sPrice',
    header: 'S Price',
    tabs: ['s-approval'] as const,
    render: (b) => (b.supplierPrice != null ? `₹${b.supplierPrice.toLocaleString()}` : '—'),
  },
  {
    key: 'profitLoss',
    header: 'Profit/Loss',
    tabs: ['s-approval'] as const,
    render: (b) => {
      const pl = profitLoss(b);
      if (pl == null) return '—';
      return (
        <span className={pl >= 0 ? 'text-green-600' : 'text-red-600'}>
          {pl >= 0 ? '+' : ''}₹{pl.toLocaleString()}
        </span>
      );
    },
  },
  {
    key: 'profitPct',
    header: 'Profit %',
    tabs: ['s-approval'] as const,
    render: (b) => {
      const pct = parseFloat(profitPct(b));
      if (isNaN(pct)) return '—';
      return <span className={pct >= 0 ? 'text-green-600' : 'text-red-600'}>{profitPct(b)}</span>;
    },
  },
  {
    key: 'indentSeries',
    header: 'Indent Series',
    tabs: ['s-approval'] as const,
    render: (b) => b.bookingType || '—',
  },
  {
    key: 'indentIdSA',
    header: 'Indent Id',
    tabs: ['s-approval'] as const,
    searchable: true,
    render: (b) => b.bookingId || '—',
  },
  {
    key: 'indentDate',
    header: 'Indent Date',
    tabs: ['s-approval'] as const,
    render: (b) => fmtDate(b.createdAt),
  },
  // S Approval shared cols — Traffic, Supervisor, Customer, Source Name, Source, Dest Name, Dest, Supplier, Truck, TruckType
  {
    key: 'trafficSA',
    header: 'Traffic',
    tabs: ['s-approval'] as const,
    searchable: true,
    render: (b) => b.trafficController?.name || '—',
  },
  {
    key: 'supervisorSA',
    header: 'Supervisor',
    tabs: ['s-approval'] as const,
    searchable: true,
    render: (b) => b.supervisor?.name || '—',
  },
  {
    key: 'customerSA',
    header: 'Customer',
    tabs: ['s-approval'] as const,
    searchable: true,
    render: (b) => b.customer?.companyName || '—',
  },
  {
    key: 'sourceName',
    header: 'Source Name',
    tabs: ['s-approval'] as const,
    render: (b) => b.pickup?.city || '—',
  },
  {
    key: 'sourceSA',
    header: 'Source',
    tabs: ['s-approval'] as const,
    render: (b) => b.pickup?.address || b.pickup?.city || '—',
  },
  {
    key: 'destName',
    header: 'Destination Name',
    tabs: ['s-approval'] as const,
    render: (b) => b.drop?.city || '—',
  },
  {
    key: 'destSA',
    header: 'Destination',
    tabs: ['s-approval'] as const,
    render: (b) => b.drop?.address || b.drop?.city || '—',
  },
  {
    key: 'supplierSA',
    header: 'Supplier',
    tabs: ['s-approval'] as const,
    searchable: true,
    render: (b) => b.supplier || '—',
  },
  {
    key: 'truckSA',
    header: 'Truck',
    tabs: ['s-approval'] as const,
    render: (b) => b.vehicle?.vehicleNumber || '—',
  },
  {
    key: 'truckTypeSA',
    header: 'Truck Type',
    tabs: ['s-approval'] as const,
    render: (b) => b.truckTypeNeeded || b.vehicle?.truckType || '—',
  },

  // ── Non-S-Approval columns (Confirmed, Loading, …) in Digitify order ──
  {
    key: 'indentId',
    header: 'Indent Id',
    tabs: ALL_NON_SAPPROVAL,
    searchable: true,
    render: (b) => b.bookingId || '—',
  },
  {
    key: 'laneCode',
    header: 'Lane Code',
    tabs: ALL_NON_SAPPROVAL,
    searchable: true,
    render: (b) => b.laneCode || '—',
  },
  // Loading tab: LR No
  {
    key: 'lrNo',
    header: 'LR No',
    tabs: [
      'loading',
      'intransit-o',
      'intransit-i',
      'unloading',
      'pod-pending',
      'pod-received',
      'all',
    ] as const,
    searchable: true,
    render: (b) => {
      const lrNum = b.lrDetails?.lrNumber || b.lrNumber;
      if (lrNum) return <span className="text-blue-600 font-medium text-xs">{lrNum}</span>;
      return <LRCell b={b} />;
    },
  },
  {
    key: 'weight',
    header: 'Weight',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => (b.weight ? `${b.weight.value} ${b.weight.unit}` : '—'),
  },
  {
    key: 'txnType',
    header: 'Transaction Type',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.bookingType || '—',
  },
  {
    key: 'lType',
    header: 'Load Type',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.indentType || '—',
  },
  {
    key: 'exim',
    header: 'EXIM',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => {
      const v = b.exim;
      if (!v) return '—';
      return v.charAt(0).toUpperCase() + v.slice(1);
    },
  },
  {
    key: 'traffic',
    header: 'Traffic',
    tabs: ALL_NON_SAPPROVAL,
    searchable: true,
    render: (b) => b.trafficController?.name || '—',
  },
  {
    key: 'supervisor',
    header: 'Supervisor',
    tabs: ALL_NON_SAPPROVAL,
    searchable: true,
    render: (b) => b.supervisor?.name || '—',
  },
  {
    key: 'customer',
    header: 'Customer',
    tabs: ALL_NON_SAPPROVAL,
    searchable: true,
    render: (b) => b.customer?.companyName || '—',
  },
  {
    key: 'branchS',
    header: 'Branch(S)',
    tabs: ALL_NON_SAPPROVAL,
    render: () => '—',
  },
  {
    key: 'sourceCode',
    header: 'Source Code',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.sourceCode || '—',
  },
  {
    key: 'source',
    header: 'Source',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.pickup?.city || '—',
  },
  {
    key: 'destinationCode',
    header: 'Destination Code',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.destinationCode || '—',
  },
  {
    key: 'destination',
    header: 'Destination',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.drop?.city || '—',
  },
  {
    key: 'supplier',
    header: 'Supplier',
    tabs: ALL_NON_SAPPROVAL,
    searchable: true,
    render: (b) => b.supplier || '—',
  },
  {
    key: 'boeNo',
    header: 'BOE/Booking No',
    tabs: ALL_NON_SAPPROVAL,
    searchable: true,
    render: (b) => b.boeNumber || '—',
  },
  {
    key: 'jobNo',
    header: 'Job No',
    tabs: ALL_NON_SAPPROVAL,
    searchable: true,
    render: (b) => b.jobNo || '—',
  },
  {
    key: 'hireChallan',
    header: 'Hire Challan',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.hireChallan || '—',
  },
  {
    key: 'branchD',
    header: 'Branch(D)',
    tabs: ALL_NON_SAPPROVAL,
    render: () => '—',
  },
  {
    key: 'truck',
    header: 'Truck',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.vehicle?.vehicleNumber || '—',
  },
  {
    key: 'truckType',
    header: 'Truck Type',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.truckTypeNeeded || b.vehicle?.truckType || '—',
  },
  {
    key: 'driverNo',
    header: 'Driver No',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.driver?.phone || '—',
  },
  {
    key: 'location',
    header: 'Location',
    tabs: ['intransit-o', 'intransit-i'] as const,
    render: (b) => {
      const coords = b.lastKnownLocation?.coordinates;
      if (!coords) return '—';
      return (
        <a
          href={`https://maps.google.com/?q=${coords[1]},${coords[0]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-xs"
        >
          {coords[1].toFixed(4)}, {coords[0].toFixed(4)}
        </a>
      );
    },
  },
  {
    key: 'km',
    header: 'Km',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.actualKm ?? b.tripKm ?? '—',
  },
  // Confirmed tab: Indent + Confirmed timestamps
  {
    key: 'tsIndent',
    header: 'Indent',
    groupHeader: 'Timestamp',
    tabs: ['confirmed'] as const,
    render: (b) => <span className="text-xs text-gray-700">{fmtDateTime(b.createdAt)}</span>,
  },
  {
    key: 'tsConfirmed',
    header: 'Confirmed',
    groupHeader: 'Timestamp',
    tabs: ['confirmed'] as const,
    render: (b) => {
      const ts = b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  // Unloading tab: S-In + S-Out + ETA + D-In timestamps
  {
    key: 'tsSInUnloading',
    header: 'S-In',
    groupHeader: 'Timestamp',
    tabs: ['unloading'] as const,
    render: (b) => {
      const ts = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'reached-pickup'
      )?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  {
    key: 'tsSOutUnloading',
    header: 'S-Out',
    groupHeader: 'Timestamp',
    tabs: ['unloading'] as const,
    render: (b) => {
      const ts = b.statusHistory?.find((h) => h.status === 'in-transit')?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  {
    key: 'tsETAUnloading',
    header: 'ETA',
    groupHeader: 'Timestamp',
    tabs: ['unloading'] as const,
    render: (b) => (
      <span className="text-xs text-gray-700">{fmtDateTime(b.expectedDeliveryDate)}</span>
    ),
  },
  {
    key: 'tsDInUnloading',
    header: 'D-In',
    groupHeader: 'Timestamp',
    tabs: ['unloading'] as const,
    render: (b) => {
      const ts = b.statusHistory?.find((h) => h.status === 'reached-destination')?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  // Intransit tabs: Indent + Confirmed + S-In + S-Out + ETA timestamps
  {
    key: 'tsIndentIntransit',
    header: 'Indent',
    groupHeader: 'Timestamp',
    tabs: ['intransit-o', 'intransit-i'] as const,
    render: (b) => <span className="text-xs text-gray-700">{fmtDateTime(b.createdAt)}</span>,
  },
  {
    key: 'tsConfirmedIntransit',
    header: 'Confirmed',
    groupHeader: 'Timestamp',
    tabs: ['intransit-o', 'intransit-i'] as const,
    render: (b) => {
      const ts = b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  {
    key: 'tsSInIntransit',
    header: 'S-In',
    groupHeader: 'Timestamp',
    tabs: ['intransit-o', 'intransit-i'] as const,
    render: (b) => {
      const ts = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'reached-pickup'
      )?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  {
    key: 'tsSOutIntransit',
    header: 'S-Out',
    groupHeader: 'Timestamp',
    tabs: ['intransit-o', 'intransit-i'] as const,
    render: (b) => {
      const ts = b.statusHistory?.find((h) => h.status === 'in-transit')?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  {
    key: 'tsETA',
    header: 'ETA',
    groupHeader: 'Timestamp',
    tabs: ['intransit-o', 'intransit-i'] as const,
    render: (b) => (
      <span className="text-xs text-gray-700">{fmtDateTime(b.expectedDeliveryDate)}</span>
    ),
  },
  // Loading tab: Indent + Confirmed + S-In timestamps
  {
    key: 'tsIndentLoading',
    header: 'Indent',
    groupHeader: 'Timestamp',
    tabs: ['loading'] as const,
    render: (b) => <span className="text-xs text-gray-700">{fmtDateTime(b.createdAt)}</span>,
  },
  {
    key: 'tsConfirmedLoading',
    header: 'Confirmed',
    groupHeader: 'Timestamp',
    tabs: ['loading'] as const,
    render: (b) => {
      const ts = b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  {
    key: 'tsSIn',
    header: 'S-In',
    groupHeader: 'Timestamp',
    tabs: ['loading'] as const,
    render: (b) => {
      const ts = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'reached-pickup'
      )?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  // Confirmed tab: I-C + C-Sin TAT
  {
    key: 'tatIC',
    header: 'I-C',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['confirmed'] as const,
    render: (b) => {
      const indent = b.createdAt;
      const confirmed =
        b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      return tatHours(indent, confirmed);
    },
  },
  {
    key: 'tatCSin',
    header: 'C-Sin',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['confirmed'] as const,
    render: (b) => {
      const confirmed =
        b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      const sIn = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'reached-pickup'
      )?.timestamp;
      return tatHours(confirmed, sIn);
    },
  },
  // Unloading tab: Sin-Sout + Transit + Din-Dout + Timeleft
  {
    key: 'tatSinSoutUnloading',
    header: 'Sin-Sout',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['unloading'] as const,
    render: (b) => {
      const sIn = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'reached-pickup'
      )?.timestamp;
      const sOut = b.statusHistory?.find((h) => h.status === 'in-transit')?.timestamp;
      return tatHours(sIn, sOut);
    },
  },
  {
    key: 'tatTransitUnloading',
    header: 'Transit',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['unloading'] as const,
    render: (b) => {
      const sOut = b.statusHistory?.find((h) => h.status === 'in-transit')?.timestamp;
      const dIn = b.statusHistory?.find((h) => h.status === 'reached-destination')?.timestamp;
      return tatHours(sOut, dIn);
    },
  },
  {
    key: 'tatDinDout',
    header: 'Din-Dout',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['unloading'] as const,
    render: (b) => {
      const dIn = b.statusHistory?.find((h) => h.status === 'reached-destination')?.timestamp;
      return tatHours(dIn, new Date().toISOString());
    },
  },
  {
    key: 'tatTimeleftUnloading',
    header: 'Timeleft',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['unloading'] as const,
    render: (b) => {
      if (!b.expectedDeliveryDate) return <span className="text-xs text-gray-400">—</span>;
      const diff = (new Date(b.expectedDeliveryDate).getTime() - Date.now()) / 3600000;
      const val = diff.toFixed(1);
      return (
        <span className={`text-xs font-medium ${diff < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {diff < 0 ? val : `+${val}`}
        </span>
      );
    },
  },
  // Intransit(O) + Intransit(I): I-C + C-Sin + Sin-Sout TAT
  {
    key: 'tatICIntransit',
    header: 'I-C',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['intransit-o', 'intransit-i'] as const,
    render: (b) => {
      const indent = b.createdAt;
      const confirmed =
        b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      return tatHours(indent, confirmed);
    },
  },
  {
    key: 'tatCSinIntransit',
    header: 'C-Sin',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['intransit-o', 'intransit-i'] as const,
    render: (b) => {
      const confirmed =
        b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      const sIn = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'reached-pickup'
      )?.timestamp;
      return tatHours(confirmed, sIn);
    },
  },
  {
    key: 'tatSinSoutIntransit',
    header: 'Sin-Sout',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['intransit-o', 'intransit-i'] as const,
    render: (b) => {
      const sIn = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'reached-pickup'
      )?.timestamp;
      const sOut = b.statusHistory?.find((h) => h.status === 'in-transit')?.timestamp;
      return tatHours(sIn, sOut);
    },
  },
  // Intransit(O): Transit = S-Out → now (still running); Intransit(I): Transit = S-Out → D-In
  {
    key: 'tatTransitO',
    header: 'Transit',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['intransit-o'] as const,
    render: (b) => {
      const sOut = b.statusHistory?.find((h) => h.status === 'in-transit')?.timestamp;
      return tatHours(sOut, new Date().toISOString());
    },
  },
  {
    key: 'tatTimeleftO',
    header: 'Timeleft',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['intransit-o'] as const,
    render: (b) => {
      if (!b.expectedDeliveryDate) return <span className="text-xs text-gray-400">—</span>;
      const diff = (new Date(b.expectedDeliveryDate).getTime() - Date.now()) / 3600000;
      const val = diff.toFixed(1);
      return (
        <span className={`text-xs font-medium ${diff < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {diff < 0 ? val : `+${val}`}
        </span>
      );
    },
  },
  // Intransit(I) only: Transit (S-Out → D-In) + Timeleft (ETA − now)
  {
    key: 'tatTransit',
    header: 'Transit',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['intransit-i'] as const,
    render: (b) => {
      const sOut = b.statusHistory?.find((h) => h.status === 'in-transit')?.timestamp;
      const dIn = b.statusHistory?.find((h) => h.status === 'reached-destination')?.timestamp;
      return tatHours(sOut, dIn);
    },
  },
  {
    key: 'tatTimeleft',
    header: 'Timeleft',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['intransit-i'] as const,
    render: (b) => {
      if (!b.expectedDeliveryDate) return <span className="text-xs text-gray-400">—</span>;
      const diff = (new Date(b.expectedDeliveryDate).getTime() - Date.now()) / 3600000;
      const val = diff.toFixed(1);
      return (
        <span className={`text-xs font-medium ${diff < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {diff < 0 ? val : `+${val}`}
        </span>
      );
    },
  },
  // Loading tab: I-C + C-Sin + Sin-Sout TAT
  {
    key: 'tatICLoading',
    header: 'I-C',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['loading'] as const,
    render: (b) => {
      const indent = b.createdAt;
      const confirmed =
        b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      return tatHours(indent, confirmed);
    },
  },
  {
    key: 'tatCSinLoading',
    header: 'C-Sin',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['loading'] as const,
    render: (b) => {
      const confirmed =
        b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      const sIn = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'reached-pickup'
      )?.timestamp;
      return tatHours(confirmed, sIn);
    },
  },
  {
    key: 'tatSinSout',
    header: 'Sin-Sout',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['loading'] as const,
    render: (b) => {
      const sIn = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'reached-pickup'
      )?.timestamp;
      const sOut = b.statusHistory?.find((h) => h.status === 'in-transit')?.timestamp;
      return tatHours(sIn, sOut);
    },
  },
  {
    key: 'cPriceConf',
    header: 'C Price',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => (b.customerPrice != null ? `₹${b.customerPrice.toLocaleString()}` : '—'),
  },
  {
    key: 'sPriceConf',
    header: 'S Price',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => (b.supplierPrice != null ? `₹${b.supplierPrice.toLocaleString()}` : '—'),
  },
  {
    key: 'tPriceConf',
    header: 'T Price',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => (b.expectedAmount != null ? `₹${b.expectedAmount.toLocaleString()}` : '—'),
  },
  {
    key: 'createdBy',
    header: 'Created By',
    tabs: ALL_NON_SAPPROVAL,
    render: (b) => b.createdByStaff?.name || '—',
  },

  // ── POD Pending tab columns ────────────────────────────────────────────────
  {
    key: 'ppIndentId',
    header: 'Indent Id',
    tabs: ['pod-pending'] as const,
    searchable: true,
    render: (b) => b.bookingId || '—',
  },
  {
    key: 'ppLaneCode',
    header: 'Lane Code',
    tabs: ['pod-pending'] as const,
    searchable: true,
    render: (b) => b.laneCode || '—',
  },
  {
    key: 'ppLrNo',
    header: 'LR No',
    tabs: ['pod-pending'] as const,
    searchable: true,
    render: (b) => {
      const lrNum = b.lrDetails?.lrNumber || b.lrNumber;
      if (lrNum) return <span className="text-blue-600 font-medium text-xs">{lrNum}</span>;
      return <LRCell b={b} />;
    },
  },
  {
    key: 'ppLrDate',
    header: 'LR Date',
    tabs: ['pod-pending'] as const,
    render: (b) => fmtDate(b.lrDetails?.lrDate || undefined),
  },
  {
    key: 'ppSoftVerified',
    header: 'Soft Verified',
    tabs: ['pod-pending'] as const,
    render: (b) =>
      b.podType === 'Soft' ? (
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
          Yes
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
          No
        </span>
      ),
  },
  {
    key: 'ppWeight',
    header: 'Weight',
    tabs: ['pod-pending'] as const,
    render: (b) => (b.weight ? `${b.weight.value} ${b.weight.unit}` : '—'),
  },
  {
    key: 'ppAge',
    header: 'Age',
    tabs: ['pod-pending'] as const,
    sortable: true,
    render: (b) => {
      const dOut =
        b.podDetails?.deliveredAt ||
        b.statusHistory?.find((h) => h.status === 'delivered')?.timestamp;
      if (!dOut) return '—';
      const hrs = (Date.now() - new Date(dOut).getTime()) / 3600000;
      if (hrs < 24) return `${Math.round(hrs)}h`;
      return `${Math.floor(hrs / 24)}d ${Math.round(hrs % 24)}h`;
    },
  },
  {
    key: 'ppTxnType',
    header: 'Transaction Type',
    tabs: ['pod-pending'] as const,
    render: (b) => b.bookingType || '—',
  },
  {
    key: 'ppLoadType',
    header: 'Load Type',
    tabs: ['pod-pending'] as const,
    render: (b) => b.indentType || '—',
  },
  {
    key: 'ppExim',
    header: 'EXIM',
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const v = b.exim;
      if (!v) return '—';
      return v.charAt(0).toUpperCase() + v.slice(1);
    },
  },
  {
    key: 'ppTraffic',
    header: 'Traffic',
    tabs: ['pod-pending'] as const,
    searchable: true,
    render: (b) => b.trafficController?.name || '—',
  },
  {
    key: 'ppSupervisor',
    header: 'Supervisor',
    tabs: ['pod-pending'] as const,
    searchable: true,
    render: (b) => b.supervisor?.name || '—',
  },
  {
    key: 'ppCustomer',
    header: 'Customer',
    tabs: ['pod-pending'] as const,
    searchable: true,
    render: (b) => b.customer?.companyName || '—',
  },
  {
    key: 'ppBranchS',
    header: 'Branch(S)',
    tabs: ['pod-pending'] as const,
    render: () => '—',
  },
  {
    key: 'ppSourceName',
    header: 'Source Name',
    tabs: ['pod-pending'] as const,
    render: (b) => b.pickup?.city || '—',
  },
  {
    key: 'ppSource',
    header: 'Source',
    tabs: ['pod-pending'] as const,
    render: (b) => b.pickup?.address || b.pickup?.city || '—',
  },
  {
    key: 'ppBranchD',
    header: 'Branch(D)',
    tabs: ['pod-pending'] as const,
    render: () => '—',
  },
  {
    key: 'ppPodUploadedBy',
    header: 'Pod Uploaded By',
    tabs: ['pod-pending'] as const,
    render: (b) => {
      if (!b.podDetails) return '—';
      const ub = (b.podDetails as any).uploadedBy;
      return typeof ub === 'string' ? ub : ub?.name || '—';
    },
  },
  {
    key: 'ppDestName',
    header: 'Destination Name',
    tabs: ['pod-pending'] as const,
    render: (b) => b.drop?.city || '—',
  },
  {
    key: 'ppDestination',
    header: 'Destination',
    tabs: ['pod-pending'] as const,
    render: (b) => b.drop?.address || b.drop?.city || '—',
  },
  {
    key: 'ppSupplier',
    header: 'Supplier',
    tabs: ['pod-pending'] as const,
    searchable: true,
    render: (b) => b.supplier || '—',
  },
  {
    key: 'ppBoeNo',
    header: 'BOE/Booking No',
    tabs: ['pod-pending'] as const,
    searchable: true,
    render: (b) => b.boeNumber || '—',
  },
  {
    key: 'ppJobNo',
    header: 'Job No',
    tabs: ['pod-pending'] as const,
    searchable: true,
    render: (b) => b.jobNo || '—',
  },
  {
    key: 'ppHireChallan',
    header: 'Hire Challan',
    tabs: ['pod-pending'] as const,
    render: (b) => b.hireChallan || '—',
  },
  {
    key: 'ppTruck',
    header: 'Truck',
    tabs: ['pod-pending'] as const,
    render: (b) => b.vehicle?.vehicleNumber || '—',
  },
  {
    key: 'ppTruckType',
    header: 'Truck Type',
    tabs: ['pod-pending'] as const,
    render: (b) => b.truckTypeNeeded || b.vehicle?.truckType || '—',
  },
  {
    key: 'ppDriverNo',
    header: 'Driver No',
    tabs: ['pod-pending'] as const,
    render: (b) => b.driver?.phone || '—',
  },
  {
    key: 'ppKm',
    header: 'Km',
    tabs: ['pod-pending'] as const,
    render: (b) => b.actualKm ?? b.tripKm ?? '—',
  },
  // Timestamp sub-cols for POD Pending
  {
    key: 'ppTsIndent',
    header: 'Indent',
    groupHeader: 'Timestamp',
    tabs: ['pod-pending'] as const,
    render: (b) => <span className="text-xs text-gray-700">{fmtDateTime(b.createdAt)}</span>,
  },
  {
    key: 'ppTsConfirmed',
    header: 'Confirmed',
    groupHeader: 'Timestamp',
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const ts = b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  {
    key: 'ppTsSin',
    header: 'S-in',
    groupHeader: 'Timestamp',
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const ts = b.statusHistory?.find((h) => h.status === 'reached-pickup')?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  {
    key: 'ppTsSout',
    header: 'S-out',
    groupHeader: 'Timestamp',
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const ts = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'in-transit'
      )?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  {
    key: 'ppTsEta',
    header: 'ETA',
    groupHeader: 'Timestamp',
    tabs: ['pod-pending'] as const,
    render: () => <span className="text-xs text-gray-700">—</span>,
  },
  {
    key: 'ppTsDin',
    header: 'D-in',
    groupHeader: 'Timestamp',
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const ts = b.statusHistory?.find((h) => h.status === 'reached-destination')?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  {
    key: 'ppTsDout',
    header: 'D-out',
    groupHeader: 'Timestamp',
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const ts =
        b.podDetails?.deliveredAt ||
        b.statusHistory?.find((h) => h.status === 'delivered')?.timestamp;
      return <span className="text-xs text-gray-700">{fmtDateTime(ts)}</span>;
    },
  },
  // TAT sub-cols for POD Pending
  {
    key: 'ppTatIC',
    header: 'I-C',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const confirmed =
        b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      return tatHours(b.createdAt, confirmed);
    },
  },
  {
    key: 'ppTatCSin',
    header: 'C-Sin',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const confirmed =
        b.assignedAt || b.statusHistory?.find((h) => h.status === 'assigned')?.timestamp;
      const sIn = b.statusHistory?.find((h) => h.status === 'reached-pickup')?.timestamp;
      return tatHours(confirmed, sIn);
    },
  },
  {
    key: 'ppTatSinSout',
    header: 'Sin-Sout',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const sIn = b.statusHistory?.find((h) => h.status === 'reached-pickup')?.timestamp;
      const sOut = b.statusHistory?.find(
        (h) => h.status === 'loaded' || h.status === 'in-transit'
      )?.timestamp;
      return tatHours(sIn, sOut);
    },
  },
  {
    key: 'ppTatTransit',
    header: 'Transit',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const sOut = b.statusHistory?.find((h) => h.status === 'in-transit')?.timestamp;
      const dIn = b.statusHistory?.find((h) => h.status === 'reached-destination')?.timestamp;
      return tatHours(sOut, dIn);
    },
  },
  {
    key: 'ppTatDinDout',
    header: 'Din-Dout',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const dIn = b.statusHistory?.find((h) => h.status === 'reached-destination')?.timestamp;
      const dOut =
        b.podDetails?.deliveredAt ||
        b.statusHistory?.find((h) => h.status === 'delivered')?.timestamp;
      return tatHours(dIn, dOut);
    },
  },
  {
    key: 'ppTatTimeleft',
    header: 'Timeleft',
    groupHeader: 'TAT(hrs)',
    sortable: true,
    tabs: ['pod-pending'] as const,
    render: (b) => {
      const dOut =
        b.podDetails?.deliveredAt ||
        b.statusHistory?.find((h) => h.status === 'delivered')?.timestamp;
      if (!dOut) return '—';
      const diff = (new Date(dOut).getTime() - Date.now()) / 3600000;
      return diff > 0 ? diff.toFixed(1) : '—';
    },
  },
  {
    key: 'ppCustDetention',
    header: 'Customer Detention Charge',
    tabs: ['pod-pending'] as const,
    render: (b) =>
      b.customerDetentionCharge != null ? `₹${b.customerDetentionCharge.toLocaleString()}` : '—',
  },
  {
    key: 'ppSupDetention',
    header: 'Supplier Detention Charge',
    tabs: ['pod-pending'] as const,
    render: (b) =>
      b.supplierDetentionCharge != null ? `₹${b.supplierDetentionCharge.toLocaleString()}` : '—',
  },
  {
    key: 'ppCPrice',
    header: 'C Price',
    tabs: ['pod-pending'] as const,
    render: (b) => (b.customerPrice != null ? `₹${b.customerPrice.toLocaleString()}` : '—'),
  },
  {
    key: 'ppSPrice',
    header: 'S Price',
    tabs: ['pod-pending'] as const,
    render: (b) => (b.supplierPrice != null ? `₹${b.supplierPrice.toLocaleString()}` : '—'),
  },
  {
    key: 'ppTPrice',
    header: 'T Price',
    tabs: ['pod-pending'] as const,
    render: (b) => (b.expectedAmount != null ? `₹${b.expectedAmount.toLocaleString()}` : '—'),
  },
  {
    key: 'ppCreatedBy',
    header: 'Created By',
    tabs: ['pod-pending'] as const,
    render: (b) => b.createdByStaff?.name || '—',
  },

  // ── POD Received tab columns ───────────────────────────────────────────────
  {
    key: 'prIndentId',
    header: 'Indent Id',
    tabs: ['pod-received'] as const,
    searchable: true,
    render: (b) => b.bookingId || '—',
  },
  {
    key: 'prIndentDate',
    header: 'Indent Date',
    tabs: ['pod-received'] as const,
    render: (b) => fmtDate(b.createdAt),
  },
  {
    key: 'prLrNo',
    header: 'LR No',
    tabs: ['pod-received'] as const,
    searchable: true,
    render: (b) => {
      const lrNum = b.lrDetails?.lrNumber || b.lrNumber;
      if (lrNum) return <span className="text-blue-600 font-medium text-xs">{lrNum}</span>;
      return <LRCell b={b} />;
    },
  },
  {
    key: 'prLrDate',
    header: 'LR Date',
    tabs: ['pod-received'] as const,
    render: (b) => fmtDate(b.lrDetails?.lrDate || undefined),
  },
  {
    key: 'prPodUploadedBy',
    header: 'Pod Uploaded By',
    tabs: ['pod-received'] as const,
    render: (b) => {
      if (!b.podDetails) return '—';
      const ub = b.podDetails.uploadedBy;
      return typeof ub === 'string' ? ub : ub?.name || '—';
    },
  },
  {
    key: 'prPodAckDate',
    header: 'POD/ACK Date',
    tabs: ['pod-received'] as const,
    render: (b) => fmtDate(b.podDetails?.ackDate || b.podDetails?.uploadedAt),
  },
  {
    key: 'prTraffic',
    header: 'Traffic',
    tabs: ['pod-received'] as const,
    searchable: true,
    render: (b) => b.trafficController?.name || '—',
  },
  {
    key: 'prSupervisor',
    header: 'Supervisor',
    tabs: ['pod-received'] as const,
    searchable: true,
    render: (b) => b.supervisor?.name || '—',
  },
  {
    key: 'prTruck',
    header: 'Truck',
    tabs: ['pod-received'] as const,
    render: (b) => b.vehicle?.vehicleNumber || '—',
  },
  {
    key: 'prTruckType',
    header: 'Truck Type',
    tabs: ['pod-received'] as const,
    render: (b) => b.truckTypeNeeded || b.vehicle?.truckType || '—',
  },
  {
    key: 'prCustomer',
    header: 'Customer',
    tabs: ['pod-received'] as const,
    searchable: true,
    render: (b) => b.customer?.companyName || '—',
  },
  {
    key: 'prBranchS',
    header: 'Branch(S)',
    tabs: ['pod-received'] as const,
    render: () => '—',
  },
  {
    key: 'prSourceName',
    header: 'Source Name',
    tabs: ['pod-received'] as const,
    render: (b) => b.pickup?.city || '—',
  },
  {
    key: 'prSource',
    header: 'Source',
    tabs: ['pod-received'] as const,
    render: (b) => b.pickup?.address || b.pickup?.city || '—',
  },
  {
    key: 'prDestName',
    header: 'Destination Name',
    tabs: ['pod-received'] as const,
    render: (b) => b.drop?.city || '—',
  },
  {
    key: 'prDestination',
    header: 'Destination',
    tabs: ['pod-received'] as const,
    render: (b) => b.drop?.address || b.drop?.city || '—',
  },
  {
    key: 'prSupplier',
    header: 'Supplier',
    tabs: ['pod-received'] as const,
    searchable: true,
    render: (b) => b.supplier || '—',
  },
  {
    key: 'prDriverNo',
    header: 'Driver No',
    tabs: ['pod-received'] as const,
    render: (b) => b.driver?.phone || '—',
  },
  {
    key: 'prPodVerifiedBy',
    header: 'POD Verified By',
    tabs: ['pod-received'] as const,
    render: (b) => {
      const vb = b.podDetails?.verifiedBy;
      return typeof vb === 'string' ? vb : vb?.name || '—';
    },
  },
  {
    key: 'prPodVerifiedDate',
    header: 'Pod Verified Date',
    tabs: ['pod-received'] as const,
    render: (b) => fmtDate(b.podDetails?.verifiedAt),
  },
  {
    key: 'prAge',
    header: 'Age',
    tabs: ['pod-received'] as const,
    sortable: true,
    render: (b) => {
      const ts =
        b.podDetails?.verifiedAt ||
        b.statusHistory?.find((h) => h.status === 'pod-received')?.timestamp;
      if (!ts) return '—';
      const hrs = (Date.now() - new Date(ts).getTime()) / 3600000;
      if (hrs < 24) return `${Math.round(hrs)}h`;
      return `${Math.floor(hrs / 24)}d ${Math.round(hrs % 24)}h`;
    },
  },
  {
    key: 'prReceivedBy',
    header: 'Received By',
    tabs: ['pod-received'] as const,
    render: (b) => {
      const rb = b.podDetails?.receivedBy;
      return typeof rb === 'string' ? rb : rb?.name || '—';
    },
  },
  {
    key: 'prApprovedBy',
    header: 'Approved By',
    tabs: ['pod-received'] as const,
    render: (b) => {
      const ab = b.podDetails?.approvedBy;
      return typeof ab === 'string' ? ab : ab?.name || '—';
    },
  },
  {
    key: 'prRemark',
    header: 'Remark',
    tabs: ['pod-received'] as const,
    render: (b) => b.podDetails?.remarks || b.remarks || '—',
  },
  {
    key: 'prCourier',
    header: 'Courier',
    tabs: ['pod-received'] as const,
    searchable: true,
    render: (b) => b.podDetails?.courier || '—',
  },
  {
    key: 'prDocketNo',
    header: 'Docket No',
    tabs: ['pod-received'] as const,
    searchable: true,
    render: (b) => b.podDetails?.docketNo || '—',
  },
  {
    key: 'prAckNo',
    header: 'ACK No',
    tabs: ['pod-received'] as const,
    render: (b) => b.podDetails?.ackNo || '—',
  },
  {
    key: 'prDinDout',
    header: 'Din-Dout',
    tabs: ['pod-received'] as const,
    sortable: true,
    render: (b) => {
      const dIn = b.statusHistory?.find((h) => h.status === 'reached-destination')?.timestamp;
      const dOut =
        b.podDetails?.deliveredAt ||
        b.statusHistory?.find((h) => h.status === 'delivered')?.timestamp;
      return tatHours(dIn, dOut);
    },
  },
  {
    key: 'prHireChallan',
    header: 'Hire Challan',
    tabs: ['pod-received'] as const,
    render: (b) => b.hireChallan || '—',
  },
  {
    key: 'prKm',
    header: 'Km',
    tabs: ['pod-received'] as const,
    render: (b) => b.actualKm ?? b.tripKm ?? '—',
  },
  {
    key: 'prCustDetention',
    header: 'Customer Detention Charge',
    tabs: ['pod-received'] as const,
    render: (b) =>
      b.customerDetentionCharge != null ? `₹${b.customerDetentionCharge.toLocaleString()}` : '—',
  },
  {
    key: 'prSupDetention',
    header: 'Supplier Detention',
    tabs: ['pod-received'] as const,
    render: (b) =>
      b.supplierDetentionCharge != null ? `₹${b.supplierDetentionCharge.toLocaleString()}` : '—',
  },

  // ── All tab columns ────────────────────────────────────────────────────────
  {
    key: 'allIndentId',
    header: 'Indent Id',
    tabs: ['all'] as const,
    searchable: true,
    render: (b) => b.bookingId || '—',
  },
  {
    key: 'allAdhoc',
    header: 'Adhoc Trip',
    tabs: ['all'] as const,
    render: (b) => (b.isAdhoc ? 'Yes' : '—'),
  },
  {
    key: 'allBookedBy',
    header: 'Booked By',
    tabs: ['all'] as const,
    searchable: true,
    render: (b) => {
      const bb = b.bookedBy;
      return typeof bb === 'string' ? bb : bb?.name || b.createdByStaff?.name || '—';
    },
  },
  {
    key: 'allLaneCode',
    header: 'Lane Code',
    tabs: ['all'] as const,
    searchable: true,
    render: (b) => b.laneCode || '—',
  },
  {
    key: 'allLrNo',
    header: 'LR No',
    tabs: ['all'] as const,
    searchable: true,
    render: (b) => {
      const lrNum = b.lrDetails?.lrNumber || b.lrNumber;
      if (lrNum) return <span className="text-blue-600 font-medium text-xs">{lrNum}</span>;
      return <LRCell b={b} />;
    },
  },
  {
    key: 'allWeight',
    header: 'Weight',
    tabs: ['all'] as const,
    render: (b) => (b.weight ? `${b.weight.value} ${b.weight.unit}` : '—'),
  },
  {
    key: 'allInvoiceNo',
    header: 'Invoice No',
    tabs: ['all'] as const,
    searchable: true,
    render: (b) => b.invoiceNo || '—',
  },
  {
    key: 'allShipmentNo',
    header: 'Shipment No',
    tabs: ['all'] as const,
    searchable: true,
    render: (b) => b.shipmentNo || '—',
  },
  {
    key: 'allContainerNo',
    header: 'Container No',
    tabs: ['all'] as const,
    searchable: true,
    render: (b) => b.containerNo || '—',
  },
  {
    key: 'allPo',
    header: 'PO',
    tabs: ['all'] as const,
    searchable: true,
    render: (b) => b.poNumber || '—',
  },
  {
    key: 'allTxnType',
    header: 'Transaction Type',
    tabs: ['all'] as const,
    render: (b) => b.bookingType || '—',
  },

  // ── Available tab columns ──────────────────────────────────────────────────
  {
    key: 'avTruck',
    header: 'Truck',
    tabs: ['available'] as const,
    render: (b) => b.vehicle?.vehicleNumber || '—',
  },
  {
    key: 'avDriverNo',
    header: 'Driver No',
    tabs: ['available'] as const,
    render: (b) => b.driver?.phone || '—',
  },
  {
    key: 'avSupplier',
    header: 'Supplier',
    tabs: ['available'] as const,
    searchable: true,
    render: (b) => b.supplier || '—',
  },
  {
    key: 'avTruckType',
    header: 'Truck Type',
    tabs: ['available'] as const,
    render: (b) => b.truckTypeNeeded || b.vehicle?.truckType || '—',
  },
  {
    key: 'avOwnership',
    header: 'Ownership',
    tabs: ['available'] as const,
    render: () => '—',
  },
  {
    key: 'avStatus',
    header: 'Status',
    tabs: ['available'] as const,
    render: (b) => statusBadge(b.status),
  },
  {
    key: 'avDriver',
    header: 'Driver',
    tabs: ['available'] as const,
    searchable: true,
    render: (b) => b.driver?.name || '—',
  },
  {
    key: 'avCity',
    header: 'City',
    tabs: ['available'] as const,
    render: (b) => b.pickup?.city || '—',
  },
  {
    key: 'avRegion',
    header: 'Region',
    tabs: ['available'] as const,
    render: () => '—',
  },
  {
    key: 'avRemarks',
    header: 'Remarks',
    tabs: ['available'] as const,
    render: (b) => b.remarks || '—',
  },
];

// ─── Tooltip wrapper ──────────────────────────────────────────────────────────

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-gray-800 px-2 py-0.5 text-xs text-white opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">
        {label}
      </span>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function UpdateLRModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    setSaving(true);
    try {
      await documentApi.uploadLR(booking._id, files);
      toast.success('LR updated successfully');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to upload LR');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update LR — {booking.bookingId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>LR Documents (up to 5)</Label>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
            />
          </div>
          {files.length > 0 && (
            <ul className="text-xs text-gray-600 space-y-0.5">
              {files.map((f, i) => (
                <li key={i}>• {f.name}</li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || files.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTripModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleDelete = async () => {
    setSaving(true);
    try {
      await bookingApi.updateStatus(booking._id, {
        status: 'cancelled',
        notes: 'Deleted from Trips page',
      });
      toast.success('Trip cancelled');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to cancel trip');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancel Trip</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 py-2">
          Are you sure you want to cancel trip <strong>{booking.bookingId}</strong>? This action
          cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            No, keep it
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TripCommentsModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!note.trim()) {
      toast.error('Enter a comment');
      return;
    }
    setSaving(true);
    try {
      await bookingApi.addNote(booking._id, { text: note });
      toast.success('Comment added');
      setNote('');
      onSuccess();
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trip Comments — {booking.bookingId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Textarea
            placeholder="Add an internal comment..."
            className="min-h-[100px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="text-xs text-gray-400">Only visible to staff members.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button onClick={handleAdd} disabled={saving || !note.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Action buttons cell ──────────────────────────────────────────────────────

type ModalType = 'lr' | 'delete' | 'comment' | null;

function ActionCell({ booking, onRefresh }: { booking: Booking; onRefresh: () => void }) {
  const [modal, setModal] = useState<ModalType>(null);

  const handleShare = () => {
    const url = `${window.location.origin}/bookings/${booking._id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied to clipboard'));
  };

  return (
    <>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Tip label="Update LR">
          <button
            className="p-1 rounded hover:bg-green-50 text-green-600 transition-colors"
            onClick={() => setModal('lr')}
          >
            <FileText className="h-4 w-4" />
          </button>
        </Tip>
        <Tip label="Cancel Trip">
          <button
            className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors"
            onClick={() => setModal('delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </Tip>
        <Tip label="Copy Share Link">
          <button
            className="p-1 rounded hover:bg-blue-50 text-blue-500 transition-colors"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </button>
        </Tip>
        <Tip label="Trip Comments">
          <button
            className="p-1 rounded hover:bg-purple-50 text-purple-500 transition-colors"
            onClick={() => setModal('comment')}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </Tip>
      </div>

      {modal === 'lr' && (
        <UpdateLRModal booking={booking} onClose={() => setModal(null)} onSuccess={onRefresh} />
      )}
      {modal === 'delete' && (
        <DeleteTripModal booking={booking} onClose={() => setModal(null)} onSuccess={onRefresh} />
      )}
      {modal === 'comment' && (
        <TripCommentsModal booking={booking} onClose={() => setModal(null)} onSuccess={onRefresh} />
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function TripsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('confirmed');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [detentionEditId, setDetentionEditId] = useState<{
    id: string;
    field: 'customerDetentionCharge' | 'supplierDetentionCharge';
  } | null>(null);
  const [savingDetention, setSavingDetention] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const saveDetention = async (
    id: string,
    field: 'customerDetentionCharge' | 'supplierDetentionCharge',
    value: string
  ) => {
    const num = value.trim() === '' ? null : parseFloat(value);
    if (num !== null && isNaN(num)) return;
    setSavingDetention(id);
    try {
      await bookingApi.update(id, { [field]: num } as any);
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, [field]: num } : b)));
      toast.success('Detention charge saved');
    } catch {
      toast.error('Failed to save detention charge');
    } finally {
      setSavingDetention(null);
      setDetentionEditId(null);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const tabConfig = TABS.find((t) => t.key === activeTab)!;
  const statusParam = tabConfig.statuses.length > 0 ? tabConfig.statuses.join(',') : undefined;

  const fetchBookings = useCallback(
    async (pg = 1) => {
      setLoading(true);
      try {
        const res = await bookingApi.getAll({ status: statusParam, page: pg, limit: PAGE_SIZE });
        const d = res.data.data as any;
        const items: Booking[] = d.bookings ?? d.items ?? [];
        const pagination = d.pagination ?? {};
        setBookings(items);
        setTotalPages(pagination.totalPages ?? pagination.pages ?? 1);
        setTotalItems(pagination.totalItems ?? pagination.total ?? items.length);
      } catch {
        toast.error('Failed to fetch trips');
      } finally {
        setLoading(false);
      }
    },
    [statusParam]
  );

  useEffect(() => {
    bookingApi
      .getStats()
      .then((r) => {
        const s = r.data.data as any;
        const bd: Record<string, number> = s.statusBreakdown ?? {};
        setCounts({
          created: bd['created'] ?? 0,
          'under-review': bd['under-review'] ?? s.newRequests ?? 0,
          assigned: bd['assigned'] ?? s.assigned ?? 0,
          'driver-en-route': bd['driver-en-route'] ?? 0,
          'reached-pickup': bd['reached-pickup'] ?? 0,
          loaded: bd['loaded'] ?? 0,
          'in-transit': bd['in-transit'] ?? s.inTransit ?? 0,
          'reached-destination': bd['reached-destination'] ?? 0,
          delivered: bd['delivered'] ?? 0,
          'pod-received': bd['pod-received'] ?? s.podPending ?? 0,
          closed: bd['closed'] ?? 0,
          cancelled: bd['cancelled'] ?? s.cancelled ?? 0,
          all: s.total ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    fetchBookings(1);
  }, [activeTab, fetchBookings]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchBookings(p);
  };

  const visibleCols = COLS.filter(
    (c) => c.tabs === 'all' || (c.tabs as readonly TabKey[]).includes(activeTab)
  );

  const filteredBookings = (() => {
    let rows = bookings.filter((b) =>
      Object.entries(columnSearch).every(([key, val]) => {
        if (!val) return true;
        const col = visibleCols.find((c) => c.key === key);
        if (!col?.searchable) return true;
        const rendered = col.render(b);
        const text = typeof rendered === 'string' ? rendered : b.bookingId || b._id;
        return text.toLowerCase().includes(val.toLowerCase());
      })
    );
    if (sortKey) {
      const ms = (ts?: string) => (ts ? new Date(ts).getTime() : 0);
      const sh = (b: Booking, ...statuses: string[]) =>
        b.statusHistory?.find((h) => statuses.includes(h.status))?.timestamp;
      rows = [...rows].sort((a, b) => {
        let av = 0,
          bv = 0;
        const diff = (from?: string, to?: string) =>
          from && to ? (ms(to) - ms(from)) / 3600000 : 0;
        if (sortKey === 'allTatIC') {
          av = diff(a.createdAt, a.assignedAt || sh(a, 'assigned'));
          bv = diff(b.createdAt, b.assignedAt || sh(b, 'assigned'));
        } else if (sortKey === 'allTatCSin') {
          av = diff(a.assignedAt || sh(a, 'assigned'), sh(a, 'reached-pickup'));
          bv = diff(b.assignedAt || sh(b, 'assigned'), sh(b, 'reached-pickup'));
        } else if (sortKey === 'allTatSinSout') {
          av = diff(sh(a, 'reached-pickup'), sh(a, 'loaded', 'in-transit'));
          bv = diff(sh(b, 'reached-pickup'), sh(b, 'loaded', 'in-transit'));
        } else if (sortKey === 'allTatTransit') {
          av = diff(sh(a, 'in-transit'), sh(a, 'reached-destination'));
          bv = diff(sh(b, 'in-transit'), sh(b, 'reached-destination'));
        } else if (sortKey === 'allTatDinDout' || sortKey === 'allTatHalting') {
          av = diff(sh(a, 'reached-destination'), a.podDetails?.deliveredAt || sh(a, 'delivered'));
          bv = diff(sh(b, 'reached-destination'), b.podDetails?.deliveredAt || sh(b, 'delivered'));
        } else if (sortKey === 'allTatTimeleft') {
          const dOutA = a.podDetails?.deliveredAt || sh(a, 'delivered');
          const dOutB = b.podDetails?.deliveredAt || sh(b, 'delivered');
          av = dOutA ? (ms(dOutA) - Date.now()) / 3600000 : 0;
          bv = dOutB ? (ms(dOutB) - Date.now()) / 3600000 : 0;
        } else if (sortKey === 'prAge') {
          const getAge = (bk: Booking) => {
            const ts =
              bk.podDetails?.verifiedAt ||
              bk.statusHistory?.find((h) => h.status === 'pod-received')?.timestamp;
            return ts ? (Date.now() - new Date(ts).getTime()) / 3600000 : 0;
          };
          av = getAge(a);
          bv = getAge(b);
        } else if (sortKey === 'prDinDout') {
          av = diff(sh(a, 'reached-destination'), a.podDetails?.deliveredAt || sh(a, 'delivered'));
          bv = diff(sh(b, 'reached-destination'), b.podDetails?.deliveredAt || sh(b, 'delivered'));
        } else if (sortKey === 'ppAge') {
          const getAge = (bk: Booking) => {
            const dOut =
              bk.podDetails?.deliveredAt ||
              bk.statusHistory?.find((h) => h.status === 'delivered')?.timestamp;
            return dOut ? (Date.now() - new Date(dOut).getTime()) / 3600000 : 0;
          };
          av = getAge(a);
          bv = getAge(b);
        } else if (sortKey === 'ppTatIC') {
          av = diff(a.createdAt, a.assignedAt || sh(a, 'assigned'));
          bv = diff(b.createdAt, b.assignedAt || sh(b, 'assigned'));
        } else if (sortKey === 'ppTatCSin') {
          av = diff(a.assignedAt || sh(a, 'assigned'), sh(a, 'reached-pickup'));
          bv = diff(b.assignedAt || sh(b, 'assigned'), sh(b, 'reached-pickup'));
        } else if (sortKey === 'ppTatSinSout') {
          av = diff(sh(a, 'reached-pickup'), sh(a, 'loaded', 'in-transit'));
          bv = diff(sh(b, 'reached-pickup'), sh(b, 'loaded', 'in-transit'));
        } else if (sortKey === 'ppTatTransit') {
          av = diff(sh(a, 'in-transit'), sh(a, 'reached-destination'));
          bv = diff(sh(b, 'in-transit'), sh(b, 'reached-destination'));
        } else if (sortKey === 'ppTatDinDout') {
          av = diff(sh(a, 'reached-destination'), a.podDetails?.deliveredAt || sh(a, 'delivered'));
          bv = diff(sh(b, 'reached-destination'), b.podDetails?.deliveredAt || sh(b, 'delivered'));
        } else if (sortKey === 'ppTatTimeleft') {
          const dOutA = a.podDetails?.deliveredAt || sh(a, 'delivered');
          const dOutB = b.podDetails?.deliveredAt || sh(b, 'delivered');
          av = dOutA ? (ms(dOutA) - Date.now()) / 3600000 : 0;
          bv = dOutB ? (ms(dOutB) - Date.now()) / 3600000 : 0;
        } else if (sortKey === 'tatIC' || sortKey === 'avTatIC') {
          av = diff(a.createdAt, a.assignedAt || sh(a, 'assigned'));
          bv = diff(b.createdAt, b.assignedAt || sh(b, 'assigned'));
        } else if (sortKey === 'tatCSin' || sortKey === 'avTatCSin') {
          av = diff(a.assignedAt || sh(a, 'assigned'), sh(a, 'reached-pickup'));
          bv = diff(b.assignedAt || sh(b, 'assigned'), sh(b, 'reached-pickup'));
        } else if (sortKey === 'avTatSinSout') {
          av = diff(sh(a, 'reached-pickup'), sh(a, 'loaded', 'in-transit'));
          bv = diff(sh(b, 'reached-pickup'), sh(b, 'loaded', 'in-transit'));
        } else if (sortKey === 'avTatTransit') {
          av = diff(sh(a, 'in-transit'), sh(a, 'reached-destination'));
          bv = diff(sh(b, 'in-transit'), sh(b, 'reached-destination'));
        } else if (sortKey === 'avTatDinDout') {
          av = diff(sh(a, 'reached-destination'), a.podDetails?.deliveredAt || sh(a, 'delivered'));
          bv = diff(sh(b, 'reached-destination'), b.podDetails?.deliveredAt || sh(b, 'delivered'));
        } else if (sortKey === 'avTatTimeleft') {
          const dOutA = a.podDetails?.deliveredAt || sh(a, 'delivered');
          const dOutB = b.podDetails?.deliveredAt || sh(b, 'delivered');
          av = dOutA ? (ms(dOutA) - Date.now()) / 3600000 : 0;
          bv = dOutB ? (ms(dOutB) - Date.now()) / 3600000 : 0;
        }
        return sortDir === 'asc' ? av - bv : bv - av;
      });
    }
    return rows;
  })();

  const tabCount = (tab: (typeof TABS)[number]) => {
    if (tab.key === 'all') return counts['all'] ?? 0;
    return tab.statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  };

  return (
    <div className="flex flex-col h-full -m-4 md:-m-6">
      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center overflow-x-auto scrollbar-none shrink-0">
        {TABS.map((tab) => {
          const count = tabCount(tab);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold',
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 py-2 pl-4 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchBookings(page)}
            disabled={loading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="text-sm border-collapse min-w-max w-full">
          <thead className="sticky top-0 z-10 bg-white">
            {/* Row 0: group headers (Timestamp / TAT(hrs) spans) */}
            {(() => {
              // Build group cells: collapse consecutive cols with same groupHeader into one span
              const cells: { label: string | null; span: number }[] = [];
              for (const col of visibleCols) {
                const g = col.groupHeader ?? null;
                const last = cells[cells.length - 1];
                if (last && last.label === g && g !== null) {
                  last.span++;
                } else {
                  cells.push({ label: g, span: 1 });
                }
              }
              const hasGroups = cells.some((c) => c.label !== null);
              if (!hasGroups) return null;
              return (
                <tr className="border-b border-gray-100">
                  <th className="sticky left-0 z-20 bg-white border-r border-gray-100" />
                  {cells.map((c, i) => (
                    <th
                      key={i}
                      colSpan={c.span}
                      className={cn(
                        'px-3 py-1 text-center text-[10px] font-semibold border-r border-gray-100',
                        c.label ? 'text-gray-600 bg-gray-50' : 'bg-white text-transparent'
                      )}
                    >
                      {c.label ?? ''}
                    </th>
                  ))}
                </tr>
              );
            })()}
            {/* Row 1: column headers */}
            <tr className="border-b border-gray-200">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap border-r border-gray-100 bg-gray-50 w-32 sticky left-0 z-20">
                <div className="flex items-center gap-1">
                  <span>Actions</span>
                </div>
              </th>
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={cn(
                    'px-3 py-2 text-left text-xs font-medium text-gray-600 whitespace-nowrap border-r border-gray-100 bg-white',
                    col.sortable && 'cursor-pointer hover:bg-gray-50 select-none'
                  )}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <ChevronsUpDown
                        className={cn(
                          'h-3 w-3',
                          sortKey === col.key ? 'text-blue-500' : 'text-gray-300'
                        )}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
            {/* Row 2: search inputs */}
            <tr className="bg-gray-50 border-b border-gray-200">
              <td className="px-2 py-1 border-r border-gray-100 sticky left-0 bg-gray-50 z-20">
                <span className="text-gray-400 text-xs select-none">⬇ export</span>
              </td>
              {visibleCols.map((col) => (
                <td key={col.key} className="px-2 py-1 border-r border-gray-100">
                  {col.searchable ? (
                    <div className="relative flex items-center">
                      <Search className="absolute left-1.5 h-3 w-3 text-gray-400 pointer-events-none" />
                      <Input
                        value={columnSearch[col.key] || ''}
                        onChange={(e) =>
                          setColumnSearch((p) => ({ ...p, [col.key]: e.target.value }))
                        }
                        className="h-6 pl-5 pr-5 text-xs rounded border-gray-200 w-28"
                      />
                      {columnSearch[col.key] && (
                        <button
                          onClick={() => setColumnSearch((p) => ({ ...p, [col.key]: '' }))}
                          className="absolute right-1"
                        >
                          <X className="h-3 w-3 text-gray-400" />
                        </button>
                      )}
                    </div>
                  ) : null}
                </td>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={visibleCols.length + 1} className="py-16 text-center text-gray-400">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading...
                </td>
              </tr>
            )}
            {!loading && filteredBookings.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length + 1} className="py-16 text-center">
                  <Inbox className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400 text-sm">No data</p>
                </td>
              </tr>
            )}
            {!loading &&
              filteredBookings.map((b, i) => (
                <tr
                  key={b._id}
                  className={cn(
                    'border-b border-gray-100 hover:bg-blue-50/40 transition-colors group',
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  )}
                >
                  {/* Sticky actions cell */}
                  <td
                    className={cn(
                      'px-2 py-2 border-r border-gray-100 whitespace-nowrap sticky left-0 z-10',
                      i % 2 === 0
                        ? 'bg-white group-hover:bg-blue-50/40'
                        : 'bg-gray-50/30 group-hover:bg-blue-50/40'
                    )}
                  >
                    <ActionCell booking={b} onRefresh={() => fetchBookings(page)} />
                  </td>
                  {visibleCols.map((col) => {
                    const isDetentionCol =
                      col.key === 'ppCustDetention' || col.key === 'ppSupDetention';
                    const detentionField =
                      col.key === 'ppCustDetention'
                        ? 'customerDetentionCharge'
                        : 'supplierDetentionCharge';
                    const isEditingThis =
                      detentionEditId?.id === b._id && detentionEditId?.field === detentionField;

                    if (isDetentionCol) {
                      return (
                        <td
                          key={col.key}
                          className="px-3 py-2 border-r border-gray-100 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isEditingThis ? (
                            <input
                              autoFocus
                              type="number"
                              min="0"
                              defaultValue={(b[detentionField as keyof Booking] as number) ?? ''}
                              disabled={savingDetention === b._id}
                              onBlur={(e) =>
                                saveDetention(b._id, detentionField as any, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                  saveDetention(
                                    b._id,
                                    detentionField as any,
                                    (e.target as HTMLInputElement).value
                                  );
                                if (e.key === 'Escape') setDetentionEditId(null);
                              }}
                              className="w-24 text-xs border border-blue-400 rounded px-1.5 py-0.5 focus:outline-none disabled:opacity-50"
                            />
                          ) : (
                            <button
                              onClick={() =>
                                setDetentionEditId({ id: b._id, field: detentionField as any })
                              }
                              className="text-xs text-gray-700 hover:text-blue-600 hover:underline min-w-[60px] text-left"
                              title="Click to edit"
                            >
                              {(b[detentionField as keyof Booking] as number) != null ? (
                                `₹${(b[detentionField as keyof Booking] as number).toLocaleString()}`
                              ) : (
                                <span className="text-gray-400">— set</span>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={col.key}
                        onClick={() => router.push(`/bookings/${b._id}`)}
                        className="px-3 py-2 border-r border-gray-100 whitespace-nowrap text-gray-700 cursor-pointer"
                      >
                        {col.render(b)}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm shrink-0">
          <span className="text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} of{' '}
            {totalItems}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="h-7"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="h-7"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
