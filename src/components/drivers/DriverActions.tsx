'use client';

import { useState } from 'react';
import { MoreVertical, CheckCircle, XCircle, Ban, Unlock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { driverApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Driver } from '@/types';

interface DriverActionsProps {
  driver: Driver;
  onSuccess: () => void;
}

export function DriverActions({ driver, onSuccess }: DriverActionsProps) {
  const [loading, setLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'block' | 'unblock' | null>(null);
  const [reason, setReason] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    try {
      await driverApi.approve(driver._id);
      toast.success('Driver approved successfully');
      onSuccess();
      setActionDialog(null);
    } catch (error: unknown) {
      console.error('Failed to approve driver:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to approve driver');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await driverApi.reject(driver._id, { reason });
      toast.success('Driver rejected');
      onSuccess();
      setActionDialog(null);
      setReason('');
    } catch (error: unknown) {
      console.error('Failed to reject driver:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to reject driver');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for blocking');
      return;
    }

    setLoading(true);
    try {
      await driverApi.block(driver._id, { reason });
      toast.success('Driver blocked');
      onSuccess();
      setActionDialog(null);
      setReason('');
    } catch (error: unknown) {
      console.error('Failed to block driver:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to block driver');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      await driverApi.unblock(driver._id);
      toast.success('Driver unblocked');
      onSuccess();
      setActionDialog(null);
    } catch (error: unknown) {
      console.error('Failed to unblock driver:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to unblock driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {!driver.isVerified && (
            <>
              <DropdownMenuItem onClick={() => setActionDialog('approve')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Driver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActionDialog('reject')}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Driver
              </DropdownMenuItem>
            </>
          )}
          
          {!driver.isBlacklisted && driver.isVerified && (
            <DropdownMenuItem onClick={() => setActionDialog('block')}>
              <Ban className="mr-2 h-4 w-4" />
              Block Driver
            </DropdownMenuItem>
          )}
          
          {driver.status === 'blocked' && (
            <DropdownMenuItem onClick={() => setActionDialog('unblock')}>
              <Unlock className="mr-2 h-4 w-4" />
              Unblock Driver
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={actionDialog === 'approve'} onOpenChange={(open) => !open && setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {driver.name}? They will be able to accept trips.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={loading}>
              {loading ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'reject'} onOpenChange={(open) => !open && setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting {driver.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Enter rejection reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={loading}>
              {loading ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'block'} onOpenChange={(open) => !open && setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for blocking {driver.name}. They will not be able to accept trips.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="block-reason">Reason</Label>
            <Textarea
              id="block-reason"
              placeholder="Enter blocking reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} disabled={loading}>
              {loading ? 'Blocking...' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'unblock'} onOpenChange={(open) => !open && setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock {driver.name}? They will be able to accept trips again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock} disabled={loading}>
              {loading ? 'Unblocking...' : 'Unblock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
