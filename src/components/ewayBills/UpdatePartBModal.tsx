'use client';

import { useState } from 'react';
import { useEwayBillStore } from '@/store/ewayBillStore';
import { ewayBillApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PartBUpdateReason } from '@/types';

interface UpdatePartBModalProps {
  onSuccessAction: () => void;
}

export default function UpdatePartBModal({ onSuccessAction }: UpdatePartBModalProps) {
  const { user } = useAuth();
  const { updateModalOpen, closeUpdateModal, selectedBill, updateEwayBill } = useEwayBillStore();

  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [reason, setReason] = useState<PartBUpdateReason>(PartBUpdateReason.VehicleBreakdown);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const canUpdatePartB = user?.role === 'admin' || user?.role === 'super-admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newVehicleNumber) {
      toast.error('Please enter new vehicle number');
      return;
    }

    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    if (notes.length > 500) {
      toast.error('Notes cannot exceed 500 characters');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedBill) return;

    setLoading(true);

    try {
      const response = await ewayBillApi.updatePartB(selectedBill._id, {
        vehicleNumber: newVehicleNumber.toUpperCase(),
        reason,
        notes,
      });

      if (response.data.success) {
        updateEwayBill(selectedBill._id, response.data.data);
        toast.success('Part-B updated successfully');
        handleClose();
        onSuccessAction();
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || 'Failed to update Part-B';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleClose = () => {
    setNewVehicleNumber('');
    setReason(PartBUpdateReason.VehicleBreakdown);
    setNotes('');
    setShowConfirmation(false);
    closeUpdateModal();
  };

  if (!canUpdatePartB) {
    return (
      <Dialog open={updateModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Permission Required</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Only Account department can update Part-B vehicle details.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={updateModalOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Part-B Vehicle Details</DialogTitle>
            <DialogDescription>
              Update the vehicle number for E-way Bill: {selectedBill?.ewayBillNumber}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Vehicle Info */}
            <Card className="p-4 bg-muted">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Current Vehicle</div>
                <div className="text-2xl font-mono font-bold">
                  {selectedBill?.partB.vehicleNumber}
                </div>
              </div>
            </Card>

            {/* New Vehicle Number */}
            <div className="space-y-2">
              <Label htmlFor="newVehicle">
                New Vehicle Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="newVehicle"
                placeholder="MH01AB1234"
                value={newVehicleNumber}
                onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                className="font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the vehicle number in the format: STATE##XX####
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for Update <span className="text-destructive">*</span>
              </Label>
              <Select
                value={reason}
                onValueChange={(value) => setReason(value as PartBUpdateReason)}
                required
              >
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PartBUpdateReason.VehicleBreakdown}>
                    Vehicle Breakdown
                  </SelectItem>
                  <SelectItem value={PartBUpdateReason.MultiVehicleShipment}>
                    Multi-vehicle Shipment
                  </SelectItem>
                  <SelectItem value={PartBUpdateReason.EmergencyReplacement}>
                    Emergency Replacement
                  </SelectItem>
                  <SelectItem value={PartBUpdateReason.CustomsDelay}>
                    Customs Delay
                  </SelectItem>
                  <SelectItem value={PartBUpdateReason.Other}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Additional Notes <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any additional details or context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Maximum 500 characters</span>
                <span>
                  {notes.length}/500
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Continue</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Part-B Update</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the changes before confirming:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Old Vehicle</div>
                <div className="font-mono font-bold text-red-600">
                  {selectedBill?.partB.vehicleNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">New Vehicle</div>
                <div className="font-mono font-bold text-green-600">{newVehicleNumber}</div>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-1">Reason</div>
              <div className="font-medium">{reason}</div>
            </div>
            {notes && (
              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground mb-1">Notes</div>
                <div className="text-sm">{notes}</div>
              </div>
            )}
          </Card>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Update'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
