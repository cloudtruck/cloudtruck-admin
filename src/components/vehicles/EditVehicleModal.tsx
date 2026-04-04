'use client';

import { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { X, Loader2, Search } from 'lucide-react';
import { vehicleApi, driverApi, supplierApi } from '@/lib/api';
import { toast } from 'sonner';
import { useMasterData } from '@/hooks/useMasterData';
import type { Driver, Vehicle, Supplier } from '@/types';

interface EditVehicleModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onCloseAction: () => void;
  onSuccessAction: () => void;
}

interface FormState {
  truckType: string;
  bodyType: string;
  ownershipType: 'own' | 'leased' | 'attached';
  capacityValue: string;
  capacityUnit: 'tons' | 'kg';
  lengthValue: string;
  lengthUnit: 'ft' | 'm';
  registrationCity: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  ownerId: string;
  ownerType: 'driver' | 'supplier' | null;
  availability: string;
  status: string;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-800">
        {required && <span className="text-red-500 mr-1">*</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white';
const disabledInputCls =
  'w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed';
const selectCls =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white appearance-none';

export function EditVehicleModal({
  vehicle,
  isOpen,
  onCloseAction,
  onSuccessAction,
}: EditVehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerFocused, setOwnerFocused] = useState(false);
  const [ownerDisplayName, setOwnerDisplayName] = useState('');
  const ownerContainerRef = useRef<HTMLDivElement>(null);

  const { data: truckTypes, loading: truckTypesLoading } = useMasterData('truck-type');
  const { data: bodyTypes, loading: bodyTypesLoading } = useMasterData('body-type');

  const [form, setForm] = useState<FormState>({
    truckType: '',
    bodyType: '',
    ownershipType: 'own',
    capacityValue: '',
    capacityUnit: 'tons',
    lengthValue: '',
    lengthUnit: 'ft',
    registrationCity: '',
    insuranceExpiry: '',
    fitnessExpiry: '',
    ownerId: '',
    ownerType: null,
    availability: 'available',
    status: 'active',
  });

  // Close owner dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ownerContainerRef.current && !ownerContainerRef.current.contains(e.target as Node)) {
        setOwnerFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [driversRes, suppliersRes] = await Promise.all([
          driverApi.getAll({ limit: 200 }),
          supplierApi.getAll({ limit: 200 }),
        ]);
        setDrivers(driversRes.data.data.drivers);
        setSuppliers(suppliersRes.data.data.items);
      } catch (e) {
        logger.error('Failed to fetch owners:', e);
      }
    };
    fetchData();

    const insuranceExpiry = vehicle.expiryDates?.insurance
      ? vehicle.expiryDates.insurance.slice(0, 10)
      : '';
    const fitnessExpiry = vehicle.expiryDates?.fitness
      ? vehicle.expiryDates.fitness.slice(0, 10)
      : '';

    // Determine owner type and ID from vehicle
    let ownerId = '';
    let ownerType: 'driver' | 'supplier' | null = null;

    const ownerRefKind = vehicle.ownerRef?.kind;
    const ownerRefItem = vehicle.ownerRef?.item;

    if (ownerRefKind === 'Driver' && ownerRefItem) {
      ownerType = 'driver';
      ownerId = typeof ownerRefItem === 'string' ? ownerRefItem : ownerRefItem._id;
    } else if (ownerRefKind === 'Supplier' && ownerRefItem) {
      ownerType = 'supplier';
      ownerId = typeof ownerRefItem === 'string' ? ownerRefItem : ownerRefItem._id;
    } else if (vehicle.supplierOwner) {
      ownerType = 'supplier';
      ownerId =
        typeof vehicle.supplierOwner === 'string'
          ? vehicle.supplierOwner
          : (vehicle.supplierOwner as { _id: string })._id;
    } else if (vehicle.owner) {
      ownerType = 'driver';
      ownerId =
        typeof vehicle.owner === 'string' ? vehicle.owner : (vehicle.owner as { _id: string })._id;
    }

    // Resolve display name from populated ownerRef
    let initialDisplayName = '';
    if (ownerType === 'driver' && ownerRefItem && typeof ownerRefItem !== 'string') {
      const d = ownerRefItem as { name?: string; phone?: string };
      initialDisplayName = d.name ? `${d.name}${d.phone ? ` (${d.phone})` : ''}` : '';
    } else if (ownerType === 'supplier' && ownerRefItem && typeof ownerRefItem !== 'string') {
      const s = ownerRefItem as { displayName?: string; companyName?: string; phone?: string };
      initialDisplayName = s.displayName
        ? `${s.displayName}${s.companyName ? ` (${s.companyName})` : ''}${s.phone ? ` · ${s.phone}` : ''}`
        : '';
    }
    setOwnerDisplayName(initialDisplayName);
    setOwnerSearch('');
    setOwnerFocused(false);

    setForm({
      truckType: vehicle.truckType || '',
      bodyType: vehicle.bodyType || '',
      ownershipType: (vehicle.ownershipType as 'own' | 'leased' | 'attached') || 'own',
      capacityValue: vehicle.capacity.value.toString(),
      capacityUnit: vehicle.capacity.unit === 'kg' ? 'kg' : 'tons',
      lengthValue: vehicle.length.value.toString(),
      lengthUnit: vehicle.length.unit === 'meter' ? 'm' : 'ft',
      registrationCity: vehicle.registrationCity || '',
      insuranceExpiry,
      fitnessExpiry,
      ownerId,
      ownerType,
      availability: vehicle.availability || 'available',
      status: vehicle.status || 'active',
    });
  }, [isOpen, vehicle]);

  const set =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Combined owner results: drivers tagged with type, suppliers tagged with type
  type OwnerOption = { id: string; type: 'driver' | 'supplier'; label: string; sub: string };

  const ownerOptions: OwnerOption[] = [
    ...drivers.map((d) => ({
      id: d._id,
      type: 'driver' as const,
      label: d.name,
      sub: d.phone || '',
    })),
    ...suppliers.map((s) => ({
      id: s._id,
      type: 'supplier' as const,
      label: s.displayName,
      sub: [s.companyName, s.phone].filter(Boolean).join(' · '),
    })),
  ];

  const filteredOwners = ownerSearch.trim()
    ? ownerOptions.filter(
        (o) =>
          o.label.toLowerCase().includes(ownerSearch.toLowerCase()) ||
          o.sub.toLowerCase().includes(ownerSearch.toLowerCase())
      )
    : ownerOptions;

  const handleOwnerSelect = (opt: OwnerOption) => {
    setForm((prev) => ({ ...prev, ownerId: opt.id, ownerType: opt.type }));
    setOwnerDisplayName(`${opt.label}${opt.sub ? ` · ${opt.sub}` : ''}`);
    setOwnerSearch('');
    setOwnerFocused(false);
  };

  const handleOwnerClear = () => {
    setForm((prev) => ({ ...prev, ownerId: '', ownerType: null }));
    setOwnerDisplayName('');
    setOwnerSearch('');
    setOwnerFocused(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.truckType) {
      toast.error('Truck Type is required');
      return;
    }
    setLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        truckType: form.truckType,
        bodyType: form.bodyType || undefined,
        ownershipType: form.ownershipType,
        capacity: { value: parseFloat(form.capacityValue), unit: form.capacityUnit },
        length: {
          value: parseFloat(form.lengthValue),
          unit: form.lengthUnit === 'm' ? 'meter' : 'ft',
        },
        registrationCity: form.registrationCity || undefined,
        expiryDates: {
          insurance: form.insuranceExpiry || undefined,
          fitness: form.fitnessExpiry || undefined,
        },
        availability: form.availability as Vehicle['availability'],
        status: form.status as Vehicle['status'],
      };

      // Set owner based on type
      if (form.ownerType === 'driver' && form.ownerId) {
        updateData.owner = form.ownerId;
        updateData.ownerRef = { kind: 'Driver', item: form.ownerId };
      } else if (form.ownerType === 'supplier' && form.ownerId) {
        updateData.supplierOwner = form.ownerId;
        updateData.ownerRef = { kind: 'Supplier', item: form.ownerId };
      } else {
        // Clear owner if none selected
        updateData.owner = undefined;
        updateData.supplierOwner = undefined;
        updateData.ownerRef = undefined;
      }

      await vehicleApi.update(vehicle._id, updateData);
      toast.success('Vehicle updated successfully');
      onSuccessAction();
      onCloseAction();
    } catch (error: unknown) {
      logger.error('Failed to update vehicle:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCloseAction} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Edit Truck</h2>
          <button onClick={onCloseAction} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="flex flex-col gap-5 px-6 py-5">
            {/* Truck No — read-only */}
            <Field label="Truck No" required>
              <input className={disabledInputCls} value={vehicle.vehicleNumber} readOnly />
            </Field>

            {/* Truck Type */}
            <Field label="Truck Type" required>
              <div className="relative">
                <select
                  className={selectCls}
                  value={form.truckType}
                  onChange={set('truckType')}
                  disabled={truckTypesLoading}
                >
                  <option value="">Select truck type</option>
                  {truckTypes
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <option key={t._id} value={t.key}>
                        {t.displayName}
                      </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  &#8964;
                </span>
              </div>
            </Field>

            {/* Truck Sub Type (bodyType) */}
            <Field label="Truck Sub Type">
              <div className="relative">
                <select
                  className={selectCls}
                  value={form.bodyType}
                  onChange={set('bodyType')}
                  disabled={bodyTypesLoading}
                >
                  <option value="">Select truck sub type</option>
                  {bodyTypes
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <option key={t._id} value={t.key}>
                        {t.displayName}
                      </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  &#8964;
                </span>
              </div>
            </Field>

            {/* Ownership */}
            <Field label="Ownership">
              <div className="relative">
                <select
                  className={selectCls}
                  value={form.ownershipType}
                  onChange={(e) => {
                    set('ownershipType')(e);
                    // Clear owner when switching away from attached
                    if (e.target.value !== 'attached') {
                      handleOwnerClear();
                    }
                  }}
                >
                  <option value="own">Own (Cloudtruck fleet)</option>
                  <option value="leased">Leased (finance / EMI)</option>
                  <option value="attached">Market (driver / supplier owned)</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  &#8964;
                </span>
              </div>
            </Field>

            {/* Owner — only shown for Market (attached) trucks */}
            {form.ownershipType === 'attached' && (
              <Field label="Owner">
                <div className="relative" ref={ownerContainerRef}>
                  {/* Selected owner chip */}
                  {form.ownerId && ownerDisplayName ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-blue-50">
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 shrink-0">
                        {form.ownerType === 'driver' ? 'Driver' : 'Supplier'}
                      </span>
                      <span className="flex-1 text-sm text-gray-800 truncate">
                        {ownerDisplayName}
                      </span>
                      <button
                        type="button"
                        onClick={handleOwnerClear}
                        className="text-gray-400 hover:text-gray-600 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search drivers or suppliers…"
                        value={ownerSearch}
                        onChange={(e) => {
                          setOwnerSearch(e.target.value);
                          setOwnerFocused(true);
                        }}
                        onFocus={() => setOwnerFocused(true)}
                        onClick={() => setOwnerFocused(true)}
                        className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Dropdown list */}
                  {ownerFocused && !form.ownerId && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
                      {filteredOwners.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">No results</div>
                      ) : (
                        filteredOwners.map((opt) => (
                          <button
                            key={`${opt.type}-${opt.id}`}
                            type="button"
                            onMouseDown={() => handleOwnerSelect(opt)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                          >
                            <span
                              className={`text-xs font-semibold uppercase tracking-wide shrink-0 ${
                                opt.type === 'driver' ? 'text-blue-500' : 'text-purple-500'
                              }`}
                            >
                              {opt.type === 'driver' ? 'D' : 'S'}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm text-gray-900 truncate">
                                {opt.label}
                              </span>
                              {opt.sub && (
                                <span className="block text-xs text-gray-400 truncate">
                                  {opt.sub}
                                </span>
                              )}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Field>
            )}

            {/* Capacity */}
            <Field label="Capacity">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className={inputCls}
                  value={form.capacityValue}
                  onChange={set('capacityValue')}
                  placeholder="e.g. 10"
                />
                <div className="relative w-24 shrink-0">
                  <select
                    className={selectCls}
                    value={form.capacityUnit}
                    onChange={set('capacityUnit')}
                  >
                    <option value="tons">Tons</option>
                    <option value="kg">kg</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    &#8964;
                  </span>
                </div>
              </div>
            </Field>

            {/* Length */}
            <Field label="Length">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className={inputCls}
                  value={form.lengthValue}
                  onChange={set('lengthValue')}
                  placeholder="e.g. 32"
                />
                <div className="relative w-24 shrink-0">
                  <select
                    className={selectCls}
                    value={form.lengthUnit}
                    onChange={set('lengthUnit')}
                  >
                    <option value="ft">ft</option>
                    <option value="m">m</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    &#8964;
                  </span>
                </div>
              </div>
            </Field>

            {/* Registration City */}
            <Field label="Registration City">
              <input
                className={inputCls}
                value={form.registrationCity}
                onChange={set('registrationCity')}
                placeholder="e.g. Ahmedabad"
              />
            </Field>

            {/* Insurance Expiry */}
            <Field label="Insurance Expiry">
              <input
                type="date"
                className={inputCls}
                value={form.insuranceExpiry}
                onChange={set('insuranceExpiry')}
              />
            </Field>

            {/* Fitness Expiry */}
            <Field label="Fitness Expiry">
              <input
                type="date"
                className={inputCls}
                value={form.fitnessExpiry}
                onChange={set('fitnessExpiry')}
              />
            </Field>

            {/* Availability */}
            <Field label="Availability">
              <div className="relative">
                <select
                  className={selectCls}
                  value={form.availability}
                  onChange={set('availability')}
                >
                  <option value="available">Available</option>
                  <option value="on-trip">On Trip</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  &#8964;
                </span>
              </div>
            </Field>

            {/* Status */}
            <Field label="Status">
              <div className="relative">
                <select className={selectCls} value={form.status} onChange={set('status')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="under-maintenance">Under Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  &#8964;
                </span>
              </div>
            </Field>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
            <button
              type="button"
              onClick={onCloseAction}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-md flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
