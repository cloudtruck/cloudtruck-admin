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
import { Input } from '@/components/ui/input';
import { driverApi } from '@/lib/api';
import { toast } from 'sonner';
import { TRUCK_TYPES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import type { Driver } from '@/types';

interface EditDriverModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSuccessAction: () => void;
  driver: Driver;
}

export function EditDriverModal({ isOpen, onCloseAction, onSuccessAction, driver }: EditDriverModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseExpiry: '',
    aadhaarNumber: '',
    panNumber: '',
    preferredTruckTypes: [] as string[],
  });

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || '',
        licenseNumber: driver.licenseNumber || '',
        licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split('T')[0] : '',
        aadhaarNumber: driver.aadhaarNumber || '',
        panNumber: driver.panNumber || '',
        preferredTruckTypes: driver.preferredTruckTypes || [],
      });
    }
  }, [driver]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        // licenseNumber is typically not editable in some systems once verified, but we'll see
        licenseExpiry: formData.licenseExpiry ? new Date(formData.licenseExpiry).toISOString() : undefined,
        aadhaarNumber: formData.aadhaarNumber || undefined,
        panNumber: formData.panNumber || undefined,
        preferredTruckTypes: formData.preferredTruckTypes,
      };

      await driverApi.update(driver._id, updateData);
      toast.success('Driver updated successfully');
      onSuccessAction();
      onCloseAction();
    } catch (error: unknown) {
      console.error('Failed to update driver:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update driver');
    } finally {
      setLoading(false);
    }
  };

  const handleTruckTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredTruckTypes: prev.preferredTruckTypes.includes(type)
        ? prev.preferredTruckTypes.filter((t) => t !== type)
        : [...prev.preferredTruckTypes, type],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Driver Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-licenseNumber">License Number</Label>
              <Input
                id="edit-licenseNumber"
                value={formData.licenseNumber}
                disabled
                className="bg-muted"
              />
              <p className="text-[10px] text-muted-foreground">License number cannot be changed once registered.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-licenseExpiry">License Expiry</Label>
              <Input
                id="edit-licenseExpiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-aadhaarNumber">Aadhaar Number (Optional)</Label>
              <Input
                id="edit-aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-panNumber">PAN Number (Optional)</Label>
              <Input
                id="edit-panNumber"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                className="uppercase"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Truck Types</Label>
            <div className="flex flex-wrap gap-2">
              {TRUCK_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={formData.preferredTruckTypes.includes(type.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTruckTypeChange(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCloseAction}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
