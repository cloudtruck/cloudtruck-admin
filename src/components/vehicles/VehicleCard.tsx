'use client';

import Link from 'next/link';
import { Truck, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { VehicleActions } from './VehicleActions';
import type { Vehicle } from '@/types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSuccess?: () => void;
}

export function VehicleCard({ vehicle, onSuccess }: VehicleCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{vehicle.vehicleNumber}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              {typeof vehicle.owner === 'object' && vehicle.owner?.name ? vehicle.owner.name : 'No owner'}
            </p>
          </div>
        </div>
        <VehicleStatusBadge status={vehicle.isVerified ? 'verified' : 'pending'} />
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>{vehicle.truckType}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{vehicle.capacity.value}{vehicle.capacity.unit}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {vehicle.bodyType}
          </Badge>
          {vehicle.hasGPS && (
            <Badge variant="secondary" className="text-xs">
              GPS
            </Badge>
          )}
          {vehicle.hasFASTag && (
            <Badge variant="secondary" className="text-xs">
              FASTag
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/vehicles/${vehicle._id}`}>View Details</Link>
          </Button>
          <VehicleActions vehicle={vehicle} onSuccessAction={onSuccess} />
        </div>
      </CardContent>
    </Card>
  );
}