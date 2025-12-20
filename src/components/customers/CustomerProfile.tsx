'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { KycStatusBadge } from './KycStatusBadge';
import type { Customer } from '@/types';
import { Building2, Mail, Phone, MapPin, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerProfileProps {
  customer: Customer;
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{customer.companyName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Customer ID: {customer._id.slice(-8)}
            </p>
          </div>
          <div className="flex gap-2">
            <CustomerStatusBadge status={customer.status} />
            <KycStatusBadge status={customer.kycStatus} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customer.gstNumber && (
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">GST Number</p>
                <p className="font-medium">{customer.gstNumber}</p>
              </div>
            </div>
          )}

          {customer.contactPerson && (
            <>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{customer.contactPerson.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.contactPerson.phone}</p>
                </div>
              </div>

              {customer.contactPerson.email && (
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.contactPerson.email}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {customer.address && (
            <div className="flex items-start gap-3 col-span-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">
                  {customer.address.street && `${customer.address.street}, `}
                  {customer.address.city && `${customer.address.city}, `}
                  {customer.address.state && `${customer.address.state} `}
                  {customer.address.pincode}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="font-medium text-2xl">{customer.totalBookings || 0}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
