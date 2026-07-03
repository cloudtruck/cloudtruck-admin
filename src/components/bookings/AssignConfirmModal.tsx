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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { driverApi, vehicleApi, supplierApi, bookingApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Truck, User, MapPin } from 'lucide-react';
import type { Booking } from '@/types';
import type { SupplierAvailableDriver } from '@/types/supplier.types';

/** Minimal shape of a matched vehicle row passed from MatchedTrucksModal */
export interface MatchedVehicle {
  _id: string;
  vehicleNumber: string;
  truckType?: string;
  /** ownerRef from the vehicle document */
  ownerRef?: { kind: 'Driver' | 'Supplier'; item: string } | null;
  /** supplierOwner id if vehicle belongs to a supplier */
  supplierOwner?: string | null;
  /** For unloading trucks, the driver currently on the trip */
  driver?: {
    _id: string;
    name: string;
    phone: string;
    supplierOwner?: string | null;
    driverRole?: string;
  } | null;
  /** Driver currently operating this truck (own/leased trucks, independent of legal ownership) */
  currentDriver?: { _id: string; name: string; phone: string } | string | null;
}

interface AssignConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  indent: Booking;
  vehicle: MatchedVehicle;
  onAssigned: () => void;
}

export function AssignConfirmModal({
  isOpen,
  onClose,
  indent,
  vehicle,
  onAssigned,
}: AssignConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingDriver, setFetchingDriver] = useState(false);
  const [fetchingSupplierDrivers, setFetchingSupplierDrivers] = useState(false);

  // Individual driver flow
  const [autoDriver, setAutoDriver] = useState<{ _id: string; name: string; phone: string } | null>(
    null
  );

  // Supplier flow
  const [availableDrivers, setAvailableDrivers] = useState<SupplierAvailableDriver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  /** Derive whether this is a supplier-owned vehicle */
  const isSupplierOwned =
    vehicle.ownerRef?.kind === 'Supplier' ||
    (!!vehicle.supplierOwner && vehicle.supplierOwner !== null) ||
    // For unloading trucks where driver.supplierOwner is set
    (vehicle.driver?.supplierOwner != null && vehicle.driver.driverRole === 'employee');

  /** The supplier id to fetch available drivers from */
  const supplierId: string | null = isSupplierOwned
    ? vehicle.ownerRef?.kind === 'Supplier'
      ? vehicle.ownerRef.item
      : vehicle.supplierOwner || vehicle.driver?.supplierOwner || null
    : null;

  useEffect(() => {
    if (!isOpen) {
      setAutoDriver(null);
      setAvailableDrivers([]);
      setSelectedDriverId('');
      return;
    }

    if (isSupplierOwned && supplierId) {
      // Supplier flow: fetch available drivers of that supplier
      setFetchingSupplierDrivers(true);
      supplierApi
        .getAvailableDrivers(supplierId)
        .then((res) => setAvailableDrivers(res.data.data))
        .catch(() => toast.error('Failed to fetch available drivers'))
        .finally(() => setFetchingSupplierDrivers(false));
    } else {
      // Individual driver flow: resolve driver from ownerRef, unloading truck driver,
      // or currentDriver (own/leased trucks assigned to a driver without owning it)
      const currentDriverId =
        typeof vehicle.currentDriver === 'string'
          ? vehicle.currentDriver
          : vehicle.currentDriver?._id;
      const driverId =
        (vehicle.ownerRef?.kind === 'Driver' ? vehicle.ownerRef.item : null) ||
        vehicle.driver?._id ||
        currentDriverId ||
        null;

      if (driverId) {
        setFetchingDriver(true);
        driverApi
          .getById(driverId)
          .then((res) => {
            const d = res.data.data;
            setAutoDriver({ _id: d._id, name: d.name, phone: d.phone });
          })
          .catch(() => toast.error('Failed to fetch driver details'))
          .finally(() => setFetchingDriver(false));
      } else if (vehicle.driver) {
        // Already have driver info from unloading truck
        setAutoDriver({
          _id: vehicle.driver._id,
          name: vehicle.driver.name,
          phone: vehicle.driver.phone,
        });
      } else if (vehicle.currentDriver && typeof vehicle.currentDriver !== 'string') {
        // Already have populated driver info from currentDriver
        setAutoDriver({
          _id: vehicle.currentDriver._id,
          name: vehicle.currentDriver.name,
          phone: vehicle.currentDriver.phone,
        });
      }
    }
  }, [
    isOpen,
    isSupplierOwned,
    supplierId,
    vehicle.ownerRef,
    vehicle.driver,
    vehicle.currentDriver,
  ]);

  const handleConfirm = async () => {
    const driverId = isSupplierOwned ? selectedDriverId : autoDriver?._id;

    if (!driverId) {
      toast.error(isSupplierOwned ? 'Please select a driver' : 'Driver not found');
      return;
    }

    try {
      setLoading(true);
      await bookingApi.assignDriver(indent._id, {
        driverId,
        vehicleId: vehicle._id,
      });
      toast.success('Assigned successfully');
      onAssigned();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const canConfirm = isSupplierOwned ? !!selectedDriverId : !!autoDriver;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Confirm Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Truck info */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Truck className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="font-medium">{vehicle.vehicleNumber}</span>
              {vehicle.truckType && (
                <span className="text-gray-400 text-xs">({vehicle.truckType})</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                {indent.pickup?.city || '—'} → {indent.drop?.city || '—'}
              </span>
            </div>
            <div className="text-xs text-gray-400">Indent: {indent.bookingId || indent._id}</div>
          </div>

          {/* Driver section */}
          {isSupplierOwned ? (
            <div className="space-y-1.5">
              <Label>Select Available Driver</Label>
              {fetchingSupplierDrivers ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available drivers…
                </div>
              ) : (
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.length === 0 ? (
                      <div className="p-3 text-sm text-center text-muted-foreground">
                        No available drivers for this supplier
                      </div>
                    ) : (
                      availableDrivers.map((d) => (
                        <SelectItem key={d._id} value={d._id}>
                          <div className="flex flex-col">
                            <span>{d.name}</span>
                            <span className="text-xs text-muted-foreground">{d.phone}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
              <div className="text-xs text-gray-400 mb-1 uppercase font-semibold tracking-wide">
                Driver
              </div>
              {fetchingDriver ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading…
                </div>
              ) : autoDriver ? (
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <div className="font-medium">{autoDriver.name}</div>
                    <div className="text-xs text-gray-500">{autoDriver.phone}</div>
                  </div>
                </div>
              ) : (
                <span className="text-gray-400 italic">Driver not found</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !canConfirm}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
