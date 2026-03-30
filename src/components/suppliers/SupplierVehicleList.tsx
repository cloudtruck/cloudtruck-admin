'use client';

import { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Trash2, Loader2, CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supplierApi, vehicleApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useMasterData } from '@/hooks/useMasterData';
import { cn } from '@/lib/utils';
import type { Vehicle, Driver, ApiErrorResponse } from '@/types';

const addVehicleSchema = z.object({
  vehicleNumber: z.string().min(5, 'Vehicle number must be at least 5 characters'),
  truckType: z.string().min(1, 'Truck type is required'),
  lengthValue: z.string().min(1, 'Length is required'),
  lengthUnit: z.enum(['ft', 'm']),
  heightValue: z.string().optional(),
  heightUnit: z.enum(['ft', 'm']),
  capacityValue: z.string().min(1, 'Capacity is required'),
  capacityUnit: z.enum(['kg', 'tons']),
  bodyType: z.string().min(1, 'Body type is required'),
  ownerKind: z.enum(['Driver', 'Supplier']),
  ownerItem: z.string().min(1, 'Owner is required'),
  insuranceExpiry: z.date(),
});

type AddVehicleFormData = z.infer<typeof addVehicleSchema>;

interface SupplierVehicleListProps {
  supplierId: string;
  onSuccess?: () => void;
}

export function SupplierVehicleList({ supplierId, onSuccess }: SupplierVehicleListProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fleetDrivers, setFleetDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: truckTypes, loading: truckTypesLoading } = useMasterData('truck-type');
  const { data: bodyTypes } = useMasterData('body-type');

  const form = useForm<AddVehicleFormData>({
    resolver: zodResolver(addVehicleSchema),
    defaultValues: {
      vehicleNumber: '',
      truckType: '',
      lengthValue: '',
      lengthUnit: 'ft',
      heightValue: '',
      heightUnit: 'ft',
      capacityValue: '',
      capacityUnit: 'tons',
      bodyType: '',
      ownerKind: 'Supplier' as const,
      ownerItem: supplierId,
    },
  });

  const ownerKind = form.watch('ownerKind');

  useEffect(() => {
    if (addDialogOpen) {
      form.setValue('ownerKind', 'Supplier');
      form.setValue('ownerItem', supplierId);
    }
  }, [addDialogOpen, supplierId, form]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplierApi.getFleetVehicles(supplierId);
      setVehicles(res.data.data.items ?? []);
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to fetch fleet vehicles');
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  const fetchFleetDrivers = useCallback(async () => {
    try {
      const res = await supplierApi.getFleetDrivers(supplierId, { limit: 100 });
      setFleetDrivers(res.data.data.items ?? []);
    } catch {
      // non-fatal
    }
  }, [supplierId]);

  useEffect(() => {
    fetchVehicles();
    fetchFleetDrivers();
  }, [fetchVehicles, fetchFleetDrivers]);

  const onSubmit = async (data: AddVehicleFormData) => {
    try {
      // Step 1: Create vehicle with the selected fleet driver as owner
      const createRes = await vehicleApi.create({
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        truckType: data.truckType,
        length: {
          value: parseFloat(data.lengthValue),
          unit: data.lengthUnit === 'm' ? 'meter' : 'ft',
        },
        ...(data.heightValue && {
          height: {
            value: parseFloat(data.heightValue),
            unit: data.heightUnit === 'm' ? 'meter' : 'ft',
          },
        }),
        capacity: {
          value: parseFloat(data.capacityValue),
          unit: data.capacityUnit,
        },
        bodyType: data.bodyType,
        ownerRef: { kind: data.ownerKind, item: data.ownerItem },
        ...(data.ownerKind === 'Driver' ? { owner: data.ownerItem } : {}),
        expiryDates: {
          insurance: data.insuranceExpiry.toISOString(),
        },
        status: 'active',
        availability: 'available',
      });

      const newVehicleId: string = createRes.data.data._id;

      // Step 2: Assign to supplier fleet
      await supplierApi.addVehicle(supplierId, newVehicleId);

      toast.success('Vehicle created and added to fleet');
      form.reset();
      setAddDialogOpen(false);
      await fetchVehicles();
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const handleRemoveVehicle = async (vid: string) => {
    if (!window.confirm('Remove this vehicle from the fleet?')) return;
    setRemovingId(vid);
    try {
      await supplierApi.removeVehicle(supplierId, vid);
      toast.success('Vehicle removed from fleet');
      await fetchVehicles();
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as ApiErrorResponse;
      toast.error(e.response?.data?.message || 'Failed to remove vehicle');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fleet Vehicles ({vehicles.length})</CardTitle>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Vehicle
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No vehicles in fleet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-lg">{vehicle.vehicleNumber}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.truckType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          vehicle.availability === 'available'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : vehicle.availability === 'on-trip'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                        }
                      >
                        {vehicle.availability}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={removingId === vehicle._id}
                        onClick={() => handleRemoveVehicle(vehicle._id)}
                      >
                        {removingId === vehicle._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>
                      Length: {vehicle.length?.value} {vehicle.length?.unit}
                    </span>
                    <span>
                      Capacity: {vehicle.capacity?.value} {vehicle.capacity?.unit}
                    </span>
                    {vehicle.bodyType && <span>Body: {vehicle.bodyType}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={addDialogOpen}
        onOpenChange={(v) => {
          if (!v) {
            form.reset();
            setAddDialogOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Vehicle to Fleet</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DL01AB1234"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerKind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ownership Type *</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue('ownerItem', v === 'Supplier' ? supplierId : '');
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Supplier">
                            Company Owned (Supplier holds RC)
                          </SelectItem>
                          <SelectItem value="Driver">Driver Owned (Driver holds RC)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {ownerKind === 'Driver' && (
                  <FormField
                    control={form.control}
                    name="ownerItem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RC Holder (Fleet Driver) *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  fleetDrivers.length === 0
                                    ? 'Add fleet drivers first'
                                    : 'Select driver'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fleetDrivers.map((driver) => (
                              <SelectItem key={driver._id} value={driver._id}>
                                {driver.name} ({driver.phone})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="truckType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Truck Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={truckTypesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={truckTypesLoading ? 'Loading...' : 'Select truck type'}
                            />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bodyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select body type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bodyTypes
                            .filter((t) => t.isActive)
                            .map((t) => (
                              <SelectItem key={t._id} value={t.key}>
                                {t.displayName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel>Length *</FormLabel>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="lengthValue"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lengthUnit"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ft">ft</SelectItem>
                              <SelectItem value="m">m</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Height (optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="heightValue"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="7.5" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="heightUnit"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ft">ft</SelectItem>
                              <SelectItem value="m">m</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Capacity *</FormLabel>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="capacityValue"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="capacityUnit"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="tons">tons</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="insuranceExpiry"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Insurance Expiry Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setAddDialogOpen(false);
                  }}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create & Add to Fleet
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
