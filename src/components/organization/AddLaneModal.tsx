'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMasterData } from '@/hooks/useMasterData';
import type { MasterData } from '@/types';

interface AddLaneModalProps {
  locations: MasterData[];
  truckTypes: MasterData[];
  onSuccess?: () => void;
}

const emptyForm = {
  laneCode: '',
  shortName: '',
  sourceKey: '',
  destinationKey: '',
  truckType: '',
  customerPrice: '',
  supplierPrice: '',
  totalKm: '',
  totalDays: '',
};

export function AddLaneModal({ locations, truckTypes, onSuccess }: AddLaneModalProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const { createItem } = useMasterData('lane');

  const set = (key: keyof typeof emptyForm, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shortName) return;

    setSaving(true);
    const result = await createItem({
      category: 'lane' as MasterData['category'],
      key: formData.laneCode.trim().toLowerCase() || formData.shortName.toLowerCase().replace(/\s+/g, '-'),
      displayName: formData.shortName.trim(),
      isActive: true,
      metadata: {
        sourceKey: formData.sourceKey || undefined,
        destinationKey: formData.destinationKey || undefined,
        truckType: formData.truckType || undefined,
        customerPrice: formData.customerPrice ? parseFloat(formData.customerPrice) : undefined,
        supplierPrice: formData.supplierPrice ? parseFloat(formData.supplierPrice) : undefined,
        totalKm: formData.totalKm ? parseFloat(formData.totalKm) : undefined,
        totalDays: formData.totalDays ? parseInt(formData.totalDays) : undefined,
      },
    });
    setSaving(false);

    if (result) {
      setOpen(false);
      setFormData({ ...emptyForm });
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-sm gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-3.5 w-3.5" /> Add Lane
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Lane</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="laneCode">Lane Code</Label>
              <Input
                id="laneCode"
                value={formData.laneCode}
                onChange={(e) => set('laneCode', e.target.value)}
                placeholder="e.g. del-mum-ftl"
              />
              <p className="text-xs text-gray-500">Auto-generated if left blank</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shortName">Short Name <span className="text-red-500">*</span></Label>
              <Input
                id="shortName"
                value={formData.shortName}
                onChange={(e) => set('shortName', e.target.value)}
                placeholder="e.g. Delhi → Mumbai FTL"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={formData.sourceKey} onValueChange={(v) => set('sourceKey', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc.key}>{loc.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Destination</Label>
              <Select value={formData.destinationKey} onValueChange={(v) => set('destinationKey', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {locations.filter((l) => l.key !== formData.sourceKey).map((loc) => (
                    <SelectItem key={loc._id} value={loc.key}>{loc.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Truck Type</Label>
            <Select value={formData.truckType} onValueChange={(v) => set('truckType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select truck type" />
              </SelectTrigger>
              <SelectContent>
                {truckTypes.map((t) => (
                  <SelectItem key={t._id} value={t.key}>{t.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customerPrice">Customer Price (₹)</Label>
              <Input
                id="customerPrice"
                type="number"
                min="0"
                placeholder="0"
                value={formData.customerPrice}
                onChange={(e) => set('customerPrice', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplierPrice">Supplier Price (₹)</Label>
              <Input
                id="supplierPrice"
                type="number"
                min="0"
                placeholder="0"
                value={formData.supplierPrice}
                onChange={(e) => set('supplierPrice', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="totalKm">Total KM</Label>
              <Input
                id="totalKm"
                type="number"
                min="0"
                placeholder="e.g. 1400"
                value={formData.totalKm}
                onChange={(e) => set('totalKm', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalDays">Total Days</Label>
              <Input
                id="totalDays"
                type="number"
                min="1"
                placeholder="e.g. 2"
                value={formData.totalDays}
                onChange={(e) => set('totalDays', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !formData.shortName}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Lane
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
