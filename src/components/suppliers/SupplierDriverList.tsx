'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, UserMinus, UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supplierApi, driverApi } from '@/lib/api';
import { toast } from 'sonner';
import { useMasterData } from '@/hooks/useMasterData';
import type { Driver, ApiErrorResponse } from '@/types';

interface SupplierDriverListProps {
  supplierId: string;
}

interface DriverForm {
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  aadhaarNumber: string;
  panNumber: string;
  preferredTruckTypes: string[];
}

const emptyForm: DriverForm = {
  name: '',
  phone: '',
  email: '',
  licenseNumber: '',
  licenseExpiry: '',
  aadhaarNumber: '',
  panNumber: '',
  preferredTruckTypes: [],
};

export function SupplierDriverList({ supplierId }: SupplierDriverListProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [form, setForm] = useState<DriverForm>(emptyForm);

  const { data: truckTypes, loading: truckTypesLoading } = useMasterData('truck-type');

  const set = (key: keyof DriverForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleTruckType = (key: string) =>
    setForm((prev) => ({
      ...prev,
      preferredTruckTypes: prev.preferredTruckTypes.includes(key)
        ? prev.preferredTruckTypes.filter((t) => t !== key)
        : [...prev.preferredTruckTypes, key],
    }));

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await supplierApi.getFleetDrivers(supplierId);
      setDrivers(res.data.data.items ?? []);
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to fetch fleet drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.licenseNumber.trim() ||
      !form.licenseExpiry
    ) {
      toast.error('Name, phone, license number and expiry are required');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create driver
      const createRes = await driverApi.create({
        name: form.name.trim(),
        licenseNumber: form.licenseNumber.trim(),
        licenseExpiry: new Date(form.licenseExpiry).toISOString(),
        aadhaarNumber: form.aadhaarNumber.trim() || undefined,
        panNumber: form.panNumber.trim() || undefined,
        preferredTruckTypes: form.preferredTruckTypes,
        newUser: {
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          password: 'Cloudtruck@123',
        },
      } as unknown as Partial<Driver>);

      const newDriverId: string = createRes.data.data._id;

      // Step 2: Add to supplier fleet
      await supplierApi.addDriver(supplierId, newDriverId);

      toast.success('Driver created and added to fleet');
      setAddOpen(false);
      setForm(emptyForm);
      await fetchDrivers();
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to create driver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDriver = async (driverId: string) => {
    if (!window.confirm('Remove this driver from the fleet?')) return;
    setRemovingId(driverId);
    try {
      await supplierApi.removeDriver(supplierId, driverId);
      toast.success('Driver removed from fleet');
      await fetchDrivers();
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to remove driver');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Fleet Drivers ({drivers.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Driver
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No drivers in fleet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {drivers.map((driver) => (
                <div
                  key={driver._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex flex-col">
                    <Link
                      href={`/drivers/${driver._id}`}
                      className="font-medium text-sm hover:underline text-blue-600"
                    >
                      {driver.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        driver.status === 'available'
                          ? 'bg-green-100 text-green-700'
                          : driver.status === 'on-trip'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                      }
                    >
                      {driver.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveDriver(driver._id)}
                      disabled={removingId === driver._id}
                    >
                      {removingId === driver._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={(v) => !v && setAddOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Driver to Fleet</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+919876543210"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) => set('licenseNumber', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">License Expiry *</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) => set('licenseExpiry', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber">Aadhaar Number (Optional)</Label>
                <Input
                  id="aadhaarNumber"
                  value={form.aadhaarNumber}
                  onChange={(e) => set('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                  maxLength={12}
                  placeholder="12 digits"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number (Optional)</Label>
                <Input
                  id="panNumber"
                  value={form.panNumber}
                  onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
                  maxLength={10}
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preferred Truck Types</Label>
              {truckTypesLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {truckTypes
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <Button
                        key={t._id}
                        type="button"
                        variant={form.preferredTruckTypes.includes(t.key) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleTruckType(t.key)}
                      >
                        {t.displayName}
                      </Button>
                    ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create & Add to Fleet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
