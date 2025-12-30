'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { bookingApi } from '@/lib/api';
import { Booking } from '@/types';
import { toast } from 'sonner';
import { TRUCK_TYPES, BODY_TYPES, MATERIAL_TYPES } from '@/lib/constants';

interface EditBookingModalProps {
  booking: Booking | null;
  open: boolean;
  onCloseAction: () => void;
  onSuccessAction: () => void;
}

export function EditBookingModal({ booking, open, onCloseAction, onSuccessAction }: EditBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickupCity: '',
    pickupAddress: '',
    dropCity: '',
    dropAddress: '',
    materialType: '',
    weight: '',
    truckType: '',
    bodyType: '',
    additionalInstructions: '',
    isHazardous: false,
    isFragile: false,
    requiresTemperatureControl: false,
  });

  useEffect(() => {
    if (booking && open) {
      setFormData({
        pickupCity: booking.pickup?.city || '',
        pickupAddress: booking.pickup?.address || '',
        dropCity: booking.drop?.city || '',
        dropAddress: booking.drop?.address || '',
        materialType: booking.materialType || '',
        weight: booking.weight?.value?.toString() || '',
        truckType: booking.truckTypeNeeded || '',
        bodyType: booking.bodyType || '',
        additionalInstructions: booking.additionalInstructions || '',
        isHazardous: booking.isHazardous || false,
        isFragile: booking.isFragile || false,
        requiresTemperatureControl: booking.requiresTemperatureControl || false,
      });
    }
  }, [booking, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setLoading(true);
    try {
      const updateData = {
        pickupCity: formData.pickupCity,
        pickupAddress: formData.pickupAddress,
        dropCity: formData.dropCity,
        dropAddress: formData.dropAddress,
        materialType: formData.materialType,
        weight: formData.weight ? { value: parseFloat(formData.weight), unit: 'tons' as const } : undefined,
        truckType: formData.truckType,
        bodyType: formData.bodyType,
        additionalInstructions: formData.additionalInstructions,
        isHazardous: formData.isHazardous,
        isFragile: formData.isFragile,
        requiresTemperatureControl: formData.requiresTemperatureControl,
      };

      await bookingApi.update(booking._id, updateData);
      toast.success('Booking updated successfully');
      onSuccessAction();
      onCloseAction();
    } catch (error: unknown) {
      console.error('Failed to update booking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pickup Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickupCity">Pickup City</Label>
              <Input
                id="pickupCity"
                value={formData.pickupCity}
                onChange={(e) => handleInputChange('pickupCity', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Input
                id="pickupAddress"
                value={formData.pickupAddress}
                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Drop Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dropCity">Drop City</Label>
              <Input
                id="dropCity"
                value={formData.dropCity}
                onChange={(e) => handleInputChange('dropCity', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="dropAddress">Drop Address</Label>
              <Input
                id="dropAddress"
                value={formData.dropAddress}
                onChange={(e) => handleInputChange('dropAddress', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Material and Weight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="materialType">Material Type</Label>
              <Select value={formData.materialType} onValueChange={(value) => handleInputChange('materialType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weight">Weight (tons)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Truck Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="truckType">Truck Type</Label>
              <Select value={formData.truckType} onValueChange={(value) => handleInputChange('truckType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select truck type" />
                </SelectTrigger>
                <SelectContent>
                  {TRUCK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bodyType">Body Type</Label>
              <Select value={formData.bodyType} onValueChange={(value) => handleInputChange('bodyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Special Requirements */}
          <div className="space-y-3">
            <Label>Special Requirements</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isHazardous"
                  checked={formData.isHazardous}
                  onCheckedChange={(checked) => handleInputChange('isHazardous', checked)}
                />
                <Label htmlFor="isHazardous" className="mb-0">Hazardous Material</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFragile"
                  checked={formData.isFragile}
                  onCheckedChange={(checked) => handleInputChange('isFragile', checked)}
                />
                <Label htmlFor="isFragile" className="mb-0">Fragile</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresTemperatureControl"
                  checked={formData.requiresTemperatureControl}
                  onCheckedChange={(checked) => handleInputChange('requiresTemperatureControl', checked)}
                />
                <Label htmlFor="requiresTemperatureControl" className="mb-0">Temperature Control</Label>
              </div>
            </div>
          </div>

          {/* Additional Instructions */}
          <div>
            <Label htmlFor="additionalInstructions">Additional Instructions</Label>
            <Textarea
              id="additionalInstructions"
              value={formData.additionalInstructions}
              onChange={(e) => handleInputChange('additionalInstructions', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCloseAction}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}