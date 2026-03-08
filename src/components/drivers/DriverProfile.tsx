'use client';

import { Phone, Mail, CreditCard, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DriverStatusBadge } from './DriverStatusBadge';
import type { Driver } from '@/types';
import { format } from 'date-fns';

interface DriverProfileProps {
  driver: Driver;
}

export function DriverProfile({ driver }: DriverProfileProps) {
  const initials = driver.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={driver.profilePhoto} alt={driver.name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">{driver.name}</h3>
            <div className="flex items-center gap-2 mt-2">
              <DriverStatusBadge status={driver.status} />
              <Badge
                variant="outline"
                className={
                  driver.isVerified
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                }
              >
                {driver.isVerified ? 'Verified' : 'Pending Approval'}
              </Badge>

              <Badge
                variant="outline"
                className={
                  driver.kycStatus === 'verified'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : driver.kycStatus === 'rejected'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }
              >
                KYC: {driver.kycStatus || 'pending'}
              </Badge>

              <Badge
                variant="outline"
                className={
                  driver.accountInfoStatus === 'verified'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : driver.accountInfoStatus === 'rejected'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }
              >
                Account: {driver.accountInfoStatus || 'pending'}
              </Badge>
              {driver.isBlacklisted && (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  Blacklisted
                </Badge>
              )}
            </div>
          </div>
        </div>

        {driver.rejectionReason && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm font-medium text-red-800">Rejection Reason</p>
            <p className="text-sm text-red-700 mt-1">{driver.rejectionReason}</p>
            {driver.rejectedAt && (
              <p className="text-xs text-red-500 mt-2">
                Rejected on {format(new Date(driver.rejectedAt), 'MMM dd, yyyy HH:mm')}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{driver.phone}</p>
            </div>
          </div>

          {driver.email && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{driver.email}</p>
              </div>
            </div>
          )}

          {driver.licenseNumber && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">License Number</p>
                <p className="font-medium">{driver.licenseNumber}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {format(new Date(driver.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {driver.preferredTruckTypes && driver.preferredTruckTypes.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Preferred Truck Types</p>
            <div className="flex flex-wrap gap-2">
              {driver.preferredTruckTypes.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <p className="text-2xl font-bold">{driver.totalTrips || 0}</p>
            <p className="text-sm text-muted-foreground">Total Trips</p>
          </div>
          {driver.rating && (
            <div>
              <p className="text-2xl font-bold">{driver.rating.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
