'use client';

import { useState } from 'react';
import { MoreVertical, CheckCircle } from 'lucide-react';
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
import { vehicleApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Vehicle } from '@/types';

interface VehicleActionsProps {
  vehicle: Vehicle;
  onSuccessAction?: () => void;
}

export function VehicleActions({ vehicle, onSuccessAction }: VehicleActionsProps) {
  const [loading, setLoading] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await vehicleApi.verify(vehicle._id);
      toast.success('Vehicle approved successfully');
      onSuccessAction?.();
      setApproveDialogOpen(false);
    } catch (error: unknown) {
      console.error('Failed to approve vehicle:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to approve vehicle');
    } finally {
      setLoading(false);
    }
  };

  if (vehicle.isVerified) {
    return null; // No actions needed for already verified vehicles
  }

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
          <DropdownMenuItem onClick={() => setApproveDialogOpen(true)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Vehicle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this vehicle? This will mark the vehicle as verified and allow it to be used for bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={loading}>
              {loading ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}