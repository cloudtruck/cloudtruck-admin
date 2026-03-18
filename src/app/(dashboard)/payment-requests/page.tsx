'use client';

import { useEffect, useState } from 'react';
import { bookingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PaymentRequest {
  _id: string;
  bookingId: string;
  booking?: { bookingId?: string; customer?: { companyName?: string } };
  amount: number;
  currency?: string;
  type: string;
  status: 'pending' | 'paid' | 'rejected';
  requestedBy?: { name?: string };
  remarks?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function PaymentRequestsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await bookingApi.getAllPaymentRequests(params);
      const data = res.data.data as any;
      setRequests(data?.items ?? data?.requests ?? data ?? []);
    } catch {
      toast.error('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const processRequest = async (req: PaymentRequest, action: 'pay' | 'reject') => {
    setProcessing(req._id + action);
    try {
      await bookingApi.processPaymentRequest(req.bookingId, req._id, action);
      toast.success(action === 'pay' ? 'Payment approved' : 'Request rejected');
      fetchRequests();
    } catch {
      toast.error('Action failed');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and process driver/vendor payment requests
        </p>
      </div>

      {/* Status filters */}
      <div className="flex gap-2">
        {(['', 'pending', 'paid', 'rejected'] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  No payment requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req._id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm text-gray-600">
                    {req.booking?.bookingId || req.bookingId?.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {req.booking?.customer?.companyName || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 capitalize">
                    {req.type?.replace(/_/g, ' ') || '—'}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-gray-900">
                    ₹{req.amount?.toLocaleString('en-IN') ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {req.requestedBy?.name || '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {req.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell>
                    {req.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={!!processing}
                          onClick={() => processRequest(req, 'pay')}
                        >
                          {processing === req._id + 'pay' ? '...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled={!!processing}
                          onClick={() => processRequest(req, 'reject')}
                        >
                          {processing === req._id + 'reject' ? '...' : 'Reject'}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
