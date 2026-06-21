'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
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
import { useMasterData } from '@/hooks/useMasterData';

interface EditBookingModalProps {
  booking: Booking | null;
  open: boolean;
  onCloseAction: () => void;
  onSuccessAction: () => void;
}

export function EditBookingModal({
  booking,
  open,
  onCloseAction,
  onSuccessAction,
}: EditBookingModalProps) {
  const [loading, setLoading] = useState(false);

  // Fetch master data
  const { data: truckTypes, loading: truckTypesLoading } = useMasterData('truck-type');
  const { data: bodyTypes, loading: bodyTypesLoading } = useMasterData('body-type');
  const { data: materialTypes, loading: materialTypesLoading } = useMasterData('material-type');
  const [formData, setFormData] = useState({
    pickupCity: '',
    pickupAddress: '',
    dropCity: '',
    dropAddress: '',
    materialType: '',
    weight: '',
    weightUnit: 'tons' as 'kg' | 'tons' | 'quintal',
    truckType: '',
    bodyType: '',
    additionalInstructions: '',
    isHazardous: false,
    isFragile: false,
    requiresTemperatureControl: false,
    // Pricing & Operational
    customerPrice: '',
    supplierPrice: '',
    customerAdvancePct: '',
    supplierAdvancePct: '',
    supplierTds: '',
    invoiceTo: '' as '' | 'Customer' | 'Supplier' | 'Both',
    tripKm: '',
    actualKm: '',
    expectedDeliveryDate: '',
    // LR & Reference Numbers
    boeNumber: '',
    jobNo: '',
    hireChallan: '',
    invoiceNo: '',
    shipmentNo: '',
    containerNo: '',
    poNumber: '',
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
        weightUnit: booking.weight?.unit || 'tons',
        truckType: booking.truckTypeNeeded || '',
        bodyType: booking.bodyType || '',
        additionalInstructions: booking.additionalInstructions || '',
        isHazardous: booking.isHazardous || false,
        isFragile: booking.isFragile || false,
        requiresTemperatureControl: booking.requiresTemperatureControl || false,
        // Pricing & Operational
        customerPrice: booking.customerPrice != null ? String(booking.customerPrice) : '',
        supplierPrice: booking.supplierPrice != null ? String(booking.supplierPrice) : '',
        customerAdvancePct: booking.customerAdvancePct != null ? String(booking.customerAdvancePct) : '',
        supplierAdvancePct: booking.supplierAdvancePct != null ? String(booking.supplierAdvancePct) : '',
        supplierTds: booking.supplierTds != null ? String(booking.supplierTds) : '',
        invoiceTo: booking.invoiceTo || '',
        tripKm: booking.tripKm != null ? String(booking.tripKm) : '',
        actualKm: booking.actualKm != null ? String(booking.actualKm) : '',
        expectedDeliveryDate: booking.expectedDeliveryDate
          ? new Date(booking.expectedDeliveryDate).toISOString().slice(0, 16)
          : '',
        // LR & Reference Numbers
        boeNumber: booking.boeNumber || '',
        jobNo: booking.jobNo || '',
        hireChallan: booking.hireChallan || '',
        invoiceNo: booking.invoiceNo || '',
        shipmentNo: booking.shipmentNo || '',
        containerNo: booking.containerNo || '',
        poNumber: booking.poNumber || '',
      });
    }
  }, [booking, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        pickupCity: formData.pickupCity,
        pickupAddress: formData.pickupAddress,
        dropCity: formData.dropCity,
        dropAddress: formData.dropAddress,
        materialType: formData.materialType,
        weight: formData.weight
          ? { value: parseFloat(formData.weight), unit: formData.weightUnit as 'kg' | 'tons' | 'quintal' }
          : undefined,
        truckType: formData.truckType,
        bodyType: formData.bodyType,
        additionalInstructions: formData.additionalInstructions,
        isHazardous: formData.isHazardous,
        isFragile: formData.isFragile,
        requiresTemperatureControl: formData.requiresTemperatureControl,
        // Pricing & Operational
        ...(formData.customerPrice !== '' && { customerPrice: parseFloat(formData.customerPrice) }),
        ...(formData.supplierPrice !== '' && { supplierPrice: parseFloat(formData.supplierPrice) }),
        ...(formData.customerAdvancePct !== '' && { customerAdvancePct: parseFloat(formData.customerAdvancePct) }),
        ...(formData.supplierAdvancePct !== '' && { supplierAdvancePct: parseFloat(formData.supplierAdvancePct) }),
        ...(formData.supplierTds !== '' && { supplierTds: parseFloat(formData.supplierTds) }),
        ...(formData.invoiceTo && { invoiceTo: formData.invoiceTo }),
        ...(formData.tripKm !== '' && { tripKm: parseFloat(formData.tripKm) }),
        ...(formData.actualKm !== '' && { actualKm: parseFloat(formData.actualKm) }),
        ...(formData.expectedDeliveryDate && { expectedDeliveryDate: new Date(formData.expectedDeliveryDate).toISOString() }),
        // LR & Reference Numbers (send empty string to clear, omit if untouched would require dirty tracking)
        ...(formData.boeNumber !== '' && { boeNumber: formData.boeNumber }),
        ...(formData.jobNo !== '' && { jobNo: formData.jobNo }),
        ...(formData.hireChallan !== '' && { hireChallan: formData.hireChallan }),
        ...(formData.invoiceNo !== '' && { invoiceNo: formData.invoiceNo }),
        ...(formData.shipmentNo !== '' && { shipmentNo: formData.shipmentNo }),
        ...(formData.containerNo !== '' && { containerNo: formData.containerNo }),
        ...(formData.poNumber !== '' && { poNumber: formData.poNumber }),
      };

      await bookingApi.update(booking._id, updateData);
      toast.success('Booking updated successfully');
      onSuccessAction();
      onCloseAction();
    } catch (error: unknown) {
      logger.error('Failed to update booking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
              <Select
                value={formData.materialType}
                onValueChange={(value) => handleInputChange('materialType', value)}
                disabled={materialTypesLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={materialTypesLoading ? 'Loading...' : 'Select material type'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes
                    .filter((type) => type.isActive)
                    .map((type) => (
                      <SelectItem key={type._id} value={type.key}>
                        {type.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weight">Weight</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="flex-grow"
                  required
                />
                <Select
                  value={formData.weightUnit}
                  onValueChange={(value) => handleInputChange('weightUnit', value)}
                >
                  <SelectTrigger className="w-[100px] shrink-0">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tons">Tons</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="quintal">qtl</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Truck Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="truckType">Truck Type</Label>
              <Select
                value={formData.truckType}
                onValueChange={(value) => handleInputChange('truckType', value)}
                disabled={truckTypesLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={truckTypesLoading ? 'Loading...' : 'Select truck type'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {truckTypes
                    .filter((type) => type.isActive)
                    .map((type) => (
                      <SelectItem key={type._id} value={type.key}>
                        {type.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bodyType">Body Type</Label>
              <Select
                value={formData.bodyType}
                onValueChange={(value) => handleInputChange('bodyType', value)}
                disabled={bodyTypesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={bodyTypesLoading ? 'Loading...' : 'Select body type'} />
                </SelectTrigger>
                <SelectContent>
                  {bodyTypes
                    .filter((type) => type.isActive)
                    .map((type) => (
                      <SelectItem key={type._id} value={type.key}>
                        {type.displayName}
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
                <Label htmlFor="isHazardous" className="mb-0">
                  Hazardous Material
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFragile"
                  checked={formData.isFragile}
                  onCheckedChange={(checked) => handleInputChange('isFragile', checked)}
                />
                <Label htmlFor="isFragile" className="mb-0">
                  Fragile
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresTemperatureControl"
                  checked={formData.requiresTemperatureControl}
                  onCheckedChange={(checked) =>
                    handleInputChange('requiresTemperatureControl', checked)
                  }
                />
                <Label htmlFor="requiresTemperatureControl" className="mb-0">
                  Temperature Control
                </Label>
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

          {/* Pricing & Operational */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pricing &amp; Operational</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerPrice">Customer Price (₹)</Label>
                <Input
                  id="customerPrice"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.customerPrice}
                  onChange={(e) => handleInputChange('customerPrice', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="supplierPrice">Supplier Price (₹)</Label>
                <Input
                  id="supplierPrice"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.supplierPrice}
                  onChange={(e) => handleInputChange('supplierPrice', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customerAdvancePct">Customer Advance %</Label>
                <Input
                  id="customerAdvancePct"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.customerAdvancePct}
                  onChange={(e) => handleInputChange('customerAdvancePct', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="supplierAdvancePct">Supplier Advance %</Label>
                <Input
                  id="supplierAdvancePct"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.supplierAdvancePct}
                  onChange={(e) => handleInputChange('supplierAdvancePct', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="supplierTds">Supplier TDS %</Label>
                <Input
                  id="supplierTds"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.supplierTds}
                  onChange={(e) => handleInputChange('supplierTds', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invoiceTo">Invoice To</Label>
                <Select
                  value={formData.invoiceTo}
                  onValueChange={(value) => handleInputChange('invoiceTo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Supplier">Supplier</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tripKm">Trip Km</Label>
                <Input
                  id="tripKm"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.tripKm}
                  onChange={(e) => handleInputChange('tripKm', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="actualKm">Actual Km</Label>
                <Input
                  id="actualKm"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.actualKm}
                  onChange={(e) => handleInputChange('actualKm', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="expectedDeliveryDate">Expected Delivery Date &amp; Time (ETA)</Label>
                <Input
                  id="expectedDeliveryDate"
                  type="datetime-local"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* LR & Reference Numbers */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">LR &amp; Reference Numbers</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="boeNumber">BOE / Booking No</Label>
                <Input
                  id="boeNumber"
                  value={formData.boeNumber}
                  onChange={(e) => handleInputChange('boeNumber', e.target.value)}
                  placeholder="e.g. BOE12345"
                />
              </div>
              <div>
                <Label htmlFor="jobNo">Job No</Label>
                <Input
                  id="jobNo"
                  value={formData.jobNo}
                  onChange={(e) => handleInputChange('jobNo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="hireChallan">Hire Challan</Label>
                <Input
                  id="hireChallan"
                  value={formData.hireChallan}
                  onChange={(e) => handleInputChange('hireChallan', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invoiceNo">Invoice No</Label>
                <Input
                  id="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={(e) => handleInputChange('invoiceNo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shipmentNo">Shipment No</Label>
                <Input
                  id="shipmentNo"
                  value={formData.shipmentNo}
                  onChange={(e) => handleInputChange('shipmentNo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="containerNo">Container No</Label>
                <Input
                  id="containerNo"
                  value={formData.containerNo}
                  onChange={(e) => handleInputChange('containerNo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  value={formData.poNumber}
                  onChange={(e) => handleInputChange('poNumber', e.target.value)}
                />
              </div>
            </div>
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
