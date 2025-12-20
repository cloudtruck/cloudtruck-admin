'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { vehicleApi } from '@/lib/api';
import { toast } from 'sonner';
import { TRUCK_TYPES, BODY_TYPES } from '@/lib/constants';

const addVehicleSchema = z.object({
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  truckType: z.string().min(1, 'Truck type is required'),
  lengthValue: z.string().min(1, 'Length is required'),
  lengthUnit: z.enum(['ft', 'm']),
  capacityValue: z.string().min(1, 'Capacity is required'),
  capacityUnit: z.enum(['kg', 'tons']),
  bodyType: z.enum(['open', 'closed', 'container']),
});

type AddVehicleFormData = z.infer<typeof addVehicleSchema>;

interface AddVehicleModalProps {
  onSuccess: () => void;
}

export function AddVehicleModal({ onSuccess }: AddVehicleModalProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<AddVehicleFormData>({
    resolver: zodResolver(addVehicleSchema),
    defaultValues: {
      vehicleNumber: '',
      truckType: '',
      lengthValue: '',
      lengthUnit: 'ft',
      capacityValue: '',
      capacityUnit: 'tons',
      bodyType: 'closed',
    },
  });

  const onSubmit = async (data: AddVehicleFormData) => {
    try {
      await vehicleApi.create({
        vehicleNumber: data.vehicleNumber.toUpperCase(),
        truckType: data.truckType,
        length: {
          value: parseFloat(data.lengthValue),
          unit: data.lengthUnit,
        },
        capacity: {
          value: parseFloat(data.capacityValue),
          unit: data.capacityUnit,
        },
        bodyType: data.bodyType,
        status: 'available',
      });

      toast.success('Vehicle added successfully');
      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error: unknown) {
      console.error('Failed to add vehicle:', error);
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
          <DialogDescription>
            Enter the vehicle details to add it to the fleet
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="truckType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Truck Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select truck type" />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
