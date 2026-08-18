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
  Plus,
  FileText,
  Download,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bookingApi, staffApi, vehicleApi, paymentApi } from '@/lib/api';
import { Booking, Staff } from '@/types';
import { AssignConfirmModal, type MatchedVehicle } from '@/components/bookings/AssignConfirmModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CreateBookingModal } from '@/components/bookings/CreateBookingModal';
import { ManageIndentModal } from '@/components/bookings/ManageIndentModal';

// ─── PDF helpers ─────────────────────────────────────────────────────────────

async function handleDownloadInvoice(bookingId: string, invoiceNo?: string) {
  try {
    const res = await bookingApi.downloadInvoicePdf(bookingId);
    const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceNo || bookingId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    alert('Failed to download Invoice PDF. Please try again.');
  }
}

async function handleViewInvoice(bookingId: string, invoiceNo?: string) {
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write('<p>Loading Invoice PDF...</p>');
  }
  try {
    const res = await bookingApi.downloadInvoicePdf(bookingId);
    const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    if (newWindow) {
      newWindow.location.href = url;
      // Revoke after a short delay to allow the tab to load
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else {
      window.location.href = url;
    }
  } catch {
    if (newWindow) {
      newWindow.close();
    }
    alert('Failed to view Invoice PDF. Please try again.');
  }
}

async function handleCopyInvoiceLink(bookingId: string) {
  const toastId = toast.loading('Generating link...');
  try {
    const res = await bookingApi.generateInvoice(bookingId);
    const url = res.data?.data?.url;
    if (url) {
      await navigator.clipboard.writeText(url);
      toast.success('Invoice Link copied to clipboard!', { id: toastId });
    } else {
      toast.error('Invoice URL not found', { id: toastId });
    }
  } catch {
    toast.error('Failed to copy Invoice link', { id: toastId });
  }
}

async function handleShareInvoiceWhatsApp(bookingId: string, invoiceNo?: string) {
  const toastId = toast.loading('Generating share link...');
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write('<p>Opening WhatsApp...</p>');
  }
  try {
    const res = await bookingApi.generateInvoice(bookingId);
    const url = res.data?.data?.url;
    if (url) {
      toast.dismiss(toastId);
      const text = `Hello, please find the Invoice (Inv No: ${invoiceNo || 'N/A'}) here: ${url}`;
      const encodedText = encodeURIComponent(text);
      if (newWindow) {
        newWindow.location.href = `https://wa.me/?text=${encodedText}`;
      } else {
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
      }
    } else {
      if (newWindow) {
        newWindow.close();
      }
      toast.error('Invoice URL not found', { id: toastId });
    }
  } catch {
    if (newWindow) {
      newWindow.close();
    }
    toast.error('Failed to share on WhatsApp', { id: toastId });
  }
}

function PaymentStatusBadge({ status }: { status?: string }) {
  const s = status?.toLowerCase() || 'unpaid';
  let color = 'bg-gray-100 text-gray-700';
  let label = 'Unpaid';

  if (s === 'paid') {
    color = 'bg-green-100 text-green-800 font-semibold';
    label = 'Paid';
  } else if (s === 'partial' || s === 'partially-paid') {
    color = 'bg-yellow-100 text-yellow-800 font-semibold';
    label = 'Partially Paid';
  } else if (s === 'failed') {
    color = 'bg-red-100 text-red-800 font-semibold';
    label = 'Failed';
  } else {
    color = 'bg-red-50 text-red-600 font-semibold';
    label = 'Unpaid';
  }

  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] uppercase tracking-wider', color)}>
      {label}
    </span>
  );
}

interface CreateInvoiceFromLrModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateInvoiceFromLrModal({ onClose, onSuccess }: CreateInvoiceFromLrModalProps) {
  const [step, setStep] = useState<'select-lr' | 'form'>('select-lr');
  const [loadingLrs, setLoadingLrs] = useState(false);
  const [lrs, setLrs] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLr, setSelectedLr] = useState<Booking | null>(null);

  // Form State
  const [invoiceParty, setInvoiceParty] = useState<'consignor' | 'consignee' | 'customer'>('consignor');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [customerPrice, setCustomerPrice] = useState<number>(0);
  const [poNumber, setPoNumber] = useState('');
  const [boeNumber, setBoeNumber] = useState('');
  const [jobNo, setJobNo] = useState('');
  const [shipmentNo, setShipmentNo] = useState('');
  const [containerNo, setContainerNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchLrs() {
      setLoadingLrs(true);
      try {
        const res = await bookingApi.getAll({
          bookingType: 'direct-lr',
          limit: 100
        });
        setLrs(res.data.data.bookings || []);
      } catch {
        toast.error('Failed to fetch LRs');
      } finally {
        setLoadingLrs(false);
      }
    }
    fetchLrs();
  }, []);

  const handleSelectLr = (lr: Booking) => {
    setSelectedLr(lr);
    setInvoiceParty(lr.invoiceParty || 'consignor');
    setCustomerPrice(lr.customerPrice || lr.expectedAmount || 0);
    setInvoiceNo(lr.invoiceNo || '');
    setPoNumber(lr.poNumber || '');
    setBoeNumber(lr.boeNumber || '');
    setJobNo(lr.jobNo || '');
    setShipmentNo(lr.shipmentNo || '');
    setContainerNo(lr.containerNo || '');
    setRemarks(lr.remarks || '');
    setStep('form');
  };

  const handleGenerateInvoice = async () => {
    if (!selectedLr) return;
    if (customerPrice <= 0) {
      toast.error('Please enter a valid customer price (freight value)');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Update Booking to set bookingType to direct-invoice and fill invoice details
      await bookingApi.update(selectedLr._id, {
        bookingType: 'direct-invoice',
        invoiceParty,
        customerPrice,
        invoiceNo: invoiceNo.trim() || undefined,
        poNumber: poNumber.trim() || undefined,
        boeNumber: boeNumber.trim() || undefined,
        jobNo: jobNo.trim() || undefined,
        shipmentNo: shipmentNo.trim() || undefined,
        containerNo: containerNo.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      // 2. Trigger invoice generation API
      await bookingApi.generateInvoice(selectedLr._id);

      toast.success('Invoice generated successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLrs = lrs.filter((lr) => {
    const term = searchQuery.toLowerCase();
    const idMatch = lr.bookingId?.toLowerCase().includes(term);
    const lrNumMatch = lr.lrDetails?.lrNumber?.toLowerCase().includes(term);
    const custMatch =
      typeof lr.customer === 'object' &&
      lr.customer?.companyName?.toLowerCase().includes(term);
    const pickupMatch = lr.pickup?.city?.toLowerCase().includes(term);
    const dropMatch = lr.drop?.city?.toLowerCase().includes(term);
    return idMatch || lrNumMatch || custMatch || pickupMatch || dropMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">
            {step === 'select-lr' ? 'Select LR to Create Invoice' : 'Enter Invoice Details'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select-lr' ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by LR number, Customer, Booking ID, City..."
                  className="text-xs h-8 pl-8 pr-3 border-gray-200"
                />
              </div>

              {loadingLrs ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-500">Loading LRs...</span>
                </div>
              ) : filteredLrs.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                  <p className="text-xs text-gray-500">No LRs available for invoice generation.</p>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="max-h-[40vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-[10px] sticky top-0">
                        <tr>
                          <th className="px-4 py-2 border-b border-gray-100">LR No / ID</th>
                          <th className="px-4 py-2 border-b border-gray-100">Customer</th>
                          <th className="px-4 py-2 border-b border-gray-100">Route</th>
                          <th className="px-4 py-2 border-b border-gray-100">Load Date</th>
                          <th className="px-4 py-2 border-b border-gray-100 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredLrs.map((lr) => (
                          <tr key={lr._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-gray-900">
                              <div>{lr.lrDetails?.lrNumber || '—'}</div>
                              <div className="text-[10px] text-gray-400 font-normal">ID: {lr.bookingId}</div>
                            </td>
                            <td className="px-4 py-2.5 text-gray-600 font-medium">
                              {typeof lr.customer === 'object' ? lr.customer?.companyName : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">
                              {lr.pickup?.city} ➔ {lr.drop?.city}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">
                              {lr.loadDateTime ? fmtDate(lr.loadDateTime) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <Button
                                size="sm"
                                onClick={() => handleSelectLr(lr)}
                                className="h-6 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-medium rounded"
                              >
                                Select
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            selectedLr && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100/50 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <div>
                      <span className="font-semibold text-gray-700">LR Number:</span>{' '}
                      {selectedLr.lrDetails?.lrNumber || '—'}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Customer:</span>{' '}
                      {typeof selectedLr.customer === 'object' ? selectedLr.customer?.companyName : '—'}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Route:</span>{' '}
                      {selectedLr.pickup?.city} ➔ {selectedLr.drop?.city}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Booking ID:</span> {selectedLr.bookingId}
                    </div>
                  </div>
                </div>

                {/* Bill To Party Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Bill / Invoice To Party *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Consignor */}
                    <div
                      onClick={() => setInvoiceParty('consignor')}
                      className={`relative flex flex-col p-2.5 rounded-lg border cursor-pointer transition-all ${
                        invoiceParty === 'consignor'
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-600/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${invoiceParty === 'consignor' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                          Consignor
                        </span>
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${invoiceParty === 'consignor' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                          {invoiceParty === 'consignor' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-gray-900 truncate" title={selectedLr.pickup?.contactPerson?.name || (typeof selectedLr.customer === 'object' ? selectedLr.customer?.companyName : 'Consignor')}>
                        {selectedLr.pickup?.contactPerson?.name || (typeof selectedLr.customer === 'object' ? selectedLr.customer?.companyName : 'Consignor')}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate mt-0.5">
                        {selectedLr.pickup?.contactPerson?.gstNumber ? `GST: ${selectedLr.pickup.contactPerson.gstNumber}` : ([selectedLr.pickup?.city, selectedLr.pickup?.state].filter(Boolean).join(', ') || 'Pickup Party')}
                      </div>
                    </div>

                    {/* Consignee */}
                    <div
                      onClick={() => setInvoiceParty('consignee')}
                      className={`relative flex flex-col p-2.5 rounded-lg border cursor-pointer transition-all ${
                        invoiceParty === 'consignee'
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-600/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${invoiceParty === 'consignee' ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                          Consignee
                        </span>
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${invoiceParty === 'consignee' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                          {invoiceParty === 'consignee' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-gray-900 truncate" title={selectedLr.drop?.contactPerson?.name || 'Consignee'}>
                        {selectedLr.drop?.contactPerson?.name || 'Consignee'}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate mt-0.5">
                        {selectedLr.drop?.contactPerson?.gstNumber ? `GST: ${selectedLr.drop.contactPerson.gstNumber}` : ([selectedLr.drop?.city, selectedLr.drop?.state].filter(Boolean).join(', ') || 'Drop Party')}
                      </div>
                    </div>

                    {/* Customer */}
                    <div
                      onClick={() => setInvoiceParty('customer')}
                      className={`relative flex flex-col p-2.5 rounded-lg border cursor-pointer transition-all ${
                        invoiceParty === 'customer'
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-600/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${invoiceParty === 'customer' ? 'bg-purple-600' : 'bg-gray-300'}`} />
                          Customer
                        </span>
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${invoiceParty === 'customer' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                          {invoiceParty === 'customer' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-gray-900 truncate" title={typeof selectedLr.customer === 'object' ? selectedLr.customer?.companyName : 'Customer'}>
                        {typeof selectedLr.customer === 'object' ? selectedLr.customer?.companyName : 'Customer'}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate mt-0.5">
                        {typeof selectedLr.customer === 'object' && selectedLr.customer?.gst ? `GST: ${selectedLr.customer.gst}` : 'Account'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Customer Price / Freight Value (₹) *
                    </label>
                    <Input
                      type="number"
                      value={customerPrice}
                      onChange={(e) => setCustomerPrice(Number(e.target.value))}
                      placeholder="e.g. 25000"
                      className="text-xs h-8 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Invoice Number (Optional)
                    </label>
                    <Input
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      placeholder="Auto-generated if empty"
                      className="text-xs h-8 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Purchase Order (PO) Number
                    </label>
                    <Input
                      type="text"
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="e.g. PO-789"
                      className="text-xs h-8 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Bill of Entry (BOE) Number
                    </label>
                    <Input
                      type="text"
                      value={boeNumber}
                      onChange={(e) => setBoeNumber(e.target.value)}
                      placeholder="e.g. BOE-456"
                      className="text-xs h-8 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Job Number
                    </label>
                    <Input
                      type="text"
                      value={jobNo}
                      onChange={(e) => setJobNo(e.target.value)}
                      placeholder="e.g. JOB-123"
                      className="text-xs h-8 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Shipment Number
                    </label>
                    <Input
                      type="text"
                      value={shipmentNo}
                      onChange={(e) => setShipmentNo(e.target.value)}
                      placeholder="e.g. SH-890"
                      className="text-xs h-8 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Container Number
                    </label>
                    <Input
                      type="text"
                      value={containerNo}
                      onChange={(e) => setContainerNo(e.target.value)}
                      placeholder="e.g. CO-123"
                      className="text-xs h-8 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Remarks
                    </label>
                    <Input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Freight charge including loading"
                      className="text-xs h-8 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl shrink-0">
          {step === 'form' && (
            <Button
              size="sm"
              variant="outline"
              disabled={submitting}
              onClick={() => setStep('select-lr')}
              className="h-8 text-xs font-semibold"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Back
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={submitting}
            onClick={onClose}
            className="h-8 text-xs font-semibold"
          >
            Cancel
          </Button>
          {step === 'form' && (
            <Button
              size="sm"
              disabled={submitting}
              onClick={handleGenerateInvoice}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Generate Invoice'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface RecordPaymentModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

function RecordPaymentModal({ booking, onClose, onSuccess }: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<number>(booking.customerPrice || 0);
  const [paymentMethod, setPaymentMethod] = useState<string>('online');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  async function handleRecord() {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      await paymentApi.recordManual({
        bookingId: booking._id,
        customerId: booking.customer?._id || (booking.customer as any),
        amount,
        paymentMethod,
        referenceNumber,
        remarks,
        transactionDate: new Date().toISOString()
      });
      toast.success('Payment recorded successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Record Customer Payment</h3>
        <p className="text-xs text-gray-500 mb-4">
          Invoice for <span className="font-semibold text-slate-700">{booking.customer?.companyName || 'N/A'}</span>
          <br />
          Booking ID: <span className="font-semibold">{booking.bookingId?.slice(-6).toUpperCase()}</span>
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Amount (₹)
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount"
              className="text-xs h-8 border-gray-200 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full text-xs h-8 px-2 border border-gray-200 rounded focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="online">Online</option>
              <option value="neft">NEFT</option>
              <option value="rtgs">RTGS</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Transaction Ref / UTR / Cheque No.
            </label>
            <Input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UTR12345"
              className="text-xs h-8 border-gray-200 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Remarks
            </label>
            <Input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional remarks"
              className="text-xs h-8 border-gray-200 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="h-8 text-xs font-semibold px-4 border-gray-200"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleRecord}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-semibold px-4 rounded"
          >
            {submitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(ts?: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en', { month: 'short' });
  const yr = String(d.getFullYear()).slice(2);
  return `${day}-${mon}-${yr}`;
}

function statusColor(status: string): string {
  const s = status?.toLowerCase() || '';
  if (s === 'created' || s === 'under-review') return 'bg-yellow-100 text-yellow-800';
  if (s === 'assigned' || s === 'driver-en-route' || s === 'reached-pickup')
    return 'bg-blue-100 text-blue-800';
  if (s === 'loaded' || s === 'in-transit' || s === 'reached-destination' || s === 'unloading')
    return 'bg-purple-100 text-purple-800';
  if (s === 'delivered' || s === 'pod-received' || s === 'closed')
    return 'bg-green-100 text-green-800';
  if (s === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    created: 'New',
    'under-review': 'Under Review',
    assigned: 'Assigned',
    'driver-en-route': 'Driver En Route',
    'reached-pickup': 'Reached Pickup',
    loaded: 'Loaded',
    'in-transit': 'In Transit',
    'reached-destination': 'Arrived',
    unloading: 'Unloading',
    delivered: 'Delivered',
    'pod-received': 'POD Received',
    closed: 'Closed',
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

function timeLeftStr(expiryTime?: string): string {
  if (!expiryTime) return '';
  const diff = new Date(expiryTime).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  return `${h}h`;
}

const EXPIRY_PRESETS = [24, 36, 48];

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
        await bookingApi.update(booking._id, {
          supplierPrice: Number(bidPrice),
        } as Partial<Booking>);
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
  onAssign: (vehicle: MatchedVehicle) => void;
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
        ...(booking.bodyType ? { bodyType: booking.bodyType } : {}),
        ...(booking.weight?.value
          ? {
              minCapacity:
                booking.weight.unit === 'kg' ? booking.weight.value / 1000 : booking.weight.value,
            }
          : {}),
      }),
      // Full booking for interestedDrivers + statusHistory
      bApi.getById(booking._id),
      // Unloading: trucks at destination whose dropCity matches this indent's pickupCity
      booking.pickup?.city
        ? bApi.getUnloadingTrucks({ dropCity: booking.pickup.city, limit: 50 })
        : Promise.resolve(null),
      // Placeholder to keep Promise.all arity — supplier now derived from booking.supplierEntity
      Promise.resolve(null),
    ])
      .then(([vRes, bRes, uRes]: any[]) => {
        const vehicles: any[] = vRes?.data?.data?.vehicles || [];
        setOwnVehicles(
          vehicles.filter((v: any) => v.ownershipType === 'own' && v.availability === 'available')
        );
        setMarketVehicles(
          vehicles.filter((v: any) => v.ownershipType !== 'own' && v.availability === 'available')
        );

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
  }, [
    booking._id,
    booking.truckTypeNeeded,
    booking.pickup?.city,
    booking.bodyType,
    booking.weight?.value,
    booking.weight?.unit,
  ]);

  const TABS: { key: TruckTab; label: string; count?: number; icon: React.ReactNode }[] = [
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

  function AssignBtn({ row, rowType }: { row: any; rowType: 'vehicle' | 'unloading' | 'other' }) {
    const handleClick = () => {
      let vehicle: MatchedVehicle;
      if (rowType === 'unloading') {
        // Unloading truck row: { bookingDbId, vehicle: { _id, vehicleNumber, truckType, ownerRef, supplierOwner }, driver }
        const vRef = row.vehicle?.ownerRef;
        vehicle = {
          _id: row.vehicle?._id || '',
          vehicleNumber: row.vehicle?.vehicleNumber || '',
          truckType: row.vehicle?.truckType,
          // ownerRef.item may be a populated object — normalize to plain ID string
          ownerRef: vRef ? { kind: vRef.kind, item: vRef.item?._id ?? vRef.item } : null,
          supplierOwner: row.vehicle?.supplierOwner || null,
          driver: row.driver || null,
        };
      } else {
        // Own/market vehicle row
        const vRef = row.ownerRef;
        vehicle = {
          _id: row._id || '',
          vehicleNumber: row.vehicleNumber || '',
          truckType: row.truckType,
          // ownerRef.item may be a populated object — normalize to plain ID string
          ownerRef: vRef ? { kind: vRef.kind, item: vRef.item?._id ?? vRef.item } : null,
          supplierOwner: row.supplierOwner || null,
          driver: null,
        };
      }
      onAssign(vehicle);
      onClose();
    };

    return (
      <button
        onClick={handleClick}
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
                Indent Expiry
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2.5">
                  <AssignBtn row={v} rowType="vehicle" />
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {v.ownerRef?.item?.companyName ||
                    v.ownerRef?.item?.displayName ||
                    v.ownerRef?.item?.name ||
                    v.owner?.name ||
                    '—'}
                </td>
                <td className="px-4 py-2.5 text-gray-700 font-medium">{v.vehicleNumber || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">{v.truckType || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">
                  {v.lastKnownLocation?.city || v.registrationCity || '—'}
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {timeLeftStr(booking.expiryTime) || '—'}
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
                  <AssignBtn row={row} rowType="other" />
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
                  <AssignBtn row={row} rowType="unloading" />
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

    // Own tab — Actions, Truck No, Indent Expiry
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
              Indent Expiry
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, i: number) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2.5">
                <AssignBtn row={row} rowType="vehicle" />
              </td>
              <td className="px-4 py-2.5 text-gray-700 font-medium">{row.vehicleNumber || '—'}</td>
              <td className="px-4 py-2.5 text-gray-600">
                {timeLeftStr(booking.expiryTime) || '—'}
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
                Customer: {booking.customer?.companyName || 'Indent'}
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
              {t.count != null && t.count > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  {t.count}
                </span>
              )}
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

const PAGE_SIZE = 25;

export default function IndentsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [unloadingCounts, setUnloadingCounts] = useState<Record<string, number>>({});
  const [ownCounts, setOwnCounts] = useState<Record<string, number>>({});
  const [marketCounts, setMarketCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [commentTarget, setCommentTarget] = useState<Booking | null>(null);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [bidTarget, setBidTarget] = useState<Booking | null>(null);
  const [truckModalTarget, setTruckModalTarget] = useState<{
    booking: Booking;
    tab: TruckTab;
  } | null>(null);
  const [vehicleAssignTarget, setVehicleAssignTarget] = useState<{
    booking: Booking;
    vehicle: MatchedVehicle;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createInvoiceFromLrOpen, setCreateInvoiceFromLrOpen] = useState(false);
  const [loadTypeEditId, setLoadTypeEditId] = useState<string | null>(null);
  const [savingLoadType, setSavingLoadType] = useState<string | null>(null);
  const [recordPaymentTarget, setRecordPaymentTarget] = useState<Booking | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'unpaid'>('all');

  const updateLoadType = async (id: string, value: 'FTL' | 'LTL' | 'PTL') => {
    setSavingLoadType(id);
    try {
      await bookingApi.update(id, { loadType: value });
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, loadType: value } : b)));
      toast.success('Load type updated');
    } catch {
      toast.error('Failed to update load type');
    } finally {
      setSavingLoadType(null);
      setLoadTypeEditId(null);
    }
  };

  const fetchBookings = useCallback(
    async (opts?: { page?: number; search?: string; status?: string; paymentStatus?: 'all' | 'unpaid' }) => {
      setLoading(true);
      try {
        const ALL_STATUSES_EXCEPT_CANCELLED =
          'created,under-review,assigned,driver-en-route,reached-pickup,loaded,in-transit,reached-destination,unloading,delivered,pod-received,closed';
        const status =
          opts?.status ?? ALL_STATUSES_EXCEPT_CANCELLED;

        const activePaymentStatus = opts?.paymentStatus ?? paymentStatusFilter;

        const res = await bookingApi.getAll({
          page: opts?.page ?? page,
          limit: PAGE_SIZE,
          search: (opts?.search ?? search) || undefined,
          status,
          paymentStatus: activePaymentStatus === 'unpaid' ? 'unpaid' : undefined,
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
    [page, search, paymentStatusFilter]
  );

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, paymentStatusFilter]);

  // Fetch unloading truck counts — only re-fetch when the set of pickup cities changes
  const citiesKey = [...new Set(bookings.map((b) => b.pickup?.city).filter(Boolean))]
    .sort()
    .join(',');
  useEffect(() => {
    if (!citiesKey) return;
    const uniqueCities = citiesKey.split(',');
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
      setUnloadingCounts((prev) => {
        const counts: Record<string, number> = { ...prev };
        bookings.forEach((b) => {
          if (b.pickup?.city) counts[b._id] = cityCountMap[b.pickup.city] ?? 0;
        });
        return counts;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citiesKey]);

  // Compute own/market matched truck counts — one fetch per unique truck type set
  const truckTypesKey = [...new Set(bookings.map((b) => b.truckTypeNeeded).filter(Boolean))]
    .sort()
    .join(',');
  useEffect(() => {
    if (bookings.length === 0) return;
    vehicleApi
      .getAll({ limit: 200, status: 'available' } as any)
      .then((res: any) => {
        const vehicles: any[] = res?.data?.data?.vehicles || [];
        // Build counts per booking based on matching truckType
        const own: Record<string, number> = {};
        const market: Record<string, number> = {};
        bookings.forEach((b) => {
          const matched = vehicles.filter(
            (v: any) => !b.truckTypeNeeded || v.truckType === b.truckTypeNeeded
          );
          own[b._id] = matched.filter((v: any) => v.ownershipType === 'own').length;
          market[b._id] = matched.filter((v: any) => v.ownershipType !== 'own').length;
        });
        setOwnCounts(own);
        setMarketCounts(market);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truckTypesKey, bookings.length]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchBookings({ page: 1 });
  }

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            Total Invoices: {totalItems}
          </span>
          <div className="flex items-center border border-gray-200 rounded overflow-hidden">
            <button
              onClick={() => setPaymentStatusFilter('all')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium transition-colors',
                paymentStatusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              All
            </button>
            <button
              onClick={() => setPaymentStatusFilter('unpaid')}
              className={cn(
                'px-2.5 py-1 text-[10px] font-medium transition-colors border-l border-gray-200',
                paymentStatusFilter === 'unpaid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              Unpaid
            </button>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setCreateInvoiceFromLrOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-3 text-xs font-semibold rounded"
        >
          <Plus className="h-3 w-3 mr-1" />
          Create Invoice
        </Button>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Invoices..."
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
                <Th className="w-56">Actions</Th>
                <ThSearch label="Id" />
                <Th>Lane Code</Th>
                <ThSearch label="Customer" />
                <Th>Invoice Value</Th>
                <ThSearch label="Source" />
                <ThSearch label="Destination" />
                <Th>Truck Type</Th>
                <Th>Vehicle / Driver</Th>
                <Th>Indent date</Th>
                <Th>Remarks</Th>
                <Th>Payment Status</Th>
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
                      {(() => {
                        const isTerminal = [
                          'cancelled',
                          'delivered',
                          'pod-received',
                          'closed',
                        ].includes(b.status);
                        return (
                          <button
                            aria-label="Edit"
                            onClick={isTerminal ? undefined : () => setEditTarget(b)}
                            disabled={isTerminal}
                            className={
                              isTerminal
                                ? 'text-gray-300 p-0.5 cursor-not-allowed'
                                : 'text-blue-400 hover:text-blue-600 p-0.5'
                            }
                            title={isTerminal ? 'Cannot edit in current status' : 'Manage Invoice'}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        );
                      })()}
                      <button
                        aria-label="Comments"
                        onClick={() => setCommentTarget(b)}
                        className="text-blue-400 hover:text-blue-600 p-0.5"
                        title="Notes & activity"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                      {/* View Invoice PDF */}
                      <button
                        aria-label="View Invoice"
                        onClick={() => handleViewInvoice(b._id, b.invoiceNo)}
                        className="text-emerald-500 hover:text-emerald-700 p-0.5"
                        title="View Invoice PDF"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                      {/* Download Invoice PDF */}
                      <button
                        aria-label="Download Invoice"
                        onClick={() => handleDownloadInvoice(b._id, b.invoiceNo)}
                        className="text-violet-500 hover:text-violet-700 p-0.5"
                        title="Download Invoice PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {/* Copy Link */}
                      <button
                        aria-label="Copy Link"
                        onClick={() => handleCopyInvoiceLink(b._id)}
                        className="text-slate-500 hover:text-slate-700 p-0.5"
                        title="Copy Invoice PDF Link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {/* Share via WhatsApp */}
                      <button
                        aria-label="WhatsApp Share"
                        onClick={() => handleShareInvoiceWhatsApp(b._id, b.invoiceNo)}
                        className="text-green-500 hover:text-green-700 p-0.5"
                        title="Share Invoice on WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.012 14.116.993 11.997.993c-5.442 0-9.87 4.372-9.874 9.802-.002 1.942.508 3.842 1.482 5.513L2.617 21.6l5.228-1.369-.198-.122zM17.96 15.3c-.327-.164-1.938-.957-2.238-1.067-.3-.11-.518-.164-.737.164-.218.327-.847 1.066-1.038 1.285-.19.219-.383.245-.71.082-.327-.164-1.38-.508-2.63-1.623-.972-.867-1.629-1.938-1.82-2.265-.19-.327-.02-.504.143-.667.147-.146.327-.382.49-.573.164-.19.219-.327.328-.546.11-.219.055-.41-.028-.573-.082-.164-.737-1.776-1.01-2.432-.266-.641-.53-.553-.728-.563-.19-.01-.41-.01-.628-.01a1.2 1.2 0 00-.874.41c-.3.327-1.147 1.12-1.147 2.731 0 1.612 1.173 3.167 1.336 3.385.164.219 2.31 3.527 5.596 4.945.782.338 1.39.54 1.865.69.787.25 1.503.214 2.07.129.63-.095 1.938-.792 2.21-.1.558-.273.818-1.309.818-1.336 0-.027-.08-.164-.408-.327z"/>
                        </svg>
                      </button>
                      {/* Record Payment */}
                      {b.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => setRecordPaymentTarget(b)}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
                          title="Record Payment"
                        >
                          Record Pay
                        </button>
                      )}
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

                  {/* Lane Code */}
                  <Td>{b.laneCode || '—'}</Td>

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

                  {/* Invoice Value */}
                  <Td className="font-semibold text-gray-900">
                    {b.customerPrice ? `₹${b.customerPrice.toLocaleString('en-IN')}` : '—'}
                  </Td>

                  {/* Source */}
                  <Td>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500 shrink-0" />
                      {b.pickup?.city || '—'}
                    </span>
                  </Td>

                  {/* Destination */}
                  <Td>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                      {b.drop?.city || '—'}
                    </span>
                  </Td>

                  {/* Truck Type */}
                  <Td>{b.truckTypeNeeded || '—'}</Td>

                  {/* Vehicle / Driver */}
                  <Td>
                    {b.vehicle || b.driver ? (
                      <div>
                        <p className="font-semibold text-gray-800">{b.vehicle?.vehicleNumber || '—'}</p>
                        <p className="text-[10px] text-gray-500">{b.driver?.name || '—'}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </Td>

                  {/* Indent date */}
                  <Td>{fmtDate(b.createdAt)}</Td>

                  {/* Remarks */}
                  <Td className="max-w-[120px] truncate" title={b.remarks}>
                    {b.remarks || '—'}
                  </Td>

                  {/* Payment Status */}
                  <Td>
                    <PaymentStatusBadge status={b.paymentStatus} />
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

      {deleteTarget && (
        <DeleteModal
          booking={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => fetchBookings()}
        />
      )}

      {recordPaymentTarget && (
        <RecordPaymentModal
          booking={recordPaymentTarget}
          onClose={() => setRecordPaymentTarget(null)}
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
          onAssign={(vehicle) => {
            setVehicleAssignTarget({ booking: truckModalTarget!.booking, vehicle });
            setTruckModalTarget(null);
          }}
        />
      )}

      {vehicleAssignTarget && (
        <AssignConfirmModal
          isOpen={!!vehicleAssignTarget}
          indent={vehicleAssignTarget.booking}
          vehicle={vehicleAssignTarget.vehicle}
          onClose={() => setVehicleAssignTarget(null)}
          onAssigned={() => {
            setVehicleAssignTarget(null);
            fetchBookings();
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

      {createInvoiceFromLrOpen && (
        <CreateInvoiceFromLrModal
          onClose={() => setCreateInvoiceFromLrOpen(false)}
          onSuccess={() => fetchBookings()}
        />
      )}
    </div>
  );
}
