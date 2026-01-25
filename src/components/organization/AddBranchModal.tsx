'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];

interface AddBranchModalProps {
  onSuccess?: () => void;
}

export function AddBranchModal({ onSuccess }: AddBranchModalProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { createBranch } = useBranches();
  const [formData, setFormData] = useState({
    branchCode: '',
    branchName: '',
    region: 'North',
    assignedCities: [] as string[],
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
    contactDetails: {
      phone: '',
      email: '',
    },
  });

  const [cityInput, setCityInput] = useState('');

  const addCity = () => {
    if (cityInput.trim() && !formData.assignedCities.includes(cityInput.trim())) {
      setFormData({
        ...formData,
        assignedCities: [...formData.assignedCities, cityInput.trim()],
      });
      setCityInput('');
    }
  };

  const removeCity = (city: string) => {
    setFormData({
      ...formData,
      assignedCities: formData.assignedCities.filter((c) => c !== city),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await createBranch({
      ...formData,
      isActive: true,
    });

    setSaving(false);

    if (result) {
      onSuccess?.();
      setOpen(false);
      setFormData({
        branchCode: '',
        branchName: '',
        region: 'North',
        assignedCities: [],
        address: { street: '', city: '', state: '', pincode: '' },
        contactDetails: { phone: '', email: '' },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branchCode">Branch Code *</Label>
              <Input
                id="branchCode"
                value={formData.branchCode}
                onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                placeholder="MUM-01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchName">Branch Name *</Label>
              <Input
                id="branchName"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                placeholder="Mumbai Central"
                required
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
              >
                <SelectTrigger id="region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Assigned Cities</Label>
              <div className="flex gap-2">
                <Input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCity())}
                  placeholder="Type city and press Enter"
                />
                <Button type="button" onClick={addCity}>
                  Add
                </Button>
              </div>
              {formData.assignedCities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.assignedCities.map((city) => (
                    <div
                      key={city}
                      className="bg-gray-100 px-3 py-1 rounded-md flex items-center gap-2"
                    >
                      <span>{city}</span>
                      <button
                        type="button"
                        onClick={() => removeCity(city)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.address.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                value={formData.contactDetails.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactDetails: { ...formData.contactDetails, phone: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.contactDetails.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactDetails: { ...formData.contactDetails, email: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Branch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
