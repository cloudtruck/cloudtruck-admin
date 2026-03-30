'use client';

import { useState } from 'react';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDeleteRequests } from '@/hooks/useDeleteRequests';
import type { DeleteRequest } from '@/types';

const RESOURCE_LABELS: Record<string, string> = {
  driver: 'Driver',
  vehicle: 'Vehicle',
  customer: 'Customer',
  staff: 'Staff',
  branch: 'Branch',
  supplier: 'Supplier',
  'master-data': 'Master Data',
  account: 'Account',
  route: 'Route',
  document: 'Document',
};

function getSnapshotLabel(request: DeleteRequest): string {
  const snap = request.resourceSnapshot as Record<string, unknown>;
  return (
    (snap?.displayName as string) ||
    (snap?.name as string) ||
    (snap?.title as string) ||
    (snap?.branchName as string) ||
    (snap?.accountName as string) ||
    String(request.resourceId).slice(-6)
  );
}

function getRequesterName(request: DeleteRequest): string {
  if (typeof request.requestedBy === 'object' && request.requestedBy !== null) {
    return request.requestedBy.name || request.requestedBy.email || 'Unknown';
  }
  return 'Unknown';
}

export function DeleteRequestQueue() {
  const { items, loading, approve, reject } = useDeleteRequests({ status: 'pending' });
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    await approve(id);
    setActionLoading(null);
  };

  const handleRejectSubmit = async () => {
    if (!rejectingId) return;
    setActionLoading(rejectingId);
    await reject(rejectingId, rejectionReason);
    setRejectingId(null);
    setRejectionReason('');
    setActionLoading(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Deletion Requests
            {items.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {items.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No pending deletion requests</p>
          ) : (
            <div className="space-y-3">
              {items.map((request) => (
                <div
                  key={request._id}
                  className="flex items-start justify-between p-3 border rounded-md bg-amber-50 border-amber-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-normal">
                        {RESOURCE_LABELS[request.resource] || request.resource}
                      </Badge>
                      <span className="text-sm font-medium truncate">
                        {getSnapshotLabel(request)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Requested by <span className="font-medium">{getRequesterName(request)}</span>
                      {' · '}
                      {new Date(request.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    {request.reason && (
                      <p className="text-xs text-gray-600 mt-0.5 italic">&ldquo;{request.reason}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => handleApprove(request._id)}
                      disabled={actionLoading === request._id}
                    >
                      {actionLoading === request._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      <span className="ml-1 text-xs">Approve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-red-700 border-red-300 hover:bg-red-50"
                      onClick={() => setRejectingId(request._id)}
                      disabled={actionLoading === request._id}
                    >
                      <X className="h-3 w-3" />
                      <span className="ml-1 text-xs">Reject</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => { if (!open) { setRejectingId(null); setRejectionReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Deletion Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="rejectionReason" className="text-sm">
              Reason for rejection <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              id="rejectionReason"
              placeholder="Explain why this deletion is not approved..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={actionLoading === rejectingId}
            >
              {actionLoading === rejectingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
