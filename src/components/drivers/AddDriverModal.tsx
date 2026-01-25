'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { driverApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { useMasterData } from '@/hooks/useMasterData';

interface AddDriverModalProps {
  onSuccess: () => void;
}

export function AddDriverModal({ onSuccess }: AddDriverModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Fetch master data
  const { data: truckTypes, loading: truckTypesLoading } = useMasterData('truck-type');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    licenseNumber: '',
    licenseExpiry: '',
    aadhaarNumber: '',
    panNumber: '',
    preferredTruckTypes: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const driverData = {
        name: formData.name,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: new Date(formData.licenseExpiry).toISOString(),
        aadhaarNumber: formData.aadhaarNumber || undefined,
        panNumber: formData.panNumber || undefined,
        preferredTruckTypes: formData.preferredTruckTypes,
        newUser: {
          phone: formData.phone,
          email: formData.email || undefined,
          password: formData.password || 'Cloudtruck@123', // Default password if not provided
        },
      };

      await driverApi.create(driverData);
      toast.success('Driver created successfully');
      setIsOpen(false);
      onSuccess();
      resetForm();
    } catch (error: unknown) {
      console.error('Failed to create driver:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create driver');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      licenseNumber: '',
      licenseExpiry: '',
      aadhaarNumber: '',
      panNumber: '',
      preferredTruckTypes: [],
    });
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+919876543210"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Default: Cloudtruck@123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseExpiry">License Expiry</Label>
              <Input
                id="licenseExpiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhaarNumber">Aadhaar Number (Optional)</Label>
              <Input
                id="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number (Optional)</Label>
              <Input
                id="panNumber"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                className="uppercase"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Truck Types</Label>
            {truckTypesLoading ? (
              <p className="text-sm text-muted-foreground">Loading truck types...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {truckTypes
                  .filter(type => type.isActive)
                  .map((type) => (
                    <Button
                      key={type._id}
                      type="button"
                      variant={formData.preferredTruckTypes.includes(type.key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTruckTypeChange(type.key)}
                    >
                      {type.displayName}
                    </Button>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Driver
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
