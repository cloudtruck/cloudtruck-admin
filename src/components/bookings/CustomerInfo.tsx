'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types';
import { Building2, User, Phone, MapPin } from 'lucide-react';

interface CustomerInfoProps {
  booking: Booking;
}

export function CustomerInfo({ booking }: CustomerInfoProps) {
  const { customer } = booking;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Company Name</p>
          <p className="text-lg font-semibold">{customer.companyName}</p>
        </div>

        {customer.contactPerson && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
              <p className="font-medium">{customer.contactPerson}</p>
            </div>
          </div>
        )}

        {customer.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-muted-foreground mb-2">Pickup Address</p>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{booking.pickup.city}</p>
              <p className="text-sm text-muted-foreground">{booking.pickup.address}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-muted-foreground mb-2">Drop Address</p>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{booking.drop.city}</p>
              <p className="text-sm text-muted-foreground">{booking.drop.address}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
