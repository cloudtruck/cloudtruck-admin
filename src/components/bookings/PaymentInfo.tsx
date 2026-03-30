'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Booking } from '@/types';
import { IndianRupee } from 'lucide-react';

interface PaymentInfoProps {
  booking: Booking;
}

const fmt = (n?: number) =>
  n != null ? `₹${n.toLocaleString('en-IN')}` : '—';

function Row({
  label,
  customer,
  supplier,
}: {
  label: string;
  customer?: React.ReactNode;
  supplier?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 py-2 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-center">{customer ?? '—'}</span>
      <span className="font-medium text-center">{supplier ?? '—'}</span>
    </div>
  );
}

export function PaymentInfo({ booking }: PaymentInfoProps) {
  const pl =
    booking.customerPrice != null && booking.supplierPrice != null
      ? booking.customerPrice - (booking.supplierPrice + (booking.expense ?? 0))
      : null;
  const plPct =
    pl != null && booking.customerPrice
      ? ((pl / booking.customerPrice) * 100).toFixed(1)
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Payment Status</span>
          <StatusBadge status={booking.paymentStatus} type="payment" />
        </div>

        {/* P&L Table */}
        <div className="pt-2 border-t">
          {/* Header */}
          <div className="grid grid-cols-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-gray-200">
            <span>Charges</span>
            <span className="text-center">Customer</span>
            <span className="text-center">Supplier</span>
          </div>

          <Row
            label="Price"
            customer={<span className="text-green-600">{fmt(booking.customerPrice)}</span>}
            supplier={<span className="text-orange-600">{fmt(booking.supplierPrice)}</span>}
          />
          <Row
            label="Advance %"
            customer={booking.customerAdvancePct != null ? `${booking.customerAdvancePct}%` : '—'}
            supplier={booking.supplierAdvancePct != null ? `${booking.supplierAdvancePct}%` : '—'}
          />
          <Row
            label="On Delivery"
            customer={fmt(booking.customerOnDelivery)}
            supplier={fmt(booking.supplierPaysSupplier)}
          />
          <Row
            label="POD Balance"
            customer={fmt(booking.customerPodBalance)}
            supplier={fmt(booking.supplierPodBalance)}
          />
          {booking.expense != null && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
              <span className="text-muted-foreground">Expenses</span>
              <span className="font-medium">{fmt(booking.expense)}</span>
            </div>
          )}
        </div>

        {/* P&L summary */}
        {pl != null && (
          <div className="pt-3 border-t flex items-center justify-between">
            <span className="text-sm font-semibold">
              Profit / Loss
              {plPct && (
                <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${pl >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {plPct}%
                </span>
              )}
            </span>
            <span className={`text-lg font-bold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pl >= 0 ? '+' : ''}{fmt(pl)}
            </span>
          </div>
        )}

        {/* Meta */}
        <div className="pt-3 border-t space-y-1.5 text-sm">
          {booking.invoiceTo && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice To</span>
              <span className="font-medium">{booking.invoiceTo}</span>
            </div>
          )}
          {booking.payTo && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pay To</span>
              <span className="font-medium">{booking.payTo}</span>
            </div>
          )}
          {booking.podType && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">POD Type</span>
              <span className="font-medium">{booking.podType}</span>
            </div>
          )}
          {booking.expectedAmount != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Amount</span>
              <span className="font-semibold">{fmt(booking.expectedAmount)}</span>
            </div>
          )}
        </div>

        {/* Alert */}
        {booking.paymentStatus === 'unpaid' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">Payment pending. Please follow up with the customer.</p>
          </div>
        )}
        {booking.paymentStatus === 'paid' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">Payment received successfully.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
