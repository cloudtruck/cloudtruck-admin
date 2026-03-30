'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SideSelect } from '@/components/ui/side-select';
import type { SideSelectOption } from '@/components/ui/side-select';
import { bookingApi, customerApi, vehicleApi, driverApi, staffApi, supplierApi } from '@/lib/api';
import { toast } from 'sonner';
import type {
  Customer,
  CreateBookingPayload,
  MasterData,
  Vehicle,
  Driver,
  Staff,
  Supplier,
} from '@/types';
import { useMasterData } from '@/hooks/useMasterData';

type ActiveTab = 'Indent' | 'Direct Load' | 'Direct Invoice';

function localDateTimeString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyDirectInvoice = {
  customerId: '',
  laneCode: '',
  sourceCode: '',
  destinationCode: '',
  trafficController: '',
  vehicleId: '',
  truckType: '',
  driverId: '',
  customerPrice: '',
  supplierPrice: '',
  ratePerTon: false,
  customerAdvancePct: '0',
  supplierAdvancePct: '0',
  customerOnDelivery: '',
  customerPaysSupplier: '',
  supplierPaysSupplier: '',
  customerPodBalance: '',
  supplierPodBalance: '',
  invoiceTo: '',
  customerRef: '',
  supplierRef: '',
  payTo: 'Supplier',
  accountNo: '',
  podType: 'Hard' as 'Hard' | 'Soft',
  date: localDateTimeString(),
  tripCount: '1',
  tripKm: '',
};

const emptyDirectLoad = {
  customerId: '',
  laneCode: '',
  sourceCode: '',
  destinationCode: '',
  trafficController: '',
  vehicleId: '',
  truckType: '',
  driverId: '',
  customerPrice: '',
  supplierPrice: '',
  ratePerTon: false,
  customerAdvancePct: '0',
  supplierAdvancePct: '0',
  customerOnDelivery: '',
  customerPaysSupplier: '',
  supplierPaysSupplier: '',
  customerPodBalance: '',
  supplierPodBalance: '',
  invoiceTo: '',
  customerRef: '',
  supplierRef: '',
  payTo: 'Supplier',
  accountNo: '',
  podType: 'Hard' as 'Hard' | 'Soft',
  date: localDateTimeString(),
  tripKm: '',
};

const EXPIRY_HOURS = [24, 36, 48];

const emptyForm = {
  customerId: '',
  laneCode: '',
  loadType: 'FTL' as 'FTL' | 'LTL' | 'PTL',
  exim: 'domestic' as 'domestic' | 'import' | 'export',
  sourceCode: '',
  destinationCode: '',
  truckType: '',
  weightUnit: 'tons' as 'kg' | 'tons',
  weight: '',
  ratePerTon: false,
  materialType: '',
  numberOfTrucks: '1',
  bodyType: '',
  supplierEntity: '',
  trafficController: '',
  customerPrice: '',
  supplierPrice: '',
  // Fix 5: loadDate starts empty — no pre-fill with current time
  loadDate: '',
  expiryHours: 48,
  expiryCustom: '',
  remarks: '',
  postToSupplier: true,
  isHazardous: false,
  isFragile: false,
  requiresTemperatureControl: false,
};

export default function CreateIndentPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('Indent');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [dlForm, setDlForm] = useState({ ...emptyDirectLoad });
  const [diForm, setDiForm] = useState({ ...emptyDirectInvoice });

  const { data: truckTypes } = useMasterData('truck-type');
  const { data: materialTypes } = useMasterData('material-type');
  const { data: locations, loading: locationsLoading } = useMasterData('location');
  const { data: lanes } = useMasterData('lane');

  const set = (key: keyof typeof emptyForm, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const setDl = (key: keyof typeof emptyDirectLoad, value: unknown) =>
    setDlForm((prev) => ({ ...prev, [key]: value }));

  const setDi = (key: keyof typeof emptyDirectInvoice, value: unknown) =>
    setDiForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    fetchCustomers();
    fetchVehicles();
    fetchDrivers();
    fetchStaff();
    fetchSuppliers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await customerApi.getAll({ limit: 100 });
      setCustomers(res.data.data.customers);
    } catch {
      toast.error('Failed to fetch customers');
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await vehicleApi.getAll({ limit: 200, status: 'verified' });
      setVehicles(res.data.data.vehicles);
    } catch {
      /* silent */
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await driverApi.getAll({ limit: 200 });
      setDrivers(res.data.data.drivers);
    } catch {
      /* silent */
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await staffApi.getAll({ limit: 100 });
      setStaffList(res.data.data.staff);
    } catch {
      /* silent */
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await supplierApi.getAll({ verificationStatus: 'verified', limit: 100 });
      setSupplierList(res.data.data.items || []);
    } catch {
      /* silent */
    }
  };

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

  // Options
  const customerOptions: SideSelectOption[] = customers.map((c) => ({
    value: c._id,
    label: c.companyName,
    sublabel: c.contactPerson?.phone || c.phone,
  }));

  const locationOptions: SideSelectOption[] = locations
    .filter((l) => l.isActive)
    .map((l: MasterData) => ({
      value: l.key,
      label: l.displayName,
      sublabel: l.metadata?.city
        ? `${l.metadata.city}${l.metadata.type ? ` · ${l.metadata.type}` : ''}`
        : undefined,
    }));

  const laneOptions: SideSelectOption[] = lanes
    .filter((l) => l.isActive)
    .map((l: MasterData) => ({
      value: l.key,
      label: l.displayName,
      sublabel: l.metadata?.distanceKm
        ? `${l.metadata.distanceKm} km · ${l.metadata.transitDays ?? '?'} days`
        : undefined,
    }));

  const truckTypeOptions: SideSelectOption[] = truckTypes
    .filter((t) => t.isActive)
    .map((t) => ({ value: t.key, label: t.displayName }));

  const materialOptions: SideSelectOption[] = materialTypes
    .filter((t) => t.isActive)
    .map((t) => ({ value: t.key, label: t.displayName }));

  // Supplier options from Supplier entity (not MasterData)
  const supplierOptions: SideSelectOption[] = supplierList.map((s: Supplier) => ({
    value: s._id,
    label: s.displayName,
    sublabel: s.city ?? s.companyName,
  }));

  const vehicleOptions: SideSelectOption[] = vehicles.map((v) => ({
    value: v._id,
    label: v.vehicleNumber,
    sublabel: v.truckType,
  }));

  const driverOptions: SideSelectOption[] = drivers.map((d) => ({
    value: d._id,
    label: d.name,
    sublabel: d.phone,
  }));

  const trafficOptions: SideSelectOption[] = staffList.map((s) => ({
    value: s._id,
    label: s.name,
    sublabel: s.email,
  }));

  const podTypeOptions: SideSelectOption[] = [
    { value: 'Hard', label: 'Hard' },
    { value: 'Soft', label: 'Soft' },
  ];

  const payToOptions: SideSelectOption[] = [
    { value: 'Supplier', label: 'Supplier' },
    { value: 'Driver', label: 'Driver' },
    { value: 'Customer', label: 'Customer' },
  ];

  const invoiceToOptions: SideSelectOption[] = [
    { value: 'Customer', label: 'Customer' },
    { value: 'Supplier', label: 'Supplier' },
    { value: 'Both', label: 'Both' },
  ];

  const weightUnitOptions: SideSelectOption[] = [
    { value: 'tons', label: 'Ton' },
    { value: 'kg', label: 'KG' },
  ];

  const indentTypeOptions: SideSelectOption[] = [
    { value: 'FTL', label: 'FTL' },
    { value: 'PTL', label: 'PTL' },
    { value: 'LCL', label: 'LCL' },
  ];

  const eximOptions: SideSelectOption[] = [
    { value: 'domestic', label: 'Domestic' },
    { value: 'import', label: 'Import' },
    { value: 'export', label: 'Export' },
  ];

  const bodyTypeOptions: SideSelectOption[] = [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'container', label: 'Container' },
    { value: 'tanker', label: 'Tanker' },
    { value: 'flatbed', label: 'Flatbed' },
  ];

  const expiryDate = (() => {
    const d = new Date();
    d.setHours(d.getHours() + formData.expiryHours);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  })();

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

    const srcLoc = locations.find((l: MasterData) => l.key === formData.sourceCode);
    const dstLoc = locations.find((l: MasterData) => l.key === formData.destinationCode);
    const pickupCity = (srcLoc?.metadata?.city as string) || formData.sourceCode;
    const dropCity = (dstLoc?.metadata?.city as string) || formData.destinationCode;
    const pickupAddress =
      (srcLoc?.metadata?.address as string) || srcLoc?.displayName || pickupCity;
    const dropAddress = (dstLoc?.metadata?.address as string) || dstLoc?.displayName || dropCity;

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
        pickupAddress,
        pickupLat: 0,
        pickupLng: 0,
        dropCity,
        dropAddress,
        dropLat: 0,
        dropLng: 0,
        materialType: formData.materialType || 'general-cargo',
        weight: formData.weight ? parseFloat(formData.weight) : 1,
        weightUnit: formData.weightUnit,
        truckType: formData.truckType,
        bodyType: formData.bodyType || 'open',
        numberOfTrucks: parseInt(formData.numberOfTrucks) || 1,
        // Fix 5: only send loadDate if user actually set it
        loadDate: formData.loadDate ? new Date(formData.loadDate).toISOString() : undefined,
        expectedAmount: formData.customerPrice ? parseFloat(formData.customerPrice) : undefined,
        advanceRequired: 0,
        isHazardous: formData.isHazardous,
        isFragile: formData.isFragile,
        requiresTemperatureControl: formData.requiresTemperatureControl,
        laneCode: formData.laneCode || undefined,
        sourceCode: formData.sourceCode,
        destinationCode: formData.destinationCode,
        supplierEntity: formData.supplierEntity || undefined,
        loadType: formData.loadType,
        exim: formData.exim,
        trafficController: formData.trafficController || undefined,
        supplierPrice: (() => {
          const rate = formData.supplierPrice ? parseFloat(formData.supplierPrice) : 0;
          const wt = formData.weight ? parseFloat(formData.weight) : 0;
          return formData.ratePerTon && wt > 0 ? rate * wt : rate || undefined;
        })(),
        customerPrice: (() => {
          const rate = formData.customerPrice ? parseFloat(formData.customerPrice) : 0;
          const wt = formData.weight ? parseFloat(formData.weight) : 0;
          return formData.ratePerTon && wt > 0 ? rate * wt : rate || undefined;
        })(),
        ratePerTon: formData.ratePerTon,
        expiryTime,
        postToSupplier: formData.postToSupplier,
        remarks: formData.remarks || undefined,
      };

      await bookingApi.create(payload);
      toast.success('Indent created successfully');
      router.push('/indents');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create indent');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLoadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dlForm.customerId) {
      toast.error('Customer is required');
      return;
    }
    if (!dlForm.sourceCode) {
      toast.error('Source is required');
      return;
    }
    if (!dlForm.destinationCode) {
      toast.error('Destination is required');
      return;
    }
    if (!dlForm.vehicleId) {
      toast.error('Truck No is required');
      return;
    }

    const srcLoc = locations.find((l: MasterData) => l.key === dlForm.sourceCode);
    const dstLoc = locations.find((l: MasterData) => l.key === dlForm.destinationCode);
    const pickupCity = (srcLoc?.metadata?.city as string) || dlForm.sourceCode;
    const dropCity = (dstLoc?.metadata?.city as string) || dlForm.destinationCode;
    const pickupAddress =
      (srcLoc?.metadata?.address as string) || srcLoc?.displayName || pickupCity;
    const dropAddress = (dstLoc?.metadata?.address as string) || dstLoc?.displayName || dropCity;

    const vehicle = vehicles.find((v) => v._id === dlForm.vehicleId);

    setLoading(true);
    try {
      const payload: CreateBookingPayload = {
        customerId: dlForm.customerId,
        pickupCity,
        pickupAddress,
        pickupLat: 0,
        pickupLng: 0,
        dropCity,
        dropAddress,
        dropLat: 0,
        dropLng: 0,
        materialType: 'general-cargo',
        weight: 1,
        weightUnit: 'tons',
        truckType: dlForm.truckType || vehicle?.truckType || 'open-body',
        bodyType: 'open',
        numberOfTrucks: 1,
        loadDate: dlForm.date ? new Date(dlForm.date).toISOString() : undefined,
        expectedAmount: dlForm.customerPrice ? parseFloat(dlForm.customerPrice) : undefined,
        advanceRequired: 0,
        laneCode: dlForm.laneCode || undefined,
        sourceCode: dlForm.sourceCode,
        destinationCode: dlForm.destinationCode,
        trafficController: dlForm.trafficController || undefined,
        supplierPrice: dlForm.supplierPrice ? parseFloat(dlForm.supplierPrice) : undefined,
        customerPrice: dlForm.customerPrice ? parseFloat(dlForm.customerPrice) : undefined,
        bookingType: 'direct-load',
        ratePerTon: dlForm.ratePerTon,
        vehicleId: dlForm.vehicleId,
        driverId: dlForm.driverId || undefined,
        customerAdvancePct: dlForm.customerAdvancePct ? parseFloat(dlForm.customerAdvancePct) : 0,
        supplierAdvancePct: dlForm.supplierAdvancePct ? parseFloat(dlForm.supplierAdvancePct) : 0,
        customerOnDelivery: dlForm.customerOnDelivery ? parseFloat(dlForm.customerOnDelivery) : 0,
        customerPaysSupplier: dlForm.customerPaysSupplier
          ? parseFloat(dlForm.customerPaysSupplier)
          : 0,
        supplierPaysSupplier: dlForm.supplierPaysSupplier
          ? parseFloat(dlForm.supplierPaysSupplier)
          : 0,
        customerPodBalance: dlForm.customerPodBalance ? parseFloat(dlForm.customerPodBalance) : 0,
        supplierPodBalance: dlForm.supplierPodBalance ? parseFloat(dlForm.supplierPodBalance) : 0,
        invoiceTo: (dlForm.invoiceTo as 'Customer' | 'Supplier' | 'Both') || undefined,
        payTo: (dlForm.payTo as 'Supplier' | 'Driver' | 'Customer') || undefined,
        accountNo: dlForm.accountNo || undefined,
        podType: (dlForm.podType as 'Hard' | 'Soft') || undefined,
        tripKm: dlForm.tripKm ? parseFloat(dlForm.tripKm) : undefined,
        remarks:
          dlForm.customerRef || dlForm.supplierRef
            ? `CustRef: ${dlForm.customerRef} SupRef: ${dlForm.supplierRef}`.trim()
            : undefined,
      };

      await bookingApi.create(payload);
      toast.success('Direct load created successfully');
      router.push('/indents');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create direct load');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diForm.customerId) {
      toast.error('Customer is required');
      return;
    }
    if (!diForm.sourceCode) {
      toast.error('Source is required');
      return;
    }
    if (!diForm.destinationCode) {
      toast.error('Destination is required');
      return;
    }
    if (!diForm.vehicleId) {
      toast.error('Truck No is required');
      return;
    }

    const srcLoc = locations.find((l: MasterData) => l.key === diForm.sourceCode);
    const dstLoc = locations.find((l: MasterData) => l.key === diForm.destinationCode);
    const pickupCity = (srcLoc?.metadata?.city as string) || diForm.sourceCode;
    const dropCity = (dstLoc?.metadata?.city as string) || diForm.destinationCode;
    const pickupAddress =
      (srcLoc?.metadata?.address as string) || srcLoc?.displayName || pickupCity;
    const dropAddress = (dstLoc?.metadata?.address as string) || dstLoc?.displayName || dropCity;

    const vehicle = vehicles.find((v) => v._id === diForm.vehicleId);

    setLoading(true);
    try {
      const payload: CreateBookingPayload = {
        customerId: diForm.customerId,
        pickupCity,
        pickupAddress,
        pickupLat: 0,
        pickupLng: 0,
        dropCity,
        dropAddress,
        dropLat: 0,
        dropLng: 0,
        materialType: 'general-cargo',
        weight: 1,
        weightUnit: 'tons',
        truckType: diForm.truckType || vehicle?.truckType || 'open-body',
        bodyType: 'open',
        numberOfTrucks: parseInt(diForm.tripCount) || 1,
        loadDate: diForm.date ? new Date(diForm.date).toISOString() : undefined,
        expectedAmount: diForm.customerPrice ? parseFloat(diForm.customerPrice) : undefined,
        advanceRequired: 0,
        laneCode: diForm.laneCode || undefined,
        sourceCode: diForm.sourceCode,
        destinationCode: diForm.destinationCode,
        trafficController: diForm.trafficController || undefined,
        supplierPrice: diForm.supplierPrice ? parseFloat(diForm.supplierPrice) : undefined,
        customerPrice: diForm.customerPrice ? parseFloat(diForm.customerPrice) : undefined,
        bookingType: 'direct-invoice',
        ratePerTon: diForm.ratePerTon,
        vehicleId: diForm.vehicleId,
        driverId: diForm.driverId || undefined,
        customerAdvancePct: diForm.customerAdvancePct ? parseFloat(diForm.customerAdvancePct) : 0,
        supplierAdvancePct: diForm.supplierAdvancePct ? parseFloat(diForm.supplierAdvancePct) : 0,
        customerOnDelivery: diForm.customerOnDelivery ? parseFloat(diForm.customerOnDelivery) : 0,
        customerPaysSupplier: diForm.customerPaysSupplier
          ? parseFloat(diForm.customerPaysSupplier)
          : 0,
        supplierPaysSupplier: diForm.supplierPaysSupplier
          ? parseFloat(diForm.supplierPaysSupplier)
          : 0,
        customerPodBalance: diForm.customerPodBalance ? parseFloat(diForm.customerPodBalance) : 0,
        supplierPodBalance: diForm.supplierPodBalance ? parseFloat(diForm.supplierPodBalance) : 0,
        invoiceTo: (diForm.invoiceTo as 'Customer' | 'Supplier' | 'Both') || undefined,
        payTo: (diForm.payTo as 'Supplier' | 'Driver' | 'Customer') || undefined,
        accountNo: diForm.accountNo || undefined,
        podType: (diForm.podType as 'Hard' | 'Soft') || undefined,
        tripKm: diForm.tripKm ? parseFloat(diForm.tripKm) : undefined,
        remarks:
          diForm.customerRef || diForm.supplierRef
            ? `CustRef: ${diForm.customerRef} SupRef: ${diForm.supplierRef}`.trim()
            : undefined,
      };

      await bookingApi.create(payload);
      toast.success('Direct invoice created successfully');
      router.push('/indents');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create direct invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Use the dashboard layout's main scroll container. This page should not create its own.
    <div className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
      {/* Dark header — not scrollable */}
      <div className="bg-[#1a2744] shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/indents">
              <ArrowLeft className="h-5 w-5 text-white hover:opacity-70 transition-opacity" />
            </Link>
            <h1 className="text-base font-semibold text-white">Create Indent</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              const now = localDateTimeString();
              setFormData({ ...emptyForm });
              setDlForm({ ...emptyDirectLoad, date: now });
              setDiForm({ ...emptyDirectInvoice, date: now });
            }}
            className="text-xs font-semibold tracking-wide text-white hover:opacity-70 transition-opacity"
          >
            RESET
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-t border-white/10">
          {(['Indent', 'Direct Load', 'Direct Invoice'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto bg-[#f0f2f5]">
        {activeTab === 'Direct Load' && (
          <form
            id="create-indent-form"
            onSubmit={handleDirectLoadSubmit}
            className="max-w-lg mx-auto px-4 py-6 space-y-3"
          >
            {/* Lane Code */}
            <FormField label="Lane Code">
              <SideSelect
                label="Lane Code"
                panelTitle="Select Lane"
                placeholder="Select lane code"
                options={laneOptions}
                value={dlForm.laneCode}
                onChange={(v) => {
                  setDl('laneCode', v);
                  const lane = lanes.find((l) => l.key === v);
                  if (lane?.metadata) {
                    if (lane.metadata.sourceKey) setDl('sourceCode', lane.metadata.sourceKey);
                    if (lane.metadata.destinationKey)
                      setDl('destinationCode', lane.metadata.destinationKey);
                  }
                }}
                clearable
                onClear={() => {
                  setDl('laneCode', '');
                  setDl('sourceCode', '');
                  setDl('destinationCode', '');
                }}
              />
            </FormField>

            {/* Customer */}
            <FormField label="Customer">
              <SideSelect
                label="Customer"
                panelTitle="Select Customer"
                placeholder="Select customer"
                options={customerOptions}
                value={dlForm.customerId}
                onChange={(v) => setDl('customerId', v)}
              />
            </FormField>

            {/* Source */}
            <FormField label="Source" required>
              <SideSelect
                label="Source"
                panelTitle="Select Source Location"
                placeholder={locationsLoading ? 'Loading...' : 'Select source'}
                options={locationOptions}
                value={dlForm.sourceCode}
                onChange={(v) => setDl('sourceCode', v)}
                disabled={locationsLoading || !!dlForm.laneCode}
              />
            </FormField>

            {/* Destination */}
            <FormField label="Destination" required>
              <SideSelect
                label="Destination"
                panelTitle="Select Destination"
                placeholder={locationsLoading ? 'Loading...' : 'Select destination'}
                options={locationOptions.filter((o) => o.value !== dlForm.sourceCode)}
                value={dlForm.destinationCode}
                onChange={(v) => setDl('destinationCode', v)}
                disabled={locationsLoading || !!dlForm.laneCode}
              />
            </FormField>

            {/* Traffic */}
            <FormField label="Traffic">
              <SideSelect
                label="Traffic"
                panelTitle="Select Traffic Manager"
                placeholder="Select traffic manager"
                options={trafficOptions}
                value={dlForm.trafficController}
                onChange={(v) => setDl('trafficController', v)}
              />
            </FormField>

            {/* Truck No + Truck Type */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Truck No" required>
                <SideSelect
                  label="Truck No"
                  panelTitle="Select Truck"
                  placeholder="Select truck"
                  options={vehicleOptions}
                  value={dlForm.vehicleId}
                  onChange={(v) => {
                    setDl('vehicleId', v);
                    const veh = vehicles.find((x) => x._id === v);
                    if (veh?.truckType) setDl('truckType', veh.truckType);
                  }}
                />
              </FormField>
              <FormField label="Truck Type">
                <SideSelect
                  label="Truck Type"
                  panelTitle="Select Truck Type"
                  placeholder="Truck type"
                  options={truckTypeOptions}
                  value={dlForm.truckType}
                  onChange={(v) => setDl('truckType', v)}
                />
              </FormField>
            </div>

            {/* Driver */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Driver">
                <SideSelect
                  label="Driver"
                  panelTitle="Select Driver"
                  placeholder="Select driver"
                  options={driverOptions}
                  value={dlForm.driverId}
                  onChange={(v) => setDl('driverId', v)}
                />
              </FormField>
            </div>

            {/* Rate/ton toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="dlRatePerTon"
                checked={dlForm.ratePerTon}
                onCheckedChange={(v) => setDl('ratePerTon', !!v)}
              />
              <Label htmlFor="dlRatePerTon" className="text-sm cursor-pointer">
                Rate/ton
              </Label>
            </div>

            {/* Customer Price + Supplier Price */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label={dlForm.ratePerTon ? 'Customer Rate Per Ton' : 'Customer Price'}>
                <Input
                  type="number"
                  placeholder={dlForm.ratePerTon ? 'Customer Rate Per Ton' : 'Customer Price'}
                  value={dlForm.customerPrice}
                  onChange={(e) => setDl('customerPrice', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
              <FormField label={dlForm.ratePerTon ? 'Supplier Rate Per Ton' : 'Supplier Price'}>
                <Input
                  type="number"
                  placeholder={dlForm.ratePerTon ? 'Supplier Rate Per Ton' : 'Supplier Price'}
                  value={dlForm.supplierPrice}
                  onChange={(e) => setDl('supplierPrice', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>

            {/* Customer Advance % + Supplier Advance % */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Customer Advance">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={dlForm.customerAdvancePct}
                    onChange={(e) => setDl('customerAdvancePct', e.target.value)}
                    className="bg-white text-sm pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    %
                  </span>
                </div>
              </FormField>
              <FormField label="Supplier Advance">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={dlForm.supplierAdvancePct}
                    onChange={(e) => setDl('supplierAdvancePct', e.target.value)}
                    className="bg-white text-sm pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    %
                  </span>
                </div>
              </FormField>
            </div>

            {/* Customer On-Delivery */}
            <FormField label="Customer On-Delivery">
              <Input
                type="number"
                placeholder="Customer On-Delivery"
                value={dlForm.customerOnDelivery}
                onChange={(e) => setDl('customerOnDelivery', e.target.value)}
                className="bg-white text-sm"
              />
            </FormField>

            {/* Customer Pays Supplier + (right col empty) */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Customer Pays Supplier">
                <Input
                  type="number"
                  placeholder="Customer Pays Supplier"
                  value={dlForm.customerPaysSupplier}
                  onChange={(e) => setDl('customerPaysSupplier', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
              <FormField label="Supplier Pays Supplier">
                <Input
                  type="number"
                  placeholder="Supplier Pays Supplier"
                  value={dlForm.supplierPaysSupplier}
                  onChange={(e) => setDl('supplierPaysSupplier', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>

            {/* Customer POD Balance + Supplier POD Balance */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Customer POD Balance">
                <Input
                  type="number"
                  placeholder="Customer POD Balance"
                  value={dlForm.customerPodBalance}
                  onChange={(e) => setDl('customerPodBalance', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
              <FormField label="Supplier POD Balance">
                <Input
                  type="number"
                  placeholder="Supplier POD Balance"
                  value={dlForm.supplierPodBalance}
                  onChange={(e) => setDl('supplierPodBalance', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>

            {/* Invoice to + Customer ref + Supplier ref */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <FormField label="Invoice to">
                <SideSelect
                  label="Invoice to"
                  panelTitle="Invoice to"
                  placeholder="Invoice to"
                  options={invoiceToOptions}
                  value={dlForm.invoiceTo}
                  onChange={(v) => setDl('invoiceTo', v)}
                  searchable={false}
                />
              </FormField>
              <FormField label="Customer Ref">
                <Input
                  placeholder="Customer..."
                  value={dlForm.customerRef}
                  onChange={(e) => setDl('customerRef', e.target.value)}
                  className="bg-white text-sm w-28"
                />
              </FormField>
              <FormField label="Supplier Ref">
                <Input
                  placeholder="Supplier ..."
                  value={dlForm.supplierRef}
                  onChange={(e) => setDl('supplierRef', e.target.value)}
                  className="bg-white text-sm w-28"
                />
              </FormField>
            </div>

            {/* Pay to + Account No */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Pay to">
                <SideSelect
                  label="Pay to"
                  panelTitle="Pay to"
                  placeholder="Supplier"
                  options={payToOptions}
                  value={dlForm.payTo}
                  onChange={(v) => setDl('payTo', v)}
                  searchable={false}
                />
              </FormField>
              <FormField label="Account No">
                <SideSelect
                  label="Account No"
                  panelTitle="Select Account"
                  placeholder="Account No"
                  options={[]}
                  value={dlForm.accountNo}
                  onChange={(v) => setDl('accountNo', v)}
                />
              </FormField>
            </div>

            {/* POD Type */}
            <FormField label="POD Type">
              <SideSelect
                label="POD Type"
                panelTitle="Select POD Type"
                placeholder="Hard"
                options={podTypeOptions}
                value={dlForm.podType}
                onChange={(v) => setDl('podType', v as 'Hard' | 'Soft')}
                searchable={false}
              />
            </FormField>

            {/* Date + Trip Km */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Date" required>
                <Input
                  type="datetime-local"
                  value={dlForm.date}
                  onChange={(e) => setDl('date', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
              <FormField label="Trip Km">
                <Input
                  type="number"
                  placeholder="Trip Km"
                  value={dlForm.tripKm}
                  onChange={(e) => setDl('tripKm', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>
          </form>
        )}

        {activeTab === 'Direct Invoice' && (
          <form
            id="create-indent-form"
            onSubmit={handleDirectInvoiceSubmit}
            className="max-w-lg mx-auto px-4 py-6 space-y-3"
          >
            <FormField label="Lane Code">
              <SideSelect
                label="Lane Code"
                panelTitle="Select Lane"
                placeholder="Select lane code"
                options={laneOptions}
                value={diForm.laneCode}
                onChange={(v) => {
                  setDi('laneCode', v);
                  const lane = lanes.find((l) => l.key === v);
                  if (lane?.metadata) {
                    if (lane.metadata.sourceKey) setDi('sourceCode', lane.metadata.sourceKey);
                    if (lane.metadata.destinationKey)
                      setDi('destinationCode', lane.metadata.destinationKey);
                  }
                }}
                clearable
                onClear={() => {
                  setDi('laneCode', '');
                  setDi('sourceCode', '');
                  setDi('destinationCode', '');
                }}
              />
            </FormField>

            <FormField label="Customer">
              <SideSelect
                label="Customer"
                panelTitle="Select Customer"
                placeholder="Select customer"
                options={customerOptions}
                value={diForm.customerId}
                onChange={(v) => setDi('customerId', v)}
              />
            </FormField>

            <FormField label="Source" required>
              <SideSelect
                label="Source"
                panelTitle="Select Source Location"
                placeholder={locationsLoading ? 'Loading...' : 'Select source'}
                options={locationOptions}
                value={diForm.sourceCode}
                onChange={(v) => setDi('sourceCode', v)}
                disabled={locationsLoading || !!diForm.laneCode}
              />
            </FormField>

            <FormField label="Destination" required>
              <SideSelect
                label="Destination"
                panelTitle="Select Destination"
                placeholder={locationsLoading ? 'Loading...' : 'Select destination'}
                options={locationOptions.filter((o) => o.value !== diForm.sourceCode)}
                value={diForm.destinationCode}
                onChange={(v) => setDi('destinationCode', v)}
                disabled={locationsLoading || !!diForm.laneCode}
              />
            </FormField>

            <FormField label="Traffic">
              <SideSelect
                label="Traffic"
                panelTitle="Select Traffic Manager"
                placeholder="Select traffic manager"
                options={trafficOptions}
                value={diForm.trafficController}
                onChange={(v) => setDi('trafficController', v)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Truck No" required>
                <SideSelect
                  label="Truck No"
                  panelTitle="Select Truck"
                  placeholder="Select truck"
                  options={vehicleOptions}
                  value={diForm.vehicleId}
                  onChange={(v) => {
                    setDi('vehicleId', v);
                    const veh = vehicles.find((x) => x._id === v);
                    if (veh?.truckType) setDi('truckType', veh.truckType);
                  }}
                />
              </FormField>
              <FormField label="Truck Type">
                <SideSelect
                  label="Truck Type"
                  panelTitle="Select Truck Type"
                  placeholder="Truck type"
                  options={truckTypeOptions}
                  value={diForm.truckType}
                  onChange={(v) => setDi('truckType', v)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Driver">
                <SideSelect
                  label="Driver"
                  panelTitle="Select Driver"
                  placeholder="Select driver"
                  options={driverOptions}
                  value={diForm.driverId}
                  onChange={(v) => setDi('driverId', v)}
                />
              </FormField>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="diRatePerTon"
                checked={diForm.ratePerTon}
                onCheckedChange={(v) => setDi('ratePerTon', !!v)}
              />
              <Label htmlFor="diRatePerTon" className="text-sm cursor-pointer">
                Rate/ton
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label={diForm.ratePerTon ? 'Customer Rate Per Ton' : 'Customer Price'}>
                <Input
                  type="number"
                  placeholder={diForm.ratePerTon ? 'Customer Rate Per Ton' : 'Customer Price'}
                  value={diForm.customerPrice}
                  onChange={(e) => setDi('customerPrice', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
              <FormField label={diForm.ratePerTon ? 'Supplier Rate Per Ton' : 'Supplier Price'}>
                <Input
                  type="number"
                  placeholder={diForm.ratePerTon ? 'Supplier Rate Per Ton' : 'Supplier Price'}
                  value={diForm.supplierPrice}
                  onChange={(e) => setDi('supplierPrice', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Customer Advance">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={diForm.customerAdvancePct}
                    onChange={(e) => setDi('customerAdvancePct', e.target.value)}
                    className="bg-white text-sm pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    %
                  </span>
                </div>
              </FormField>
              <FormField label="Supplier Advance">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={diForm.supplierAdvancePct}
                    onChange={(e) => setDi('supplierAdvancePct', e.target.value)}
                    className="bg-white text-sm pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    %
                  </span>
                </div>
              </FormField>
            </div>

            <FormField label="Customer On-Delivery">
              <Input
                type="number"
                placeholder="Customer On-Delivery"
                value={diForm.customerOnDelivery}
                onChange={(e) => setDi('customerOnDelivery', e.target.value)}
                className="bg-white text-sm"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Customer Pays Supplier">
                <Input
                  type="number"
                  placeholder="Customer Pays Supplier"
                  value={diForm.customerPaysSupplier}
                  onChange={(e) => setDi('customerPaysSupplier', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
              <FormField label="Supplier Pays Supplier">
                <Input
                  type="number"
                  placeholder="Customer Pays Supplier"
                  value={diForm.supplierPaysSupplier}
                  onChange={(e) => setDi('supplierPaysSupplier', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Customer POD Balance">
                <Input
                  type="number"
                  placeholder="Customer POD Balance"
                  value={diForm.customerPodBalance}
                  onChange={(e) => setDi('customerPodBalance', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
              <FormField label="Supplier POD Balance">
                <Input
                  type="number"
                  placeholder="Supplier POD Balance"
                  value={diForm.supplierPodBalance}
                  onChange={(e) => setDi('supplierPodBalance', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <FormField label="Invoice to">
                <SideSelect
                  label="Invoice to"
                  panelTitle="Invoice to"
                  placeholder="Invoice to"
                  options={invoiceToOptions}
                  value={diForm.invoiceTo}
                  onChange={(v) => setDi('invoiceTo', v)}
                  searchable={false}
                />
              </FormField>
              <FormField label="Customer Ref">
                <Input
                  placeholder="Customer..."
                  value={diForm.customerRef}
                  onChange={(e) => setDi('customerRef', e.target.value)}
                  className="bg-white text-sm w-28"
                />
              </FormField>
              <FormField label="Supplier Ref">
                <Input
                  placeholder="Supplier ..."
                  value={diForm.supplierRef}
                  onChange={(e) => setDi('supplierRef', e.target.value)}
                  className="bg-white text-sm w-28"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Pay to">
                <SideSelect
                  label="Pay to"
                  panelTitle="Pay to"
                  placeholder="Supplier"
                  options={payToOptions}
                  value={diForm.payTo}
                  onChange={(v) => setDi('payTo', v)}
                  searchable={false}
                />
              </FormField>
              <FormField label="Account No">
                <SideSelect
                  label="Account No"
                  panelTitle="Select Account"
                  placeholder="Account No"
                  options={[]}
                  value={diForm.accountNo}
                  onChange={(v) => setDi('accountNo', v)}
                />
              </FormField>
            </div>

            <FormField label="POD Type">
              <SideSelect
                label="POD Type"
                panelTitle="Select POD Type"
                placeholder="Hard"
                options={podTypeOptions}
                value={diForm.podType}
                onChange={(v) => setDi('podType', v as 'Hard' | 'Soft')}
                searchable={false}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Date" required>
                <Input
                  type="datetime-local"
                  value={diForm.date}
                  onChange={(e) => setDi('date', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Trip Count" required>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={diForm.tripCount}
                  onChange={(e) => setDi('tripCount', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
              <FormField label="Trip Km">
                <Input
                  type="number"
                  placeholder="Trip Km"
                  value={diForm.tripKm}
                  onChange={(e) => setDi('tripKm', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>
          </form>
        )}

        {activeTab === 'Indent' && (
          <form
            id="create-indent-form"
            onSubmit={handleSubmit}
            className="max-w-lg mx-auto px-4 py-6 space-y-3"
          >
            {/* Lane Code */}
            <FormField label="Lane Code">
              <SideSelect
                label="Lane Code"
                panelTitle="Select Lane"
                placeholder="Select lane code"
                options={laneOptions}
                value={formData.laneCode}
                onChange={handleLaneChange}
                clearable
                onClear={() => {
                  set('laneCode', '');
                  set('sourceCode', '');
                  set('destinationCode', '');
                }}
              />
            </FormField>

            {/* Indent ID + Date */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Indent Id">
                <Input
                  placeholder="Auto-generated"
                  value=""
                  readOnly
                  className="bg-white text-gray-400 text-sm"
                />
              </FormField>
              {/* Fix 5: no fallback to new Date() — let user pick explicitly */}
              <FormField label="Date">
                <Input
                  type="datetime-local"
                  value={formData.loadDate}
                  onChange={(e) => set('loadDate', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>

            {/* Customer */}
            <FormField label="Customer" required>
              <SideSelect
                label="Customer"
                panelTitle="Select Customer"
                placeholder="Select customer"
                options={customerOptions}
                value={formData.customerId}
                onChange={(v) => set('customerId', v)}
              />
            </FormField>

            {/* Source */}
            <FormField label="Source" required>
              <SideSelect
                label="Source"
                panelTitle="Select Source Location"
                placeholder={locationsLoading ? 'Loading...' : 'Select source'}
                options={locationOptions}
                value={formData.sourceCode}
                onChange={(v) => set('sourceCode', v)}
                disabled={locationsLoading || !!formData.laneCode}
              />
            </FormField>

            {/* Destination */}
            <FormField label="Destination" required>
              <SideSelect
                label="Destination"
                panelTitle="Select Destination"
                placeholder={locationsLoading ? 'Loading...' : 'Select destination'}
                options={locationOptions.filter((o) => o.value !== formData.sourceCode)}
                value={formData.destinationCode}
                onChange={(v) => set('destinationCode', v)}
                disabled={locationsLoading || !!formData.laneCode}
              />
            </FormField>

            {/* Truck Type + Weight unit */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Truck Type" required>
                <SideSelect
                  label="Truck Type"
                  panelTitle="Select Truck Type"
                  placeholder="Select truck type"
                  options={truckTypeOptions}
                  value={formData.truckType}
                  onChange={(v) => set('truckType', v)}
                />
              </FormField>
              <FormField label="Weight Unit">
                <SideSelect
                  label="Weight Unit"
                  panelTitle="Select Unit"
                  placeholder="Ton"
                  options={weightUnitOptions}
                  value={formData.weightUnit}
                  onChange={(v) => set('weightUnit', v)}
                  searchable={false}
                />
              </FormField>
            </div>

            {/* Weight + Rate/ton */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <FormField label="Weight">
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder="e.g. 20"
                    value={formData.weight}
                    onChange={(e) => set('weight', e.target.value)}
                    className="bg-white text-sm"
                  />
                </FormField>
              </div>
              <div className="flex items-center gap-2 pb-2.5">
                <Checkbox
                  id="ratePerTon"
                  checked={formData.ratePerTon}
                  onCheckedChange={(v) => set('ratePerTon', !!v)}
                />
                <Label htmlFor="ratePerTon" className="text-sm cursor-pointer">
                  Rate/ton
                </Label>
              </div>
            </div>

            {/* Material Type + No. of Vehicles */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Material type">
                <SideSelect
                  label="Material type"
                  panelTitle="Select Material"
                  placeholder="Select material"
                  options={materialOptions}
                  value={formData.materialType}
                  onChange={(v) => set('materialType', v)}
                />
              </FormField>
              <FormField label="No of Vehicle">
                <Input
                  type="number"
                  min="1"
                  value={formData.numberOfTrucks}
                  onChange={(e) => set('numberOfTrucks', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>

            <FormField label="Traffic">
              <SideSelect
                label="Traffic"
                panelTitle="Select Traffic Manager"
                placeholder="Select traffic manager"
                options={trafficOptions}
                value={formData.trafficController}
                onChange={(v) => set('trafficController', v)}
              />
            </FormField>

            {/* Supplier */}
            <FormField label="Supplier">
              <SideSelect
                label="Supplier"
                panelTitle="Select Supplier"
                placeholder="Select supplier"
                options={supplierOptions}
                value={formData.supplierEntity}
                onChange={(v) => set('supplierEntity', v)}
              />
            </FormField>

            {/* Indent Type + EXIM */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Indent Type">
                <SideSelect
                  label="Indent Type"
                  panelTitle="Select Indent Type"
                  placeholder="FTL"
                  options={indentTypeOptions}
                  value={formData.loadType}
                  onChange={(v) => set('loadType', v)}
                  searchable={false}
                />
              </FormField>
              <FormField label="EXIM">
                <SideSelect
                  label="EXIM"
                  panelTitle="Select EXIM"
                  placeholder="Domestic"
                  options={eximOptions}
                  value={formData.exim}
                  onChange={(v) => set('exim', v)}
                  searchable={false}
                />
              </FormField>
            </div>

            {/* Body Type */}
            <FormField label="Body Type">
              <SideSelect
                label="Body Type"
                panelTitle="Select Body Type"
                placeholder="Select body type"
                options={bodyTypeOptions}
                value={formData.bodyType}
                onChange={(v) => set('bodyType', v)}
                searchable={false}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label={formData.ratePerTon ? 'Customer Rate Per Ton' : 'Customer Price'}>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={formData.customerPrice}
                  onChange={(e) => set('customerPrice', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
              <FormField label={formData.ratePerTon ? 'Supplier Rate Per Ton' : 'Supplier Price'}>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={formData.supplierPrice}
                  onChange={(e) => set('supplierPrice', e.target.value)}
                  className="bg-white text-sm"
                />
              </FormField>
            </div>
            {formData.ratePerTon && (
              <div className="grid grid-cols-2 gap-3 -mt-1">
                <p className="text-xs text-gray-500 px-1">
                  Customer Price: ₹
                  {(
                    (parseFloat(formData.customerPrice) || 0) * (parseFloat(formData.weight) || 0)
                  ).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500 px-1">
                  Supplier Price: ₹
                  {(
                    (parseFloat(formData.supplierPrice) || 0) * (parseFloat(formData.weight) || 0)
                  ).toLocaleString('en-IN')}
                </p>
              </div>
            )}

            {/* Expiry time */}
            <div className="bg-white rounded-md border border-gray-200 px-4 py-3 space-y-2">
              <p className="text-sm text-gray-600">
                Expiry time: <span className="font-medium text-gray-800">{expiryDate}</span>
              </p>
              <div className="flex items-center gap-2">
                {EXPIRY_HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      set('expiryHours', h);
                      set('expiryCustom', '');
                    }}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors font-medium ${
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
                  value={formData.expiryCustom}
                  onChange={(e) => {
                    set('expiryCustom', e.target.value);
                    set('expiryHours', 48);
                  }}
                  className="flex-1 h-8 text-xs bg-white"
                />
              </div>
            </div>

            {/* Remarks */}
            <FormField label="Remarks">
              <Textarea
                placeholder="Additional notes..."
                value={formData.remarks}
                onChange={(e) => set('remarks', e.target.value)}
                rows={2}
                className="bg-white text-sm resize-none"
              />
            </FormField>

            {/* Post to supplier + cargo flags */}
            <div className="bg-white rounded-md border border-gray-200 px-4 py-3 flex flex-wrap gap-5">
              <CheckField
                id="postToSupplier"
                label="Post to supplier"
                checked={formData.postToSupplier}
                onChange={(v) => set('postToSupplier', v)}
              />
              <CheckField
                id="isHazardous"
                label="Hazardous"
                checked={formData.isHazardous}
                onChange={(v) => set('isHazardous', v)}
              />
              <CheckField
                id="isFragile"
                label="Fragile"
                checked={formData.isFragile}
                onChange={(v) => set('isFragile', v)}
              />
              <CheckField
                id="requiresTemperatureControl"
                label="Temp Control"
                checked={formData.requiresTemperatureControl}
                onChange={(v) => set('requiresTemperatureControl', v)}
              />
            </div>
          </form>
        )}
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="max-w-lg mx-auto">
          <Button
            type="submit"
            form="create-indent-form"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-sm tracking-wide"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {activeTab === 'Direct Load'
              ? '+ CREATE LOAD'
              : activeTab === 'Direct Invoice'
                ? '+ CREATE DIRECT INVOICE'
                : '+ CREATE INDENT'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-gray-500 font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function CheckField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <Label htmlFor={id} className="text-sm cursor-pointer">
        {label}
      </Label>
    </div>
  );
}
