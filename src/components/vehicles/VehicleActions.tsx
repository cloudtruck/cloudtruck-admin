'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { MoreVertical, CheckCircle, Pencil, XCircle } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { vehicleApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Vehicle } from '@/types';
import { EditVehicleModal } from './EditVehicleModal';

interface VehicleActionsProps {
  vehicle: Vehicle;
  onSuccessAction?: () => void;
}

export function VehicleActions({ vehicle, onSuccessAction }: VehicleActionsProps) {
  const [loading, setLoading] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reason, setReason] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    try {
      await vehicleApi.verify(vehicle._id);
      toast.success('Vehicle approved successfully');
      onSuccessAction?.();
      setApproveDialogOpen(false);
    } catch (error: unknown) {
      logger.error('Failed to approve vehicle:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to approve vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (reason.trim().length < 5) {
      toast.error('Please provide a reason with at least 5 characters');
      return;
    }

    setLoading(true);
    try {
      await vehicleApi.reject(vehicle._id, { reason });
      toast.success('Vehicle rejected');
      onSuccessAction?.();
      setRejectDialogOpen(false);
      setReason('');
    } catch (error: unknown) {
      logger.error('Failed to reject vehicle:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to reject vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {!vehicle.isVerified && (
            <>
              <DropdownMenuItem onClick={() => setApproveDialogOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Vehicle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRejectDialogOpen(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Vehicle
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditVehicleModal
        vehicle={vehicle}
        isOpen={isEditModalOpen}
        onCloseAction={() => setIsEditModalOpen(false)}
        onSuccessAction={onSuccessAction || (() => {})}
      />

      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this vehicle? This will mark the vehicle as verified
              and allow it to be used for bookings.
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

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this vehicle.
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
            <AlertDialogAction
              onClick={handleReject}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
