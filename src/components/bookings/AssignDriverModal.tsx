'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { driverApi, vehicleApi, bookingApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Driver, Vehicle, Booking } from '@/types';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignDriverModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  booking: Booking;
  onSuccessAction: () => void;
}

export function AssignDriverModal({
  isOpen,
  onCloseAction,
  booking,
  onSuccessAction,
}: AssignDriverModalProps) {
  const [loading, setLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      setDriversLoading(true);
      // We can filter by truck type and prioritize return trip candidates
      const response = await driverApi.getAvailable({
        truckType: booking.truckTypeNeeded,
        matchPickupCity: booking.pickup.city,
      });
      setDrivers(response.data.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch available drivers');
    } finally {
      setDriversLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.truckTypeNeeded]);

  const fetchVehicles = useCallback(async (driverId: string) => {
    try {
      setVehiclesLoading(true);
      const response = await vehicleApi.getByDriver(driverId);
      setVehicles(response.data.data);
      
      // Auto-select if only one vehicle
      if (response.data.data.length === 1) {
        setSelectedVehicleId(response.data.data[0]._id);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch driver vehicles');
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
    } else {
      // Reset state when closing
      setSelectedDriverId('');
      setSelectedVehicleId('');
      setVehicles([]);
      setNotes('');
      setSearchQuery('');
      setOpen(false);
    }
  }, [isOpen, fetchDrivers]);

  useEffect(() => {
    if (selectedDriverId) {
      fetchVehicles(selectedDriverId);
    } else {
      setVehicles([]);
      setSelectedVehicleId('');
    }
  }, [selectedDriverId, fetchVehicles]);

  const handleAssign = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      toast.error('Please select both a driver and a vehicle');
      return;
    }

    try {
      setLoading(true);
      await bookingApi.assignDriver(booking._id, {
        driverId: selectedDriverId,
        vehicleId: selectedVehicleId,
        notes,
      });
      toast.success('Driver assigned successfully');
      onSuccessAction();
      onCloseAction();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to assign driver');
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone?.includes(searchQuery)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Driver & Vehicle</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="driver">Select Driver</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between font-normal"
                  disabled={driversLoading}
                >
                  {selectedDriverId
                    ? drivers.find((driver) => driver._id === selectedDriverId)?.name
                    : driversLoading 
                      ? "Loading drivers..." 
                      : "Select a driver"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <input
                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Search driver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="p-1">
                    {filteredDrivers.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No available drivers found
                      </div>
                    ) : (
                      filteredDrivers.map((driver) => (
                        <div
                          key={driver._id}
                          className={cn(
                            "relative flex cursor-default select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
                            selectedDriverId === driver._id && "bg-accent text-accent-foreground"
                          )}
                          onClick={() => {
                            setSelectedDriverId(driver._id);
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDriverId === driver._id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{driver.name}</span>
                              <span className="text-xs text-muted-foreground">{driver.phone}</span>
                            </div>
                          </div>
                          {driver.isReturnTrip && (
                            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                              Return
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle">Select Vehicle</Label>
            <Select
              value={selectedVehicleId}
              onValueChange={setSelectedVehicleId}
              disabled={!selectedDriverId || vehiclesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedDriverId 
                    ? "Select a driver first" 
                    : vehiclesLoading 
                      ? "Loading vehicles..." 
                      : "Select a vehicle"
                } />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No vehicles found for this driver
                  </div>
                ) : (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.vehicleNumber} - {vehicle.truckType}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Assignment Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any specific instructions for the driver..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCloseAction} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading || !selectedDriverId || !selectedVehicleId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Driver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
