'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { vehicleApi, driverApi } from '@/lib/api';
import { toast } from 'sonner';
import { TRUCK_TYPES, BODY_TYPES } from '@/lib/constants';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Driver, Vehicle } from '@/types';

const editVehicleSchema = z.object({
  vehicleNumber: z.string().min(5, 'Vehicle number must be at least 5 characters'),
  truckType: z.string().min(1, 'Truck type is required'),
  lengthValue: z.string().min(1, 'Length is required'),
  lengthUnit: z.enum(['ft', 'm']),
  capacityValue: z.string().min(1, 'Capacity is required'),
  capacityUnit: z.enum(['kg', 'tons']),
  bodyType: z.enum(['open', 'closed', 'container']),
  owner: z.string().min(1, 'Owner is required'),
  insuranceExpiry: z.date().optional(),
  fitnessExpiry: z.date().optional(),
  status: z.enum(['active', 'inactive', 'under-maintenance', 'retired']),
});

type EditVehicleFormData = z.infer<typeof editVehicleSchema>;

interface EditVehicleModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onCloseAction: () => void;
  onSuccessAction: () => void;
}

export function EditVehicleModal({ vehicle, isOpen, onCloseAction, onSuccessAction }: EditVehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const form = useForm<EditVehicleFormData>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: {
      vehicleNumber: '',
      truckType: '',
      lengthValue: '',
      lengthUnit: 'ft',
      capacityValue: '',
      capacityUnit: 'tons',
      bodyType: 'closed',
      owner: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchDrivers = async () => {
        try {
          const response = await driverApi.getAll({ limit: 100 });
          setDrivers(response.data.data.drivers);
        } catch (error) {
          console.error('Failed to fetch drivers:', error);
        }
      };
      fetchDrivers();

      // Reset form with vehicle data
      if (vehicle) {
        form.reset({
          vehicleNumber: vehicle.vehicleNumber,
          truckType: vehicle.truckType,
          lengthValue: vehicle.length.value.toString(),
          lengthUnit: vehicle.length.unit === 'meter' ? 'm' : 'ft',
          capacityValue: vehicle.capacity.value.toString(),
          capacityUnit: vehicle.capacity.unit === 'kg' ? 'kg' : 'tons',
          bodyType: vehicle.bodyType,
          owner: typeof vehicle.owner === 'string' ? vehicle.owner : vehicle.owner?._id || '',
          insuranceExpiry: vehicle.expiryDates?.insurance ? new Date(vehicle.expiryDates.insurance) : undefined,
          fitnessExpiry: vehicle.expiryDates?.fitness ? new Date(vehicle.expiryDates.fitness) : undefined,
          status: vehicle.status,
        });
      }
    }
  }, [isOpen, vehicle, form]);

  const onSubmit = async (data: EditVehicleFormData) => {
    setLoading(true);
    try {
      await vehicleApi.update(vehicle._id, {
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        truckType: data.truckType,
        length: {
          value: parseFloat(data.lengthValue),
          unit: data.lengthUnit === 'm' ? 'meter' : 'ft',
        },
        capacity: {
          value: parseFloat(data.capacityValue),
          unit: data.capacityUnit,
        },
        bodyType: data.bodyType,
        owner: data.owner,
        expiryDates: {
          insurance: data.insuranceExpiry?.toISOString(),
          fitness: data.fitnessExpiry?.toISOString(),
        },
        status: data.status,
      });

      toast.success('Vehicle updated successfully');
      onSuccessAction();
      onCloseAction();
    } catch (error: unknown) {
      console.error('Failed to update vehicle:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update the vehicle details below
          </DialogDescription>
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

              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner (Driver)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drivers.map((driver) => (
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="truckType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Truck Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRUCK_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select body type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BODY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
              <div className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name="lengthValue"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Length</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lengthUnit"
                  render={({ field }) => (
                    <FormItem className="w-20">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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

              <div className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name="capacityValue"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacityUnit"
                  render={({ field }) => (
                    <FormItem className="w-[100px]">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tons">Tons</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="under-maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insuranceExpiry"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Insurance Expiry</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCloseAction}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
