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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { bookingApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Booking } from '@/types';
import { Loader2 } from 'lucide-react';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onSuccess: () => void;
}

export function AddNoteModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: AddNoteModalProps) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const handleAddNote = async () => {
    if (!note.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      setLoading(true);
      await bookingApi.addNote(booking._id, { note });
      toast.success('Note added successfully');
      setNote('');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to add note:', error);
      const errorMessage = error.response?.data?.errors?.[0]?.message || 
                           error.response?.data?.message || 
                           'Failed to add note';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Internal Note</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">Note Content</Label>
            <Textarea
              id="note"
              placeholder="Enter internal note for this booking..."
              className="min-h-[120px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This note will only be visible to staff members.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAddNote} disabled={loading || !note.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
