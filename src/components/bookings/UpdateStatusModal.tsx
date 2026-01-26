'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { bookingApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Booking } from '@/types';
import { Loader2 } from 'lucide-react';
import { BOOKING_STATUSES } from '@/lib/constants';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onSuccess: () => void;
}

export function UpdateStatusModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: UpdateStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>(booking.status);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus(booking.status);
      setNotes('');
    }
  }, [isOpen, booking.status]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await bookingApi.updateStatus(booking._id, {
        status,
        notes,
      });
      toast.success('Booking status updated successfully');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to update status:', err);
      const error = err as { response?: { data?: { errors?: Array<{ message?: string }>; message?: string } } };
      const errorMessage = error.response?.data?.errors?.[0]?.message || 
                           error.response?.data?.message || 
                           'Failed to update status';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Booking Status</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading || status === booking.status}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
