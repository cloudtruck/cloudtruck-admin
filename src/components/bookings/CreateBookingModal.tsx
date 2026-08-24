'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { bookingApi, customerApi, supplierApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Customer, CreateBookingPayload, MasterData, Supplier } from '@/types';
import { Loader2 } from 'lucide-react';
import { useMasterData } from '@/hooks/useMasterData';

interface CreateBookingModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSuccessAction: () => void;
}

const EXPIRY_HOURS = [24, 36, 48];

const emptyForm = {
  // Core
  customerId: '',
  laneCode: '',
  loadType: 'FTL' as 'FTL' | 'LTL' | 'PTL',
  exim: 'domestic' as 'domestic' | 'import' | 'export',
  // Source / Destination (location master data keys)
  sourceCode: '',
  destinationCode: '',
  // Truck & cargo
  truckType: '',
  weightUnit: 'tons' as 'kg' | 'tons',
  weight: '',
  ratePerTon: false,
  materialType: '',
  customMaterialType: '',
  numberOfTrucks: '1',
  bodyType: '',
  // Staff
  trafficController: '',
  supplierEntity: '',
  branch: '',
  // Pricing
  customerPrice: '',
  supplierPrice: '',
  // Scheduling
  loadDate: '',
  expiryHours: 48,
  expiryCustom: '',
  // Misc
  remarks: '',
  postToSupplier: true,
  isHazardous: false,
  isFragile: false,
  requiresTemperatureControl: false,
  // Consignor / Consignee (for LR printing)
  invoiceNo: '',
  invoiceDate: '',
  invoiceDueDate: '',
  ewayBillNo: '',
  consignorName: '',
  consignorGst: '',
  consignorAddress: '',
  consigneeName: '',
  consigneeGst: '',
  consigneeAddress: '',
};

export function CreateBookingModal({
  isOpen,
  onCloseAction,
  onSuccessAction,
}: CreateBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({ ...emptyForm });

  // Master data
  const { data: truckTypes, loading: truckTypesLoading } = useMasterData('truck-type');
  const { data: materialTypes, loading: materialTypesLoading } = useMasterData('material-type');
  const { data: locations, loading: locationsLoading } = useMasterData('location');
  const { data: lanes } = useMasterData('lane');

  const set = (key: keyof typeof emptyForm, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchSuppliers();
    } else {
      setFormData({ ...emptyForm });
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const response = await customerApi.getAll({ limit: 100 });
      setCustomers(response.data.data.customers);
    } catch {
      toast.error('Failed to fetch customers');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierApi.getAll({ verificationStatus: 'verified', limit: 100 });
      setSuppliers(response.data.data.items || []);
    } catch {
      // non-blocking — supplier field is optional
    }
  };

  // When lane is selected, auto-fill source + destination
  const handleLaneChange = useCallback(
    (laneKey: string) => {
      set('laneCode', laneKey);
      const lane = lanes.find((l) => l.key === laneKey);
      if (lane?.metadata) {
        if (lane.metadata.sourceKey) set('sourceCode', lane.metadata.sourceKey);
        if (lane.metadata.destinationKey) set('destinationCode', lane.metadata.destinationKey);
      }
    },
    [lanes]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      toast.error('Customer is required');
      return;
    }
    if (!formData.sourceCode) {
      toast.error('Source is required');
      return;
    }
    if (!formData.destinationCode) {
      toast.error('Destination is required');
      return;
    }
    if (!formData.truckType) {
      toast.error('Truck type is required');
      return;
    }

    // Derive pickup/drop city + state from location metadata
    const srcLoc = locations.find((l: MasterData) => l.key === formData.sourceCode);
    const dstLoc = locations.find((l: MasterData) => l.key === formData.destinationCode);
    const pickupCity = (srcLoc?.metadata?.city as string) || formData.sourceCode || '';
    const dropCity = (dstLoc?.metadata?.city as string) || formData.destinationCode || '';
    const pickupState = (srcLoc?.metadata?.state as string) || undefined;
    const dropState = (dstLoc?.metadata?.state as string) || undefined;
    const pickupAddress =
      formData.consignorAddress ||
      (srcLoc?.metadata?.address as string) ||
      srcLoc?.displayName ||
      pickupCity;
    const dropAddress =
      formData.consigneeAddress ||
      (dstLoc?.metadata?.address as string) ||
      dstLoc?.displayName ||
      dropCity;

    // Compute expiryTime
    let expiryTime: string | undefined;
    if (formData.expiryCustom) {
      expiryTime = new Date(formData.expiryCustom).toISOString();
    } else {
      const d = new Date();
      d.setHours(d.getHours() + formData.expiryHours);
      expiryTime = d.toISOString();
    }

    setLoading(true);
    try {
      const payload: CreateBookingPayload = {
        customerId: formData.customerId,
        pickupCity,
        pickupState,
        pickupAddress,
        pickupLat: 0,
        pickupLng: 0,
        dropCity,
        dropState,
        dropAddress,
        dropLat: 0,
        dropLng: 0,
        materialType: formData.materialType === 'other' ? (formData.customMaterialType || 'other') : (formData.materialType || 'general-cargo'),
        weight: formData.weight ? parseFloat(formData.weight) : 1,
        weightUnit: formData.weightUnit,
        truckType: formData.truckType,
        bodyType: formData.bodyType || 'open',
        numberOfTrucks: parseInt(formData.numberOfTrucks) || 1,
        loadDate: formData.loadDate ? new Date(formData.loadDate).toISOString() : undefined,
        expectedAmount: formData.customerPrice ? parseFloat(formData.customerPrice) : undefined,
        advanceRequired: 0,
        isHazardous: formData.isHazardous,
        isFragile: formData.isFragile,
        requiresTemperatureControl: formData.requiresTemperatureControl,
        // Digitify fields
        laneCode: formData.laneCode || undefined,
        sourceCode: formData.sourceCode,
        destinationCode: formData.destinationCode,
        loadType: formData.loadType,
        exim: formData.exim,
        supplierEntity: formData.supplierEntity || undefined,
        trafficController: formData.trafficController || undefined,
        supplierPrice: formData.supplierPrice ? parseFloat(formData.supplierPrice) : 0,
        customerPrice: formData.customerPrice ? parseFloat(formData.customerPrice) : 0,
        ratePerTon: formData.ratePerTon,
        expiryTime,
        postToSupplier: formData.postToSupplier,
        remarks: formData.remarks || undefined,
        invoiceNo: formData.invoiceNo || undefined,
        invoiceDate: formData.invoiceDate ? new Date(formData.invoiceDate).toISOString() : undefined,
        invoiceDueDate: formData.invoiceDueDate ? new Date(formData.invoiceDueDate).toISOString() : undefined,
        ewayBillNo: formData.ewayBillNo || undefined,
        pickupContactName: formData.consignorName || undefined,
        pickupContactGst: formData.consignorGst || undefined,
        dropContactName: formData.consigneeName || undefined,
        dropContactGst: formData.consigneeGst || undefined,
      };

      await bookingApi.create(payload);
      toast.success('Indent created successfully');
      onSuccessAction();
      onCloseAction();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create indent');
    } finally {
      setLoading(false);
    }
  };

  const expiryDate = (() => {
    const d = new Date();
    d.setHours(d.getHours() + formData.expiryHours);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold">Create Indent</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {/* Lane Code */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Lane Code</Label>
            <Select value={formData.laneCode} onValueChange={handleLaneChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select lane code" />
              </SelectTrigger>
              <SelectContent>
                {lanes
                  .filter((l) => l.isActive)
                  .map((lane) => (
                    <SelectItem key={lane._id} value={lane.key}>
                      {lane.displayName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Customer <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.customerId} onValueChange={(v) => set('customerId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Load Date</Label>
              <Input
                type="datetime-local"
                value={formData.loadDate}
                onChange={(e) => set('loadDate', e.target.value)}
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Source <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.sourceCode}
              onValueChange={(v) => set('sourceCode', v)}
              disabled={locationsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={locationsLoading ? 'Loading...' : 'Select source location'}
                />
              </SelectTrigger>
              <SelectContent>
                {locations
                  .filter((l) => l.isActive)
                  .map((loc) => (
                    <SelectItem key={loc._id} value={loc.key}>
                      {loc.displayName}
                      {loc.metadata?.city && loc.metadata.city !== loc.displayName
                        ? ` — ${loc.metadata.city}`
                        : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Destination <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.destinationCode}
              onValueChange={(v) => set('destinationCode', v)}
              disabled={locationsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={locationsLoading ? 'Loading...' : 'Select destination location'}
                />
              </SelectTrigger>
              <SelectContent>
                {locations
                  .filter((l) => l.isActive && l.key !== formData.sourceCode)
                  .map((loc) => (
                    <SelectItem key={loc._id} value={loc.key}>
                      {loc.displayName}
                      {loc.metadata?.city && loc.metadata.city !== loc.displayName
                        ? ` — ${loc.metadata.city}`
                        : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Truck Type + Weight + Rate/ton */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Truck Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.truckType}
                onValueChange={(v) => set('truckType', v)}
                disabled={truckTypesLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={truckTypesLoading ? 'Loading...' : 'Select truck type'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {truckTypes
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <SelectItem key={t._id} value={t.key}>
                        {t.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Weight</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  placeholder="e.g. 20"
                  value={formData.weight}
                  onChange={(e) => set('weight', e.target.value)}
                  className="flex-1"
                />
                <Select value={formData.weightUnit} onValueChange={(v) => set('weightUnit', v)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tons">Ton</SelectItem>
                    <SelectItem value="kg">KG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Rate/ton + Material Type + No of Vehicles */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Material Type</Label>
              <Select
                value={formData.materialType}
                onValueChange={(v) => set('materialType', v)}
                disabled={materialTypesLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={materialTypesLoading ? 'Loading...' : 'Select material'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <SelectItem key={t._id} value={t.key}>
                        {t.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formData.materialType === 'other' && (
                <div className="pt-1.5">
                  <Input
                    type="text"
                    placeholder="Enter custom material type"
                    value={formData.customMaterialType || ''}
                    onChange={(e) => set('customMaterialType', e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">No. of Vehicles</Label>
              <Input
                type="number"
                min="1"
                value={formData.numberOfTrucks}
                onChange={(e) => set('numberOfTrucks', e.target.value)}
              />
            </div>
          </div>

          {/* Supplier + Traffic */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Supplier</Label>
              <Select
                value={formData.supplierEntity}
                onValueChange={(v) => set('supplierEntity', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Load Type</Label>
              <Select value={formData.loadType} onValueChange={(v) => set('loadType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FTL">FTL</SelectItem>
                  <SelectItem value="PTL">PTL</SelectItem>
                  <SelectItem value="LCL">LCL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Price + Supplier Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Customer Price (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.customerPrice}
                onChange={(e) => set('customerPrice', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Supplier Price (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.supplierPrice}
                onChange={(e) => set('supplierPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Rate per ton checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="ratePerTon"
              checked={formData.ratePerTon}
              onCheckedChange={(v) => set('ratePerTon', !!v)}
            />
            <Label htmlFor="ratePerTon" className="text-sm cursor-pointer">
              Rate / ton
            </Label>
          </div>

          {/* LR & Party Details */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              LR &amp; Party Details (optional)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Invoice No</Label>
                <Input
                  value={formData.invoiceNo}
                  onChange={(e) => set('invoiceNo', e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">E-way Bill No</Label>
                <Input
                  placeholder="e.g. 141001234567"
                  value={formData.ewayBillNo}
                  onChange={(e) => set('ewayBillNo', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => set('invoiceDate', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Invoice Due Date</Label>
                <Input
                  type="date"
                  value={formData.invoiceDueDate}
                  onChange={(e) => set('invoiceDueDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Consignor Name</Label>
                <Input
                  placeholder="Defaults to customer company name"
                  value={formData.consignorName}
                  onChange={(e) => set('consignorName', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Consignor GST No</Label>
                <Input
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={formData.consignorGst}
                  onChange={(e) => set('consignorGst', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Consignor Address</Label>
              <Input
                placeholder="Defaults to source location address"
                value={formData.consignorAddress}
                onChange={(e) => set('consignorAddress', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Consignee Name</Label>
                <Input
                  value={formData.consigneeName}
                  onChange={(e) => set('consigneeName', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Consignee GST No</Label>
                <Input
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={formData.consigneeGst}
                  onChange={(e) => set('consigneeGst', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Consignee Address</Label>
              <Input
                placeholder="Defaults to destination location address"
                value={formData.consigneeAddress}
                onChange={(e) => set('consigneeAddress', e.target.value)}
              />
            </div>
          </div>

          {/* Expiry Time */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Expiry time: {expiryDate}
            </Label>
            <div className="flex items-center gap-2">
              {EXPIRY_HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    set('expiryHours', h);
                    set('expiryCustom', '');
                  }}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    formData.expiryHours === h && !formData.expiryCustom
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:border-blue-400'
                  }`}
                >
                  {h}
                </button>
              ))}
              <Input
                type="datetime-local"
                placeholder="Custom"
                value={formData.expiryCustom}
                onChange={(e) => set('expiryCustom', e.target.value)}
                className="flex-1 h-8 text-sm"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Remarks</Label>
            <Textarea
              placeholder="Additional notes or special requirements..."
              value={formData.remarks}
              onChange={(e) => set('remarks', e.target.value)}
              rows={2}
            />
          </div>

          {/* Post to supplier + cargo flags */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="postToSupplier"
                checked={formData.postToSupplier}
                onCheckedChange={(v) => set('postToSupplier', !!v)}
              />
              <Label htmlFor="postToSupplier" className="text-sm cursor-pointer">
                Post to supplier
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isHazardous"
                checked={formData.isHazardous}
                onCheckedChange={(v) => set('isHazardous', !!v)}
              />
              <Label htmlFor="isHazardous" className="text-sm cursor-pointer">
                Hazardous
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isFragile"
                checked={formData.isFragile}
                onCheckedChange={(v) => set('isFragile', !!v)}
              />
              <Label htmlFor="isFragile" className="text-sm cursor-pointer">
                Fragile
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="requiresTemperatureControl"
                checked={formData.requiresTemperatureControl}
                onCheckedChange={(v) => set('requiresTemperatureControl', !!v)}
              />
              <Label htmlFor="requiresTemperatureControl" className="text-sm cursor-pointer">
                Temp Control
              </Label>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}+ CREATE INDENT
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
