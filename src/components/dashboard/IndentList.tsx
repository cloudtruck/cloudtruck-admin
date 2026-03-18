'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Inbox,
  Search,
  Settings,
  FileText,
  Clock,
  Trash2,
  Share2,
  MessageCircle,
  X,
  Eye,
  Image as ImageIcon,
  Download,
  Upload,
  InboxIcon,
  Phone,
  Pencil,
} from 'lucide-react';
import { Booking } from '@/types';
import { Staff } from '@/types/organization.types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { bookingApi, documentApi, staffApi } from '@/lib/api';
import { toast } from 'sonner';
import { toCsvString, downloadCsv } from '@/lib/exportCsv';

// ─── Upload Images Modal ──────────────────────────────────────────────────────
type DocType = 'lr' | 'pod' | 'loading-memo' | 'other';

interface UploadModalState {
  bookingId: string;
  docType: DocType;
  maxFiles: number;
  label: string;
}

function UploadImagesModal({
  state,
  onClose,
  onSuccess,
}: {
  state: UploadModalState;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploading(true);
      setUploadError(null);
      try {
        if (state.docType === 'lr') {
          await documentApi.uploadLR(state.bookingId, files);
        } else if (state.docType === 'pod') {
          await documentApi.uploadPOD(state.bookingId, files[0]);
        } else if (state.docType === 'loading-memo') {
          await documentApi.uploadLoadingMemo(state.bookingId, files);
        } else {
          await documentApi.uploadOtherDocuments(state.bookingId, files);
        }
        toast.success(`${state.label} uploaded successfully`);
        onSuccess();
        onClose();
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || `Failed to upload ${state.label}`;
        setUploadError(msg);
        toast.error(msg);
      } finally {
        setUploading(false);
      }
    },
    [state, onClose, onSuccess]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files).slice(0, state.maxFiles));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Upload Images</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer',
              dragging
                ? 'border-purple-400 bg-purple-50'
                : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/30'
            )}
            onClick={() => inputRef.current?.click()}
          >
            <div className="text-purple-500">
              <InboxIcon className="h-12 w-12" strokeWidth={1.2} />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Click or drag file to this area to upload
            </p>
            <p className="text-xs text-gray-400">
              Support for a single upload
              {state.maxFiles > 1 ? ` (max ${state.maxFiles} files)` : '.'}
            </p>
            <button
              type="button"
              className="mt-2 flex items-center gap-2 px-4 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              Click to Upload
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple={state.maxFiles > 1}
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => handleFiles(Array.from(e.target.files || []).slice(0, state.maxFiles))}
          />
          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Uploading...
            </div>
          )}
          {uploadError && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
              <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{uploadError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface IndentListProps {
  bookings: Booking[];
  loading?: boolean;
  stageTitle: string;
  showActions?: boolean;
  showLrWeight?: boolean; // LR No + Weight columns
  showLocation?: boolean; // Location column
  showStageTats?: boolean; // Indent/Confirmed/S-in timestamps + I-C/C-Sin/Sin-Sout TATs
}

// Helper: get timestamp of a specific status from statusHistory
function getStatusTime(b: Booking, status: string): string | undefined {
  return b.statusHistory?.find((h) => h.status === status)?.timestamp;
}

// Helper: diff in hours between two ISO strings
function hoursDiff(from?: string, to?: string): string {
  if (!from || !to) return '—';
  const diff = (new Date(to).getTime() - new Date(from).getTime()) / 3600000;
  return diff < 0 ? '—' : diff.toFixed(1);
}

// Format timestamp as "DD-Mon-YY HH:MM"
function fmtTs(ts?: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en', { month: 'short' });
  const yr = String(d.getFullYear()).slice(2);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${mon}-${yr} ${hh}:${mm}`;
}

// Column header helper
function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-3 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 border-b border-gray-100',
        className
      )}
    >
      {children}
    </th>
  );
}

function ThSearch({ label }: { label: string }) {
  return (
    <th className="px-3 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 border-b border-gray-100">
      <div className="flex items-center gap-1">
        {label} <Search className="h-2.5 w-2.5 opacity-40" />
      </div>
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={cn(
        'px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap border-b border-gray-50',
        className
      )}
    >
      {children}
    </td>
  );
}

export function IndentList({
  bookings,
  loading,
  stageTitle,
  showActions = true,
  showLrWeight = false,
  showLocation = false,
  showStageTats = false,
}: IndentListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [remarks, setRemarks] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deletingLR, setDeletingLR] = useState(false);
  const [confirmDeleteLR, setConfirmDeleteLR] = useState(false);

  const [lrTarget, setLrTarget] = useState<Booking | null>(null);
  const [lrLoading, setLrLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState<UploadModalState | null>(null);

  const [commentTarget, setCommentTarget] = useState<Booking | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Supervisor edit
  const [supervisorEditId, setSupervisorEditId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [savingSupervisor, setSavingSupervisor] = useState(false);

  const [indentTypeEditId, setIndentTypeEditId] = useState<string | null>(null);
  const [savingIndentType, setSavingIndentType] = useState<string | null>(null);
  const [indentTypeOverrides, setIndentTypeOverrides] = useState<Record<string, string>>({});

  const handleIndentTypeChange = async (id: string, value: 'FTL' | 'PTL' | 'LCL') => {
    setSavingIndentType(id);
    try {
      await bookingApi.update(id, { indentType: value });
      setIndentTypeOverrides((prev) => ({ ...prev, [id]: value }));
      toast.success('Transaction type updated');
    } catch {
      toast.error('Failed to update transaction type');
    } finally {
      setSavingIndentType(null);
      setIndentTypeEditId(null);
    }
  };
  const supervisorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (supervisorEditId) {
      staffApi
        .getAll({ limit: 100 })
        .then((res) => {
          setStaffList(res.data.data?.staff || []);
        })
        .catch(() => setStaffList([]));
      setStaffSearch('');
    }
  }, [supervisorEditId]);

  // Close supervisor dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (supervisorRef.current && !supervisorRef.current.contains(e.target as Node)) {
        setSupervisorEditId(null);
      }
    }
    if (supervisorEditId) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [supervisorEditId]);

  async function handleSupervisorChange(bookingId: string, staffMember: Staff) {
    setSavingSupervisor(true);
    try {
      await bookingApi.update(bookingId, { supervisor: staffMember._id } as any);
      toast.success(`Supervisor updated to ${staffMember.name}`);
      setSupervisorEditId(null);
    } catch {
      toast.error('Failed to update supervisor');
    } finally {
      setSavingSupervisor(false);
    }
  }

  async function handleDownload(url: string | undefined, filename: string) {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = blob.type.includes('pdf') ? '.pdf' : blob.type.includes('png') ? '.png' : '.jpg';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download =
        filename.endsWith('.pdf') || filename.endsWith('.jpg') || filename.endsWith('.png')
          ? filename
          : `${filename}${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('Failed to download file');
    }
  }

  async function handleDeleteDoc(docId: string) {
    setDeletingDocId(docId);
    try {
      await documentApi.deleteDocument(docId);
      toast.success('Document deleted');
      if (lrTarget) {
        const res = await bookingApi.getById(lrTarget._id);
        setLrTarget(res.data.data);
      }
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeletingDocId(null);
    }
  }

  async function handleDeleteLR() {
    if (!lrTarget) return;
    setDeletingLR(true);
    try {
      await documentApi.deleteLR(lrTarget._id);
      toast.success('LR deleted successfully');
      setConfirmDeleteLR(false);
      const res = await bookingApi.getById(lrTarget._id);
      setLrTarget(res.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete LR');
    } finally {
      setDeletingLR(false);
    }
  }

  async function handleOpenLR(b: Booking) {
    setLrTarget(b);
    setLrLoading(true);
    try {
      const res = await bookingApi.getById(b._id);
      setLrTarget(res.data.data);
    } catch {
      // keep showing with existing data
    } finally {
      setLrLoading(false);
    }
  }

  async function refreshLrTarget(bookingId: string) {
    try {
      const res = await bookingApi.getById(bookingId);
      setLrTarget(res.data.data);
    } catch {
      // ignore
    }
  }

  function openUpload(docType: DocType, label: string, maxFiles: number) {
    if (!lrTarget) return;
    setUploadModal({ bookingId: lrTarget._id, docType, label, maxFiles });
  }

  async function handleOpenComments(b: Booking) {
    setCommentTarget(b);
    setNoteText('');
    setLogsLoading(true);
    try {
      const res = await bookingApi.getAuditLogs(b._id);
      setAuditLogs(res.data.data || []);
    } catch {
      setAuditLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  async function handleSubmitNote() {
    if (!commentTarget || !noteText.trim()) return;
    setSubmittingNote(true);
    try {
      await bookingApi.addNote(commentTarget._id, { text: noteText });
      setNoteText('');
      const res = await bookingApi.getAuditLogs(commentTarget._id);
      setAuditLogs(res.data.data || []);
    } catch {
      toast.error('Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  }

  function handleShare(b: Booking) {
    const id = b.bookingId || b._id;
    const from = b.pickup?.city || '—';
    const to = b.drop?.city || '—';
    const vehicle = b.vehicle?.vehicleNumber || '—';
    const status = stageTitle;
    const url = `${window.location.origin}/trip?id=${b._id}`;
    const text = `#${id} ${from} to ${to} ${vehicle} ${status}\nGet Trip details and documents from here:\n\n${url}`;
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await bookingApi.cancel(deleteTarget._id, { reason: remarks });
      toast.success('Indent deleted successfully');
      setDeleteTarget(null);
      setRemarks('');
    } catch {
      toast.error('Failed to delete indent');
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    const headers = [
      'Indent Id',
      'Lane Code',
      'LR No',
      'Weight',
      'Transaction Type',
      'Load Type',
      'EXIM',
      'Traffic',
      'Supervisor',
      'Customer',
      'Branch(S)',
      'Source',
      'Source Code',
      'Destination',
      'Destination Code',
      'Supplier',
      'BOE/Booking No',
      'Job No',
      'Truck',
      'Driver No',
      'Truck Type',
      'Km',
      'Timestamp',
      'TAT(hrs)',
    ];
    const rows = bookings.map((b) => [
      b.bookingId || '',
      b.laneCode || '',
      b.lrDetails?.lrNumber || b.lrNumber || '',
      b.weight ? `${b.weight.value} ${b.weight.unit}` : '',
      b.indentType || 'FTL',
      b.materialType || '',
      b.exim || '',
      b.trafficController?.name || '',
      b.supervisor?.name || '',
      b.customer?.companyName || '',
      b.pickup?.city || '',
      b.pickup?.address || '',
      (b as any).sourceCode || '',
      b.drop?.city || '',
      (b as any).destinationCode || '',
      (b as any).supplier || '',
      (b as any).boeNumber || '',
      (b as any).jobNo || '',
      b.vehicle?.vehicleNumber || '',
      b.driver?.phone || '',
      b.vehicle?.truckType || '',
      (b as any).tripKm ?? (b as any).actualKm ?? '',
      b.createdAt ? new Date(b.createdAt).toLocaleString('en-IN') : '',
      hoursDiff(b.createdAt, b.updatedAt),
    ]);
    downloadCsv(
      `${stageTitle.replace(/\s+/g, '-').toLowerCase()}-indents.csv`,
      toCsvString(headers, rows)
    );
  }

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white">
        <Settings className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {stageTitle}
        </span>
        <div className="flex-1" />
        <FileText
          aria-label="Export"
          onClick={handleExport}
          className="h-4 w-4 text-green-600 cursor-pointer hover:text-green-700"
        />
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Inbox className="h-12 w-12 mb-2 opacity-30" />
          <p className="text-sm">No data</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {showActions && <Th className="w-20">Actions</Th>}
                <ThSearch label="Indent Id" />
                <Th>Lane Code</Th>
                {showLrWeight && <ThSearch label="LR No" />}
                {showLrWeight && <ThSearch label="Weight" />}
                <Th>Transaction Type</Th>
                <Th>Load Type</Th>
                <Th>EXIM</Th>
                <ThSearch label="Traffic" />
                <ThSearch label="Supervisor" />
                <ThSearch label="Customer" />
                <Th>Branch(S)</Th>
                <Th>Source</Th>
                <Th>Source Code</Th>
                <Th>Destination</Th>
                <Th>Destination Code</Th>
                <Th>Supplier</Th>
                <Th>BOE/Booking No</Th>
                <Th>Job No</Th>
                <Th>Hire Challan</Th>
                <Th>Branch(D)</Th>
                <Th>Truck</Th>
                <ThSearch label="Driver No" />
                {showLocation && <Th>Location</Th>}
                <Th>Truck Type</Th>
                <Th>Km</Th>
                <Th>Timestamp</Th>
                <Th>TAT(hrs)</Th>
                <Th>C Price</Th>
                <Th>S Price</Th>
                <Th>T Price</Th>
                <Th>Created by</Th>
                {showStageTats && <Th>Indent</Th>}
                {showStageTats && <Th>Confirmed</Th>}
                {showStageTats && <Th>S-in</Th>}
                {showStageTats && <Th>I-C</Th>}
                {showStageTats && <Th>C-Sin</Th>}
                {showStageTats && <Th>Sin-Sout</Th>}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => {
                const indentTs = b.createdAt;
                const confirmedTs = getStatusTime(b, 'assigned');
                const sinTs = getStatusTime(b, 'loaded') || getStatusTime(b, 'reached-pickup');
                const soutTs =
                  getStatusTime(b, 'in-transit') || getStatusTime(b, 'reached-destination');

                const icHrs = hoursDiff(indentTs, confirmedTs);
                const cSinHrs = hoursDiff(confirmedTs, sinTs);
                const sinSoutHrs = hoursDiff(sinTs, soutTs);

                // Overall TAT: indent → current update
                const tatHrs = hoursDiff(indentTs, b.updatedAt);

                return (
                  <tr
                    key={b._id}
                    className={cn(
                      'hover:bg-blue-50/30 transition-colors',
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                    )}
                  >
                    {showActions && (
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <button
                            aria-label="Timeline"
                            className="text-blue-500 hover:text-blue-700 p-0.5"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                          <button
                            aria-label="Delete"
                            onClick={() => {
                              setDeleteTarget(b);
                              setRemarks('');
                            }}
                            className="text-red-400 hover:text-red-600 p-0.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            aria-label="Share"
                            onClick={() => handleShare(b)}
                            className="text-blue-400 hover:text-blue-600 p-0.5"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            aria-label="Chat"
                            onClick={() => handleOpenComments(b)}
                            className="text-gray-400 hover:text-gray-600 p-0.5"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </Td>
                    )}
                    {/* Indent Id */}
                    <Td>
                      <Link
                        href={`/bookings/${b._id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {b.bookingId || '—'}
                      </Link>
                    </Td>
                    {/* Lane Code */}
                    <Td>{b.laneCode || '—'}</Td>
                    {/* LR No */}
                    {showLrWeight && (
                      <Td>
                        {b.lrNumber ? (
                          <button
                            onClick={() => handleOpenLR(b)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-400" />
                            <span className="font-medium">{b.lrNumber}</span>
                          </button>
                        ) : (
                          '—'
                        )}
                      </Td>
                    )}
                    {/* Weight */}
                    {showLrWeight && (
                      <Td>{b.weight ? `${b.weight.value} ${b.weight.unit}` : '—'}</Td>
                    )}
                    {/* Transaction Type */}
                    <Td>
                      {indentTypeEditId === b._id ? (
                        <select
                          autoFocus
                          defaultValue={indentTypeOverrides[b._id] || b.indentType || ''}
                          onChange={(e) =>
                            handleIndentTypeChange(b._id, e.target.value as 'FTL' | 'PTL' | 'LCL')
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
                          <span className="font-medium text-gray-700">
                            {indentTypeOverrides[b._id] || b.indentType || '—'}
                          </span>
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
                    {/* Load Type */}
                    <Td>{b.materialType || '—'}</Td>
                    {/* EXIM */}
                    <Td>{b.exim ? b.exim.charAt(0).toUpperCase() + b.exim.slice(1) : '—'}</Td>
                    {/* Traffic */}
                    <Td>
                      {b.trafficController?.name ? (
                        <div className="flex items-center gap-1">
                          {b.trafficController.phone && (
                            <a
                              href={`tel:${b.trafficController.phone}`}
                              className="text-blue-500 hover:text-blue-700 shrink-0"
                              title={`Call ${b.trafficController.name}`}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <span>{b.trafficController.name}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </Td>
                    {/* Supervisor */}
                    <Td>
                      <div
                        className="flex items-center gap-1 relative"
                        ref={supervisorEditId === b._id ? supervisorRef : undefined}
                      >
                        {b.supervisor?.name ? (
                          <>
                            <a
                              href={`tel:${b.supervisor.phone}`}
                              className={cn(
                                'text-blue-500 hover:text-blue-700 shrink-0',
                                !b.supervisor.phone && 'pointer-events-none opacity-30'
                              )}
                              title={b.supervisor.phone ? `Call ${b.supervisor.name}` : 'No phone'}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                            <span>{b.supervisor.name}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                        <button
                          onClick={() =>
                            setSupervisorEditId(supervisorEditId === b._id ? null : b._id)
                          }
                          className="ml-1 text-blue-400 hover:text-blue-600 shrink-0"
                          title="Edit supervisor"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {supervisorEditId === b._id && (
                          <div className="absolute top-6 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-56">
                            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100">
                              <Search className="h-3 w-3 text-gray-400 shrink-0" />
                              <input
                                autoFocus
                                value={staffSearch}
                                onChange={(e) => setStaffSearch(e.target.value)}
                                placeholder={b.supervisor?.name || 'Search staff…'}
                                className="flex-1 text-xs outline-none bg-transparent"
                              />
                              <button
                                onClick={() => setSupervisorEditId(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {savingSupervisor ? (
                                <div className="py-4 flex justify-center">
                                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : staffList.filter((s) =>
                                  s.name.toLowerCase().includes(staffSearch.toLowerCase())
                                ).length === 0 ? (
                                <div className="py-6 flex flex-col items-center text-gray-400 gap-1">
                                  <Inbox className="h-6 w-6 opacity-40" />
                                  <span className="text-xs">No data</span>
                                </div>
                              ) : (
                                staffList
                                  .filter((s) =>
                                    s.name.toLowerCase().includes(staffSearch.toLowerCase())
                                  )
                                  .map((s) => (
                                    <button
                                      key={s._id}
                                      onClick={() => handleSupervisorChange(b._id, s)}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-gray-700"
                                    >
                                      {s.name}
                                    </button>
                                  ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Td>
                    {/* Customer */}
                    <Td className="font-medium text-gray-700">{b.customer?.companyName || '—'}</Td>
                    {/* Branch(S) */}
                    <Td>{b.pickup?.city || '—'}</Td>
                    {/* Source */}
                    <Td>{b.pickup?.city || '—'}</Td>
                    {/* Source Code */}
                    <Td>{b.sourceCode || '—'}</Td>
                    {/* Destination */}
                    <Td>{b.drop?.city || '—'}</Td>
                    {/* Destination Code */}
                    <Td>{b.destinationCode || '—'}</Td>
                    {/* Supplier */}
                    <Td>{b.supplier || '—'}</Td>
                    {/* BOE/Booking No */}
                    <Td>{b.boeNumber || '—'}</Td>
                    {/* Job No */}
                    <Td>{b.jobNo || '—'}</Td>
                    {/* Hire Challan */}
                    <Td>{b.hireChallan || '—'}</Td>
                    {/* Branch(D) */}
                    <Td>{b.drop?.city || '—'}</Td>
                    {/* Truck */}
                    <Td className="font-medium">{b.vehicle?.vehicleNumber || '—'}</Td>
                    {/* Driver No */}
                    <Td>{b.driver?.phone || '—'}</Td>
                    {/* Location */}
                    {showLocation && (
                      <Td>
                        {b.lastKnownLocation?.coordinates
                          ? `${b.lastKnownLocation.coordinates[1].toFixed(4)}, ${b.lastKnownLocation.coordinates[0].toFixed(4)}`
                          : '—'}
                      </Td>
                    )}
                    {/* Truck Type */}
                    <Td>{b.truckTypeNeeded || '—'}</Td>
                    {/* Km */}
                    <Td>{b.actualKm ?? '—'}</Td>
                    {/* Timestamp */}
                    <Td>{fmtTs(b.updatedAt)}</Td>
                    {/* TAT(hrs) */}
                    <Td>{tatHrs}</Td>
                    {/* C Price */}
                    <Td>{b.customerPrice ?? b.expectedAmount ?? '—'}</Td>
                    {/* S Price */}
                    <Td>{b.supplierPrice ?? '—'}</Td>
                    {/* T Price */}
                    <Td>{b.advanceRequired ?? '—'}</Td>
                    {/* Created by */}
                    <Td>{b.createdByStaff?.name || '—'}</Td>
                    {showStageTats && <Td>{fmtTs(indentTs)}</Td>}
                    {showStageTats && <Td>{fmtTs(confirmedTs)}</Td>}
                    {showStageTats && <Td>{fmtTs(sinTs)}</Td>}
                    {showStageTats && <Td>{icHrs}</Td>}
                    {showStageTats && <Td>{cSinHrs}</Td>}
                    {showStageTats && <Td>{sinSoutHrs}</Td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Indent Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            {/* Close */}
            <button
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delete Trip</h2>

            <p className="text-sm text-gray-600 text-center mb-1">
              Trip, Lr and EWB will be removed
            </p>
            <p className="text-sm text-gray-600 text-center mb-5">Do you want to proceed?</p>

            <div className="relative mb-6">
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder=" "
                className="peer w-full border border-gray-300 rounded-md px-3 pt-5 pb-2 text-sm outline-none focus:border-blue-500 transition-colors"
              />
              <label className="absolute left-3 top-1 text-xs text-blue-500 pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 transition-all">
                Remarks <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleDelete}
                disabled={deleting || !remarks.trim()}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-md transition-colors"
              >
                DELETE
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LR / POD Modal */}
      {lrTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLrTarget(null)} />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col"
            style={{ maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">POD</h2>
              <button
                onClick={() => setLrTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {lrLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* LR Table */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {[
                          'LR NO',
                          'Weight',
                          'LR Remarks',
                          'LR Preview',
                          'POD',
                          'Uploaded By',
                          'Eway Bill',
                          'Delete LR',
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-700"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        {/* LR NO */}
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {lrTarget.lrDetails?.lrNumber || lrTarget.lrNumber || '—'}
                        </td>
                        {/* Weight */}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {lrTarget.weight
                            ? `${lrTarget.weight.value} ${lrTarget.weight.unit || lrTarget.weightUnit || 'Kg'}`
                            : '—'}
                        </td>
                        {/* LR Remarks */}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {lrTarget.lrDetails?.remarks || '-'}
                        </td>
                        {/* LR Preview */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {(lrTarget.lrDetails?.documents || []).length > 0 ? (
                              <>
                                {/* One icon per document with delete */}
                                {(lrTarget.lrDetails!.documents || []).map((doc, i) => (
                                  <div key={i} className="relative group">
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-600"
                                      title="View LR"
                                    >
                                      <ImageIcon className="h-5 w-5" />
                                    </a>
                                    <button
                                      onClick={() => handleDeleteDoc(doc._id)}
                                      disabled={deletingDocId === doc._id}
                                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center h-3.5 w-3.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                                      title="Remove"
                                    >
                                      {deletingDocId === doc._id ? (
                                        <div className="h-2 w-2 border border-white border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <X className="h-2 w-2" />
                                      )}
                                    </button>
                                  </div>
                                ))}
                                {/* Download icon */}
                                <button
                                  onClick={() =>
                                    handleDownload(
                                      (lrTarget.lrDetails!.documents || [])[0]?.url,
                                      `LR-${lrTarget.lrNumber || lrTarget._id}`
                                    )
                                  }
                                  className="p-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                                  title="Download LR"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                {/* Upload more — hidden when max 5 reached */}
                                {(lrTarget.lrDetails?.documents || []).length < 5 && (
                                  <button
                                    onClick={() =>
                                      openUpload(
                                        'lr',
                                        'LR',
                                        5 - (lrTarget.lrDetails?.documents || []).length
                                      )
                                    }
                                    className="p-1 border border-dashed border-blue-300 rounded text-blue-400 hover:text-blue-600 hover:border-blue-400"
                                    title="Upload LR"
                                  >
                                    <Upload className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            ) : (
                              /* No LR — upload icon + disabled download icon */
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openUpload('lr', 'LR', 5)}
                                  className="p-1 border border-dashed border-blue-300 rounded text-blue-400 hover:text-blue-600 hover:border-blue-400"
                                  title="Upload LR"
                                >
                                  <Upload className="h-4 w-4" />
                                </button>
                                {/* Download icon — disabled */}
                                <span className="p-1 border border-gray-200 rounded text-gray-300 cursor-not-allowed">
                                  <Download className="h-4 w-4" />
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        {/* POD */}
                        <td className="px-4 py-3">
                          {lrTarget.podDetails?.signatureUrl ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={lrTarget.podDetails.signatureUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-600"
                                title="Preview POD"
                              >
                                <ImageIcon className="h-5 w-5" />
                              </a>
                              <button
                                onClick={() => openUpload('pod', 'POD', 1)}
                                className="p-1 border border-dashed border-blue-300 rounded text-blue-400 hover:text-blue-600"
                                title="Upload POD"
                              >
                                <Upload className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button className="text-gray-300 cursor-default" title="No POD yet">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openUpload('pod', 'POD', 1)}
                                className="p-1 border border-dashed border-blue-300 rounded text-blue-400 hover:text-blue-600"
                                title="Upload POD"
                              >
                                <Upload className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                        {/* Uploaded By */}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {typeof lrTarget.lrDetails?.uploadedBy === 'string'
                            ? lrTarget.lrDetails.uploadedBy
                            : (lrTarget.lrDetails?.uploadedBy as any)?.name || '-'}
                        </td>
                        {/* Eway Bill */}
                        <td className="px-4 py-3 text-sm text-gray-600">-</td>
                        {/* Delete LR */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setConfirmDeleteLR(true)}
                            className="text-red-400 hover:text-red-600"
                            title="Delete LR"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Loading Memo */}
                  <div className="px-4 py-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          Loading Memo
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">Max 2 files</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(lrTarget.loadingDocuments || []).length > 0 ? (
                          lrTarget.loadingDocuments!.map((doc, i) => (
                            <div key={i} className="relative group">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-600"
                                title="View Loading Memo"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteDoc(doc._id)}
                                disabled={deletingDocId === doc._id}
                                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center h-3.5 w-3.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                                title="Remove"
                              >
                                {deletingDocId === doc._id ? (
                                  <div className="h-2 w-2 border border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <X className="h-2 w-2" />
                                )}
                              </button>
                            </div>
                          ))
                        ) : (
                          <button className="text-gray-300 cursor-default" title="No files yet">
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {(lrTarget.loadingDocuments || []).length < 2 && (
                          <button
                            onClick={() =>
                              openUpload(
                                'loading-memo',
                                'Loading Memo',
                                2 - (lrTarget.loadingDocuments || []).length
                              )
                            }
                            className="p-1 border border-dashed border-blue-300 rounded text-blue-400 hover:text-blue-600"
                            title="Upload Loading Memo"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Other Documents */}
                  <div className="px-4 py-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          Other Documents
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">Max 6 files</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(lrTarget.otherDocuments || []).length > 0 ? (
                          lrTarget.otherDocuments!.map((doc, i) => (
                            <div key={i} className="relative group">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-600"
                                title="View Document"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteDoc(doc._id)}
                                disabled={deletingDocId === doc._id}
                                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center h-3.5 w-3.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                                title="Remove"
                              >
                                {deletingDocId === doc._id ? (
                                  <div className="h-2 w-2 border border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <X className="h-2 w-2" />
                                )}
                              </button>
                            </div>
                          ))
                        ) : (
                          <button className="text-gray-300 cursor-default" title="No files yet">
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {(lrTarget.otherDocuments || []).length < 6 && (
                          <button
                            onClick={() =>
                              openUpload(
                                'other',
                                'Other Documents',
                                6 - (lrTarget.otherDocuments || []).length
                              )
                            }
                            className="p-1 border border-dashed border-blue-300 rounded text-blue-400 hover:text-blue-600"
                            title="Upload Other Documents"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete LR Confirm Dialog */}
      {confirmDeleteLR && lrTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteLR(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <button
              onClick={() => setConfirmDeleteLR(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delete LR</h2>
            <p className="text-sm text-gray-600 mb-6">
              Click Confirm to delete LR{' '}
              {lrTarget.lrDetails?.lrNumber || lrTarget.lrNumber || lrTarget.bookingId}
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleDeleteLR}
                disabled={deletingLR}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-md transition-colors"
              >
                {deletingLR ? 'Deleting…' : 'CONFIRM'}
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Images Modal */}
      {uploadModal && (
        <UploadImagesModal
          state={uploadModal}
          onClose={() => setUploadModal(null)}
          onSuccess={() => refreshLrTarget(uploadModal.bookingId)}
        />
      )}

      {/* Trip Comments Modal */}
      {commentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCommentTarget(null)} />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Trip Comments: {commentTarget.bookingId}
              </h2>
              <button
                onClick={() => setCommentTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Logs list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {logsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No logs yet</p>
              ) : (
                auditLogs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1 h-4 w-4 rounded-full border-2 border-blue-400 bg-white shrink-0" />
                    <div className="flex-1 border-b border-gray-100 pb-3">
                      <p className="text-sm font-medium text-gray-800">
                        {log.action
                          ?.replace(/_/g, ' ')
                          .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-500">{log.context?.description || '—'}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">{log.user?.name || '—'}</span>
                        <span className="text-xs text-gray-400">
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString('en-IN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitNote();
                }}
                placeholder="Enter Comments......"
                className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSubmitNote}
                disabled={submittingNote || !noteText.trim()}
                className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
