'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Booking } from '@/types';
import { DollarSign, CreditCard } from 'lucide-react';

interface PaymentInfoProps {
  booking: Booking;
}

export function PaymentInfo({ booking }: PaymentInfoProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
          <StatusBadge status={booking.paymentStatus} type="payment" />
        </div>

        {booking.expectedAmount && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Expected Amount</p>
            <p className="text-xl font-bold">{formatCurrency(booking.expectedAmount)}</p>
          </div>
        )}

        {booking.advanceRequired && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Advance Required</p>
            <p className="text-lg font-semibold text-orange-600">
              {formatCurrency(booking.advanceRequired)}
            </p>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Payment Method</p>
          </div>
          <p className="text-muted-foreground">
            {booking.paymentStatus === 'paid' ? 'Online / NEFT / RTGS' : 'Not specified'}
          </p>
        </div>

        {booking.paymentStatus === 'unpaid' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Payment is pending. Please follow up with the customer.
            </p>
          </div>
        )}

        {booking.paymentStatus === 'paid' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              Payment has been received successfully.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
