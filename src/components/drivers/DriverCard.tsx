'use client';

import Link from 'next/link';
import { Phone, Truck, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DriverStatusBadge } from './DriverStatusBadge';
import type { Driver } from '@/types';
import { formatDistance } from 'date-fns';

interface DriverCardProps {
  driver: Driver;
}

export function DriverCard({ driver }: DriverCardProps) {
  const initials = driver.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={driver.profilePhoto} alt={driver.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-base">{driver.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {driver.phone}
            </p>
          </div>
        </div>
        <DriverStatusBadge status={driver.status} />
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>
              {driver.totalTrips || 0} trip{driver.totalTrips !== 1 ? 's' : ''}
            </span>
          </div>
          {driver.lastActive && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDistance(new Date(driver.lastActive), new Date(), { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {driver.preferredTruckTypes && driver.preferredTruckTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {driver.preferredTruckTypes.slice(0, 3).map((type) => (
              <span
                key={type}
                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
              >
                {type}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/drivers/${driver._id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
