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
import { useSuppliers } from '@/hooks/useSuppliers';
import type { Supplier } from '@/types';

interface SupplierActionsProps {
  supplier: Supplier;
  onSuccess: () => void;
}

type DialogType = 'verify' | 'reject' | 'blacklist' | 'unblacklist' | null;

export function SupplierActions({ supplier, onSuccess }: SupplierActionsProps) {
  const [loading, setLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<DialogType>(null);
  const [reason, setReason] = useState('');

  const { verifySupplier, rejectSupplier, blacklistSupplier, removeFromBlacklist } = useSuppliers();

  const handleAction = async (action: () => Promise<boolean>) => {
    setLoading(true);
    const ok = await action();
    setLoading(false);
    if (ok) {
      setActionDialog(null);
      setReason('');
      onSuccess();
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

          {supplier.verificationStatus !== 'verified' && !supplier.isBlacklisted && (
            <>
              <DropdownMenuItem onClick={() => setActionDialog('verify')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Supplier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActionDialog('reject')}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Supplier
              </DropdownMenuItem>
            </>
          )}

          {!supplier.isBlacklisted && (
            <DropdownMenuItem onClick={() => setActionDialog('blacklist')}>
              <Ban className="mr-2 h-4 w-4" />
              Blacklist Supplier
            </DropdownMenuItem>
          )}

          {supplier.isBlacklisted && (
            <DropdownMenuItem onClick={() => setActionDialog('unblacklist')}>
              <Unlock className="mr-2 h-4 w-4" />
              Remove from Blacklist
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Verify */}
      <AlertDialog
        open={actionDialog === 'verify'}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify {supplier.displayName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction(() => verifySupplier(supplier._id))}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject */}
      <AlertDialog
        open={actionDialog === 'reject'}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting {supplier.displayName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Enter rejection reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction(() => rejectSupplier(supplier._id, reason))}
              disabled={loading || reason.trim().length < 10}
            >
              {loading ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blacklist */}
      <AlertDialog
        open={actionDialog === 'blacklist'}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blacklist Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for blacklisting {supplier.displayName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="blacklist-reason">Reason</Label>
            <Textarea
              id="blacklist-reason"
              placeholder="Enter blacklisting reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction(() => blacklistSupplier(supplier._id, reason))}
              disabled={loading || reason.trim().length < 10}
            >
              {loading ? 'Blacklisting...' : 'Blacklist'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove from blacklist */}
      <AlertDialog
        open={actionDialog === 'unblacklist'}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Blacklist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {supplier.displayName} from the blacklist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction(() => removeFromBlacklist(supplier._id))}
              disabled={loading}
            >
              {loading ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
