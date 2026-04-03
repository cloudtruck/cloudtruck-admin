'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DeleteRequestModalProps {
  open: boolean;
  onClose: () => void;
  resourceType: string;
  resourceId: string;
  resourceModel: string;
  resourceName: string;
  onSubmit: (data: {
    resource: string;
    resourceId: string;
    resourceModel: string;
    reason?: string;
  }) => Promise<boolean>;
}

export function DeleteRequestModal({
  open,
  onClose,
  resourceType,
  resourceId,
  resourceModel,
  resourceName,
  onSubmit,
}: DeleteRequestModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const success = await onSubmit({
      resource: resourceType,
      resourceId,
      resourceModel,
      reason: reason.trim() || undefined,
    });
    setLoading(false);
    if (success) {
      setReason('');
      onClose();
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Deletion</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Submit a deletion request for{' '}
            <span className="font-medium text-foreground">{resourceName}</span>. An admin will
            review and approve or reject this request.
          </p>

          <div className="space-y-2">
            <Label htmlFor="delete-reason">Reason (optional)</Label>
            <Textarea
              id="delete-reason"
              placeholder="Why should this be deleted?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
