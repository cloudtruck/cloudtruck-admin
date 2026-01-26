'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { bookingApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Booking } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onSuccess: () => void;
}

export function CancelBookingModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: CancelBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleCancel = async () => {
    if (reason.trim().length < 5) {
      toast.error('Please provide a reason with at least 5 characters');
      return;
    }

    try {
      setLoading(true);
      await bookingApi.cancel(booking._id, { reason });
      toast.success('Booking cancelled successfully');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to cancel booking:', err);
      const error = err as { response?: { data?: { errors?: Array<{ message?: string }>; message?: string } } };
      const errorMessage = error.response?.data?.errors?.[0]?.message || 
                           error.response?.data?.message || 
                           'Failed to cancel booking';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel booking <strong>{booking.bookingId}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Cancellation</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for cancelling this booking..."
              className="min-h-[100px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            No, Keep Booking
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel} 
            disabled={loading || !reason.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Cancel Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
