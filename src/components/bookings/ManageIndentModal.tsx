'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bookingApi, staffApi } from '@/lib/api';
import { Booking, Staff } from '@/types';
import { toast } from 'sonner';

interface ManageIndentModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

const EXPIRY_PRESETS = [24, 36, 48];

export function ManageIndentModal({
  booking,
  onClose,
  onSuccess,
}: ManageIndentModalProps) {
  const [saving, setSaving] = useState(false);
  const [materialTypes, setMaterialTypes] = useState<string[]>([]);
  const [truckTypes, setTruckTypes] = useState<string[]>([]);
  const [trafficStaff, setTrafficStaff] = useState<Staff[]>([]);

  // Form state — pre-fill from booking
  const [trafficController, setTrafficController] = useState(booking.trafficController?._id || 'none');
  const [numberOfTrucks, setNumberOfTrucks] = useState(String(booking.numberOfTrucks ?? 1));
  const [weight, setWeight] = useState(String(booking.weight?.value ?? ''));
  const [weightUnit, setWeightUnit] = useState(booking.weight?.unit || booking.weightUnit || 'tons');
  const [materialType, setMaterialType] = useState(booking.materialType || 'none');
  const [customerPrice, setCustomerPrice] = useState(String(booking.customerPrice ?? 0));
  const [supplierPrice, setSupplierPrice] = useState(String(booking.supplierPrice ?? 0));
  const [truckTypeNeeded, setTruckTypeNeeded] = useState(booking.truckTypeNeeded || 'none');
  const [expiryTime, setExpiryTime] = useState(booking.expiryTime || '');
  const [postToSupplier, setPostToSupplier] = useState(booking.postToSupplier !== false);

  useEffect(() => {
    // Material types list
    setMaterialTypes([
      'FMCG', 'electronics', 'furniture', 'steel', 'cement', 'tiles',
      'chemicals', 'textiles', 'agriculture', 'automobile-parts', 'machinery',
      'paper', 'pharma', 'plastic', 'food-grains', 'vegetables-fruits',
      'general-cargo', 'other',
    ]);
    // Truck types from master data API
    const { masterDataApi } = require('@/lib/api');
    masterDataApi
      .getByCategory('truck-type', false)
      .then((res: any) => setTruckTypes((res.data.data || []).map((x: any) => x.value || x.name)))
      .catch(() => {});
    // Traffic staff
    staffApi
      .getAll({ role: 'traffic-controller', limit: 100 })
      .then((res: any) => setTrafficStaff(res.data.data.staff || []))
      .catch(() => {});
  }, []);

  function applyExpiryPreset(hours: number) {
    const d = new Date(Date.now() + hours * 3600000);
    setExpiryTime(d.toISOString());
  }

  async function handleSave() {
    setSaving(true);
    try {
      await bookingApi.update(booking._id, {
        trafficController: trafficController !== 'none' ? trafficController : undefined,
        numberOfTrucks: Number(numberOfTrucks) || 1,
        weight: weight ? { value: Number(weight), unit: weightUnit } : undefined,
        materialType: materialType !== 'none' ? materialType : undefined,
        customerPrice: customerPrice !== '' ? Number(customerPrice) : undefined,
        supplierPrice: supplierPrice !== '' ? Number(supplierPrice) : undefined,
        truckTypeNeeded: truckTypeNeeded !== 'none' ? truckTypeNeeded : undefined,
        expiryTime: expiryTime || undefined,
        postToSupplier,
      } as Partial<Booking>);
      toast.success('Indent updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update indent');
    } finally {
      setSaving(false);
    }
  }

  const createdStr = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      }) + ' ' + new Date(booking.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';

  const expiryStr = expiryTime
    ? new Date(expiryTime).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      }) + ' ' + new Date(expiryTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Manage Indent</span>
            <span className="text-xs bg-muted text-muted-foreground border px-2 py-0.5 rounded font-mono">
              #{booking.bookingId?.toUpperCase() || booking._id?.slice(-6).toUpperCase()}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Booking details card */}
        <div className="bg-slate-50 border rounded-lg p-4 mb-4 text-sm space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Created: {createdStr}</span>
            <span>Type: <strong className="capitalize">{booking.bookingType || 'Indent'}</strong></span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Pickup City</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                {booking.pickup?.city || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Drop City</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                {booking.drop?.city || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Traffic Controller */}
            <div className="space-y-1.5">
              <Label htmlFor="trafficController" className="text-xs font-semibold">Traffic Manager</Label>
              <Select value={trafficController} onValueChange={setTrafficController}>
                <SelectTrigger id="trafficController" className="w-full">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {trafficStaff.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* No of Trucks */}
            <div className="space-y-1.5">
              <Label htmlFor="numberOfTrucks" className="text-xs font-semibold">No. of Vehicles</Label>
              <Input
                id="numberOfTrucks"
                type="number"
                min="1"
                max="10"
                value={numberOfTrucks}
                onChange={(e) => setNumberOfTrucks(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Weight */}
            <div className="space-y-1.5">
              <Label htmlFor="weight" className="text-xs font-semibold">Weight</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  step="any"
                  placeholder="Weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1"
                />
                <Select value={weightUnit} onValueChange={(val) => setWeightUnit(val as 'kg' | 'tons' | 'quintal')}>
                  <SelectTrigger className="w-[95px] shrink-0">
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

            {/* Material Type */}
            <div className="space-y-1.5">
              <Label htmlFor="materialType" className="text-xs font-semibold">Material Type</Label>
              <Select value={materialType} onValueChange={setMaterialType}>
                <SelectTrigger id="materialType" className="w-full">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  {materialTypes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Customer Price */}
            <div className="space-y-1.5">
              <Label htmlFor="customerPrice" className="text-xs font-semibold">Customer Price (₹)</Label>
              <Input
                id="customerPrice"
                type="number"
                placeholder="₹"
                value={customerPrice}
                onChange={(e) => setCustomerPrice(e.target.value)}
              />
            </div>

            {/* Supplier Price */}
            <div className="space-y-1.5">
              <Label htmlFor="supplierPrice" className="text-xs font-semibold">Supplier Price (₹)</Label>
              <Input
                id="supplierPrice"
                type="number"
                placeholder="₹"
                value={supplierPrice}
                onChange={(e) => setSupplierPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Truck Type Needed */}
          <div className="space-y-1.5">
            <Label htmlFor="truckTypeNeeded" className="text-xs font-semibold">Truck Type Needed</Label>
            <Select value={truckTypeNeeded} onValueChange={setTruckTypeNeeded}>
              <SelectTrigger id="truckTypeNeeded" className="w-full">
                <SelectValue placeholder="Select truck type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Select —</SelectItem>
                {truckTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expiry time & presets */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Expiry time: <strong className="text-foreground font-semibold">{expiryStr}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                {EXPIRY_PRESETS.map((h) => (
                  <Button
                    key={h}
                    type="button"
                    variant="outline"
                    onClick={() => applyExpiryPreset(h)}
                    className="h-6 rounded-full px-2.5 text-[10px]"
                  >
                    +{h}h
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Post to Supplier Checkbox */}
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox
              id="postToSupplier"
              checked={postToSupplier}
              onCheckedChange={(checked) => setPostToSupplier(!!checked)}
            />
            <Label htmlFor="postToSupplier" className="text-sm font-medium cursor-pointer mb-0">
              Post to Supplier
            </Label>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
