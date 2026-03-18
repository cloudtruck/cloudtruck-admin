'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { bookingApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Pagination } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────
interface PaymentRequest {
  _id: string;
  requestId: string;
  bookingId: string;
  bookingObjectId: string;
  amount: number;
  note?: string;
  status: 'pending' | 'paid' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  utrNumber?: string;
  driver?: { name: string; phone: string; _id: string };
}

const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending:  { label: 'Pending',  variant: 'secondary' },
    paid:     { label: 'Paid',     variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
  };
  const { label, variant } = map[status] || { label: status, variant: 'outline' };
  return <Badge variant={variant}>{label}</Badge>;
}

function RequestsTable({
  requests,
  showActions,
  onApprove,
  onReject,
}: {
  requests: PaymentRequest[];
  showActions: boolean;
  onApprove: (req: PaymentRequest) => void;
  onReject: (req: PaymentRequest) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No payment requests found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Driver</th>
            <th className="text-left px-4 py-3 font-medium">Booking ID</th>
            <th className="text-left px-4 py-3 font-medium">Amount</th>
            <th className="text-left px-4 py-3 font-medium">Note</th>
            <th className="text-left px-4 py-3 font-medium">Requested</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            {!showActions && <th className="text-left px-4 py-3 font-medium">UTR / Reason</th>}
            {showActions && <th className="text-left px-4 py-3 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {requests.map((req) => (
            <tr key={req._id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium">{req.driver?.name || '—'}</div>
                <div className="text-xs text-muted-foreground">{req.driver?.phone || ''}</div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {req.bookingId || '—'}
              </td>
              <td className="px-4 py-3 font-semibold">{fmt(req.amount)}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">
                {req.note || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {fmtDate(req.requestedAt)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={req.status} />
              </td>
              {!showActions && (
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                  {req.utrNumber || req.rejectionReason || '—'}
                </td>
              )}
              {showActions && (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onApprove(req)}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Pay
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onReject(req)}>
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Paginator({ pagination, onChange }: { pagination: Pagination; onChange: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-4">
      <Button variant="outline" size="sm" disabled={pagination.currentPage === 1} onClick={() => onChange(pagination.currentPage - 1)}>Previous</Button>
      <span className="flex items-center px-3 text-sm text-muted-foreground">
        Page {pagination.currentPage} of {pagination.totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={pagination.currentPage === pagination.totalPages} onClick={() => onChange(pagination.currentPage + 1)}>Next</Button>
    </div>
  );
}

function usePaymentRequests(status?: string) {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 });

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (status) params.status = status;
      const res = await bookingApi.getAllPaymentRequests(params);
      setRequests((res.data.data.requests as PaymentRequest[]) || []);
      setPagination(res.data.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 });
    } catch {
      toast.error('Failed to fetch payment requests');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => { fetch(1); }, [fetch]);

  return { requests, loading, pagination, refetch: fetch, setPage: (p: number) => fetch(p) };
}

export default function PayoutsPage() {
  const pending   = usePaymentRequests('pending');
  const allReqs   = usePaymentRequests(); // all

  const [approveTarget, setApproveTarget] = useState<PaymentRequest | null>(null);
  const [rejectTarget,  setRejectTarget]  = useState<PaymentRequest | null>(null);
  const [utrNumber,     setUtrNumber]     = useState('');
  const [rejectReason,  setRejectReason]  = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await bookingApi.processPaymentRequest(
        approveTarget.bookingObjectId,
        approveTarget._id,
        'pay',
        { utrNumber: utrNumber || undefined }
      );
      toast.success('Payment marked as paid and credited to driver wallet');
      setApproveTarget(null);
      setUtrNumber('');
      pending.refetch(1);
      allReqs.refetch(1);
    } catch {
      toast.error('Failed to approve payment request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      await bookingApi.processPaymentRequest(
        rejectTarget.bookingObjectId,
        rejectTarget._id,
        'reject',
        { rejectionReason: rejectReason }
      );
      toast.success('Payment request rejected');
      setRejectTarget(null);
      setRejectReason('');
      pending.refetch(1);
      allReqs.refetch(1);
    } catch {
      toast.error('Failed to reject payment request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Requests"
        description="Driver payment requests for completed trips"
        actions={
          <Button variant="outline" size="sm" onClick={() => { pending.refetch(1); allReqs.refetch(1); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pending.pagination.totalItems > 0 && (
              <Badge variant="secondary" className="ml-1">{pending.pagination.totalItems}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {pending.loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <RequestsTable
                requests={pending.requests}
                showActions
                onApprove={(req) => { setApproveTarget(req); setUtrNumber(''); }}
                onReject={(req) => { setRejectTarget(req); setRejectReason(''); }}
              />
              <Paginator pagination={pending.pagination} onChange={pending.setPage} />
            </>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-4">
          {allReqs.loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <RequestsTable
                requests={allReqs.requests}
                showActions={false}
                onApprove={() => {}}
                onReject={() => {}}
              />
              <Paginator pagination={allReqs.pagination} onChange={allReqs.setPage} />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <AlertDialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Paid</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm payment of {fmt(approveTarget?.amount || 0)} to{' '}
              <strong>{approveTarget?.driver?.name}</strong>. Enter UTR/reference number after transferring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="UTR / Reference number (optional)"
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? 'Processing…' : 'Confirm Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Payment Request</AlertDialogTitle>
            <AlertDialogDescription>
              Reject {fmt(rejectTarget?.amount || 0)} request from{' '}
              <strong>{rejectTarget?.driver?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection (required)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading ? 'Processing…' : 'Confirm Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
