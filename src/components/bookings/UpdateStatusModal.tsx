'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { bookingApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Booking } from '@/types';
import { Loader2 } from 'lucide-react';
import { NEXT_BOOKING_STATUS } from '@/lib/constants';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onSuccess: () => void;
}

export function UpdateStatusModal({ isOpen, onClose, booking, onSuccess }: UpdateStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const nextStatus = NEXT_BOOKING_STATUS[booking.status];

  useEffect(() => {
    if (isOpen) {
      setNotes('');
    }
  }, [isOpen]);

  const handleUpdate = async () => {
    if (!nextStatus) return;
    try {
      setLoading(true);
      await bookingApi.updateStatus(booking._id, {
        status: nextStatus.value,
        notes,
      });
      toast.success('Booking status updated successfully');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      logger.error('Failed to update status:', err);
      const error = err as {
        response?: { data?: { errors?: Array<{ message?: string }>; message?: string } };
      };
      const errorMessage =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        'Failed to update status';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isUnderReview = booking.status === 'under-review';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Booking Status</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isUnderReview ? (
            <p className="text-sm text-muted-foreground">
              This booking is under review. Please assign a driver first before advancing the
              status.
            </p>
          ) : nextStatus ? (
            <>
              <div className="space-y-2">
                <Label>Next Status</Label>
                <div className="px-3 py-2 rounded-md border bg-muted text-sm font-medium">
                  {nextStatus.label}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Status Update Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Reason for status change or additional details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No further status updates are available for this booking.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {nextStatus && !isUnderReview && (
            <Button onClick={handleUpdate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
