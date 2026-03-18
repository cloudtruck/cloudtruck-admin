'use client';

import { useState, useEffect } from 'react';
import { customerApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Customer } from '@/types';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Plus, ArrowDownToLine } from 'lucide-react';

const CUSTOMER_TYPES = ['Shipper', 'Consignee', 'Both'];

// ─── CSV helpers ─────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  'ID',
  'Name',
  'Contact Person',
  'Phone',
  'City',
  'GSTIN',
  'Company Type',
  'PAN',
  'Type',
  'Payment Terms',
  'Total Bookings',
  'KYC Status',
];

function toCSVRow(c: Customer): string {
  const escape = (v: string | number | undefined) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    c.customerCode || c._id.slice(-6).toUpperCase(),
    c.companyName,
    c.contactPerson?.name ?? '',
    c.contactPerson?.phone ?? '',
    c.address?.city ?? '',
    c.gstNumber ?? '',
    c.companyType ?? '',
    c.pan ?? '',
    c.customerType ?? '',
    c.paymentTerms ?? '',
    c.totalBookings ?? 0,
    c.kycStatus,
  ]
    .map(escape)
    .join(',');
}

function downloadCSV(rows: Customer[]) {
  const csv = [CSV_HEADERS.join(','), ...rows.map(toCSVRow)].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  mobile: '',
  email: '',
  city: '',
  gstin: '',
  pan: '',
  company: '',
  type: '',
  paymentTerms: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Download modal
  const [showDownload, setShowDownload] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Add Customer modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    mobile: '',
    email: '',
    city: '',
    gstin: '',
    pan: '',
    company: '',
    type: '',
    paymentTerms: '',
  });

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerApi.getAll({
        page: pagination.currentPage,
        limit: 20,
      });
      const data = response.data.data as any;
      setCustomers(data.customers ?? data.items ?? []);
      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          totalPages: data.pagination.pages ?? data.pagination.totalPages ?? 1,
          totalItems: data.pagination.total ?? data.pagination.totalItems ?? 0,
        }));
      }
    } catch {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    try {
      await customerApi.update(id, { [field]: value } as any);
      setCustomers((prev) => prev.map((c) => (c._id === id ? { ...c, [field]: value } : c)));
      toast.success('Updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await (customerApi as any).delete?.(id);
      setCustomers((prev) => prev.filter((c) => c._id !== id));
      toast.success('Customer deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await customerApi.approve(id);
      toast.success('Customer approved');
      fetchCustomers();
    } catch {
      toast.error('Approve failed');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await customerApi.reject(id, { reason: 'Rejected by admin' });
      toast.success('Customer rejected');
      fetchCustomers();
    } catch {
      toast.error('Reject failed');
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Fetch all records (high limit) so the CSV is complete regardless of current page
      const response = await customerApi.getAll({ limit: 10000, page: 1 });
      const data = response.data.data as any;
      const all: Customer[] = data.customers ?? data.items ?? [];
      downloadCSV(all);
      setShowDownload(false);
      toast.success(`Downloaded ${all.length} records`);
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!form.name || !form.mobile) {
      toast.error('Name and Mobile are required');
      return;
    }
    setSubmitting(true);
    try {
      const created = await customerApi.create({
        companyName: form.name,
        phone: form.mobile,
        email: form.email || undefined,
        contactPerson: form.contactPerson || undefined,
        city: form.city || undefined,
        pan: form.pan || undefined,
        gstNumber: form.gstin || undefined,
        companyType: form.company || undefined,
        customerType: form.type || undefined,
        paymentTerms: (form.paymentTerms as any) || undefined,
      });
      // Optimistically prepend the new customer so the list updates immediately
      const newCustomer = created.data.data as Customer;
      setCustomers((prev) => [newCustomer, ...prev]);
      setPagination((prev) => ({ ...prev, totalItems: prev.totalItems + 1 }));
      toast.success('Customer added');
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-blue-600">Customers</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-blue-500 hover:bg-blue-600 text-white border-none"
            title="Download"
            onClick={() => setShowDownload(true)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Table */}
      <CustomerTable
        customers={customers}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, currentPage: page }))}
        onInlineUpdate={handleInlineUpdate}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Excel Download Modal */}
      <Dialog open={showDownload} onOpenChange={setShowDownload}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excel Download</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-700">
              Total Record : <span className="font-medium">{pagination.totalItems}</span>
            </p>
            <div className="flex items-center justify-between border rounded px-4 py-3">
              <span className="text-sm text-gray-700">1 – {pagination.totalItems}</span>
              <button
                onClick={handleDownload}
                disabled={downloading || pagination.totalItems === 0}
                className="text-green-600 hover:text-green-700 disabled:opacity-40"
                title="Download CSV"
              >
                <ArrowDownToLine className="h-5 w-5" />
              </button>
            </div>
            {downloading && (
              <p className="text-xs text-gray-400 text-center">Preparing download…</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setForm(EMPTY_FORM);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Name → companyName */}
            <Input
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {/* Contact Person + Mobile → contactPerson.name + phone */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Contact Person"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />
              <Input
                placeholder="Mobile *"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </div>
            {/* Email → user account email */}
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {/* City → address.city */}
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            {/* GSTIN */}
            <Input
              placeholder="GSTIN"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
            />
            {/* Company + PAN */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              <Input
                placeholder="PAN"
                value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
              />
            </div>
            {/* Type + Payment Terms */}
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.paymentTerms}
                onValueChange={(val) => setForm({ ...form, paymentTerms: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Prepaid</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="cod">Postpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-black hover:bg-gray-900 text-white uppercase tracking-wide"
              onClick={handleAddCustomer}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
