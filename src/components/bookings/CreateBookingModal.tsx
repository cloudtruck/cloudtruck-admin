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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { bookingApi, customerApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Customer, Booking } from '@/types';
import { Loader2 } from 'lucide-react';
import { useMasterData } from '@/hooks/useMasterData';

interface CreateBookingModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSuccessAction: () => void;
}

export function CreateBookingModal({
  isOpen,
  onCloseAction,
  onSuccessAction,
}: CreateBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Fetch master data
  const { data: truckTypes, loading: truckTypesLoading } = useMasterData('truck-type');
  const { data: bodyTypes, loading: bodyTypesLoading } = useMasterData('body-type');
  const { data: materialTypes, loading: materialTypesLoading } = useMasterData('material-type');
  const [formData, setFormData] = useState({
    customerId: '',
    pickupCity: '',
    pickupAddress: '',
    dropCity: '',
    dropAddress: '',
    materialType: '',
    weight: '',
    truckType: '',
    bodyType: '',
    loadDateTime: '',
    expectedAmount: '',
    advanceRequired: '',
    additionalInstructions: '',
    isHazardous: false,
    isFragile: false,
    requiresTemperatureControl: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await customerApi.getAll({ limit: 100 });
      setCustomers(response.data.data.customers);
    } catch (error: unknown) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      pickupCity: '',
      pickupAddress: '',
      dropCity: '',
      dropAddress: '',
      materialType: '',
      weight: '',
      truckType: '',
      bodyType: '',
      loadDateTime: '',
      expectedAmount: '',
      advanceRequired: '',
      additionalInstructions: '',
      isHazardous: false,
      isFragile: false,
      requiresTemperatureControl: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        customerId: formData.customerId,
        pickupCity: formData.pickupCity,
        pickupLat: 0, // Mocked for now
        pickupLng: 0, // Mocked for now
        pickupAddress: formData.pickupAddress,
        dropCity: formData.dropCity,
        dropLat: 0, // Mocked for now
        dropLng: 0, // Mocked for now
        dropAddress: formData.dropAddress,
        materialType: formData.materialType,
        weight: parseFloat(formData.weight),
        truckType: formData.truckType,
        bodyType: formData.bodyType || 'open',
        loadDate: new Date(formData.loadDateTime).toISOString(),
        expectedAmount: formData.expectedAmount ? parseFloat(formData.expectedAmount) : undefined,
        advanceRequired: formData.advanceRequired ? parseFloat(formData.advanceRequired) : 0,
        additionalInstructions: formData.additionalInstructions,
        isHazardous: formData.isHazardous,
        isFragile: formData.isFragile,
        requiresTemperatureControl: formData.requiresTemperatureControl,
        priority: 'medium',
      };

      await bookingApi.create(bookingData as any);
      toast.success('Booking created successfully');
      onSuccessAction();
      onCloseAction();
    } catch (error: unknown) {
      console.error('Failed to create booking:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={customersLoading ? 'Loading customers...' : 'Select customer'} />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.companyName} ({customer.contactPerson?.phone || 'No phone'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupCity">Pickup City</Label>
              <Input
                id="pickupCity"
                value={formData.pickupCity}
                onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dropCity">Drop City</Label>
              <Input
                id="dropCity"
                value={formData.dropCity}
                onChange={(e) => setFormData({ ...formData, dropCity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Input
                id="pickupAddress"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dropAddress">Drop Address</Label>
              <Input
                id="dropAddress"
                value={formData.dropAddress}
                onChange={(e) => setFormData({ ...formData, dropAddress: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialType">Material Type</Label>
              <Select
                value={formData.materialType}
                onValueChange={(value) => setFormData({ ...formData, materialType: value })}
                disabled={materialTypesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={materialTypesLoading ? "Loading..." : "Select material"} />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes
                    .filter(type => type.isActive)
                    .map((type) => (
                      <SelectItem key={type._id} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (Tons)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="truckType">Truck Type</Label>
              <Select
                value={formData.truckType}
                onValueChange={(value) => setFormData({ ...formData, truckType: value })}
                disabled={truckTypesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={truckTypesLoading ? "Loading..." : "Select truck type"} />
                </SelectTrigger>
                <SelectContent>
                  {truckTypes
                    .filter(type => type.isActive)
                    .map((type) => (
                      <SelectItem key={type._id} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyType">Body Type</Label>
              <Select
                value={formData.bodyType}
                onValueChange={(value) => setFormData({ ...formData, bodyType: value })}
                disabled={bodyTypesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={bodyTypesLoading ? "Loading..." : "Select body type"} />
                </SelectTrigger>
                <SelectContent>
                  {bodyTypes
                    .filter(type => type.isActive)
                    .map((type) => (
                      <SelectItem key={type._id} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loadDateTime">Load Date & Time</Label>
              <Input
                id="loadDateTime"
                type="datetime-local"
                value={formData.loadDateTime}
                onChange={(e) => setFormData({ ...formData, loadDateTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedAmount">Expected Amount (₹)</Label>
              <Input
                id="expectedAmount"
                type="number"
                value={formData.expectedAmount}
                onChange={(e) => setFormData({ ...formData, expectedAmount: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isHazardous"
                checked={formData.isHazardous}
                onCheckedChange={(checked) => setFormData({ ...formData, isHazardous: !!checked })}
              />
              <Label htmlFor="isHazardous">Hazardous</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFragile"
                checked={formData.isFragile}
                onCheckedChange={(checked) => setFormData({ ...formData, isFragile: !!checked })}
              />
              <Label htmlFor="isFragile">Fragile</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresTemperatureControl"
                checked={formData.requiresTemperatureControl}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresTemperatureControl: !!checked })}
              />
              <Label htmlFor="requiresTemperatureControl">Temp Control</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInstructions">Additional Instructions</Label>
            <Textarea
              id="additionalInstructions"
              value={formData.additionalInstructions}
              onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
              placeholder="Any special requirements..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCloseAction}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
