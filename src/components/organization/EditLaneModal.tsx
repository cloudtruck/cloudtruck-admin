'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMasterData } from '@/hooks/useMasterData';
import type { MasterData } from '@/types';

interface EditLaneModalProps {
  lane: MasterData;
  open: boolean;
  locations: MasterData[];
  truckTypes: MasterData[];
  onCloseAction: () => void;
  onSuccess?: () => void;
}

export function EditLaneModal({ lane, open, locations, truckTypes, onCloseAction, onSuccess }: EditLaneModalProps) {
  const [saving, setSaving] = useState(false);
  const { updateItem } = useMasterData('lane');

  const [formData, setFormData] = useState({
    shortName: '',
    sourceKey: '',
    destinationKey: '',
    truckType: '',
    customerPrice: '',
    supplierPrice: '',
    totalKm: '',
    totalDays: '',
    isActive: true,
  });

  useEffect(() => {
    setFormData({
      shortName: lane.displayName || '',
      sourceKey: (lane.metadata?.sourceKey as string) || '',
      destinationKey: (lane.metadata?.destinationKey as string) || '',
      truckType: (lane.metadata?.truckType as string) || '',
      customerPrice: lane.metadata?.customerPrice != null ? String(lane.metadata.customerPrice) : '',
      supplierPrice: lane.metadata?.supplierPrice != null ? String(lane.metadata.supplierPrice) : '',
      totalKm: lane.metadata?.totalKm != null ? String(lane.metadata.totalKm) : '',
      totalDays: lane.metadata?.totalDays != null ? String(lane.metadata.totalDays) : '',
      isActive: lane.isActive !== false,
    });
  }, [lane, open]);

  const set = (key: keyof typeof formData, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shortName) return;

    setSaving(true);
    const result = await updateItem(lane._id, {
      displayName: formData.shortName.trim(),
      isActive: formData.isActive,
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
      onSuccess?.();
      onCloseAction();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Lane — {lane.key}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-1.5">
            <Label>Lane Code</Label>
            <Input value={lane.key} disabled className="bg-gray-50 text-gray-500" />
            <p className="text-xs text-gray-500">Lane code cannot be changed</p>
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
              <Label htmlFor="editCustomerPrice">Customer Price (₹)</Label>
              <Input
                id="editCustomerPrice"
                type="number"
                min="0"
                placeholder="0"
                value={formData.customerPrice}
                onChange={(e) => set('customerPrice', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editSupplierPrice">Supplier Price (₹)</Label>
              <Input
                id="editSupplierPrice"
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
              <Label htmlFor="editTotalKm">Total KM</Label>
              <Input
                id="editTotalKm"
                type="number"
                min="0"
                placeholder="e.g. 1400"
                value={formData.totalKm}
                onChange={(e) => set('totalKm', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editTotalDays">Total Days</Label>
              <Input
                id="editTotalDays"
                type="number"
                min="1"
                placeholder="e.g. 2"
                value={formData.totalDays}
                onChange={(e) => set('totalDays', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="editIsActive">Active</Label>
            <Switch
              id="editIsActive"
              checked={formData.isActive}
              onCheckedChange={(v) => set('isActive', v)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onCloseAction}>Cancel</Button>
            <Button type="submit" disabled={saving || !formData.shortName}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
