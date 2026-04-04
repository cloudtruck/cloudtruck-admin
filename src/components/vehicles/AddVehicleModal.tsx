'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Plus, CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { vehicleApi, driverApi, supplierApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useMasterData } from '@/hooks/useMasterData';
import { cn } from '@/lib/utils';
import type { Driver, Supplier } from '@/types';

const addVehicleSchema = z
  .object({
    vehicleNumber: z.string().min(5, 'Vehicle number must be at least 5 characters'),
    truckType: z.string().min(1, 'Truck type is required'),
    lengthValue: z.string().min(1, 'Length is required'),
    lengthUnit: z.enum(['ft', 'm']),
    heightValue: z.string().optional(),
    heightUnit: z.enum(['ft', 'm']),
    capacityValue: z.string().min(1, 'Capacity is required'),
    capacityUnit: z.enum(['kg', 'tons']),
    bodyType: z.string().min(1, 'Body type is required'),
    ownershipType: z.enum(['own', 'leased', 'attached']),
    ownerKind: z.enum(['Driver', 'Supplier']).optional(),
    ownerItem: z.string().optional(),
    insuranceExpiry: z.date(),
  })
  .superRefine((data, ctx) => {
    if (data.ownershipType === 'attached') {
      if (!data.ownerKind) {
        ctx.addIssue({ code: 'custom', path: ['ownerKind'], message: 'Select driver or supplier' });
      }
      if (!data.ownerItem) {
        ctx.addIssue({
          code: 'custom',
          path: ['ownerItem'],
          message: 'Owner is required for market trucks',
        });
      }
    }
  });

type AddVehicleFormData = z.infer<typeof addVehicleSchema>;

interface AddVehicleModalProps {
  onSuccess: () => void;
}

export function AddVehicleModal({ onSuccess }: AddVehicleModalProps) {
  const [open, setOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Fetch master data
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
      ownershipType: 'own',
      ownerKind: undefined,
      ownerItem: '',
    },
  });

  const ownershipType = form.watch('ownershipType');
  const ownerKind = form.watch('ownerKind');

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [driversRes, suppliersRes] = await Promise.all([
            driverApi.getAll({ limit: 100 }),
            supplierApi.getAll({ supplierType: 'company', limit: 100 }),
          ]);
          setDrivers(driversRes.data.data.drivers);
          setSuppliers(suppliersRes.data.data.items ?? []);
        } catch (error) {
          logger.error('Failed to fetch owners:', error);
        }
      };
      fetchData();
    }
  }, [open]);

  const onSubmit = async (data: AddVehicleFormData) => {
    try {
      await vehicleApi.create({
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
        ownershipType: data.ownershipType,
        ...(data.ownershipType === 'attached' && data.ownerKind && data.ownerItem
          ? {
              ownerRef: { kind: data.ownerKind, item: data.ownerItem },
              ...(data.ownerKind === 'Driver' ? { owner: data.ownerItem } : {}),
            }
          : {}),
        expiryDates: {
          insurance: data.insuranceExpiry.toISOString(),
        },
        status: 'active',
        availability: 'available',
      });

      toast.success('Vehicle added successfully');
      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error: unknown) {
      logger.error('Failed to add vehicle:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to add vehicle');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>Enter the vehicle details to add it to the fleet</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Number</FormLabel>
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

              {/* Ownership Type — Own / Leased / Market (Attached) */}
              <FormField
                control={form.control}
                name="ownershipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ownership</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue('ownerKind', undefined);
                        form.setValue('ownerItem', '');
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ownership" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="own">Own (Cloudtruck fleet)</SelectItem>
                        <SelectItem value="leased">Leased (finance / EMI)</SelectItem>
                        <SelectItem value="attached">Market (driver / supplier owned)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Owner sub-type + owner selector — only for Market trucks */}
              {ownershipType === 'attached' && (
                <>
                  <FormField
                    control={form.control}
                    name="ownerKind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Type</FormLabel>
                        <Select
                          onValueChange={(v) => {
                            field.onChange(v);
                            form.setValue('ownerItem', '');
                          }}
                          value={field.value ?? ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Driver or Supplier?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Driver">Driver (individual RC holder)</SelectItem>
                            <SelectItem value="Supplier">Supplier (company RC holder)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerItem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {ownerKind === 'Supplier' ? 'Supplier (RC Holder)' : 'Driver (RC Holder)'}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ''}
                          disabled={!ownerKind}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  !ownerKind
                                    ? 'Select owner type first'
                                    : ownerKind === 'Supplier'
                                      ? 'Select supplier'
                                      : 'Select driver'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ownerKind === 'Driver'
                              ? drivers.map((d) => (
                                  <SelectItem key={d._id} value={d._id}>
                                    {d.name} ({d.phone})
                                  </SelectItem>
                                ))
                              : suppliers.map((s) => (
                                  <SelectItem key={s._id} value={s._id}>
                                    {s.companyName || s.displayName}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="truckType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Truck Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                          .filter((type) => type.isActive)
                          .map((type) => (
                            <SelectItem key={type._id} value={type.key}>
                              {type.displayName}
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
                    <FormLabel>Body Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select body type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bodyTypes
                          .filter((type) => type.isActive)
                          .map((type) => (
                            <SelectItem key={type._id} value={type.key}>
                              {type.displayName}
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
                <FormLabel>Length</FormLabel>
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
                        <FormMessage />
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
                        <FormMessage />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>Capacity</FormLabel>
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
                        <FormMessage />
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
                  <FormLabel>Insurance Expiry Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
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

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding...' : 'Add Vehicle'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
