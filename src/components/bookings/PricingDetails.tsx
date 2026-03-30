'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types';
import { IndianRupee } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface PricingDetailsProps {
  booking: Booking;
}

const fmt = (n?: number) =>
  n != null ? `₹${n.toLocaleString('en-IN')}` : '—';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? '—'}</span>
    </div>
  );
}

export function PricingDetails({ booking }: PricingDetailsProps) {
  const pl =
    booking.customerPrice != null && booking.supplierPrice != null
      ? booking.customerPrice - booking.supplierPrice
      : null;
  const plPct =
    pl != null && booking.customerPrice
      ? ((pl / booking.customerPrice) * 100).toFixed(1) + '%'
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Pricing & Operational Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {/* Pricing column */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pricing</p>
            <Row label="Customer Price" value={
              <span className="text-green-600 font-semibold">{fmt(booking.customerPrice)}</span>
            } />
            <Row label="Supplier Price" value={
              <span className="text-orange-600 font-semibold">{fmt(booking.supplierPrice)}</span>
            } />
            <Row label="Expected Amount" value={fmt(booking.expectedAmount)} />
            <Row label="Rate Per Ton" value={booking.ratePerTon ? 'Yes' : 'No'} />
            {pl != null && (
              <Row label="Profit / Loss" value={
                <span className={pl >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {pl >= 0 ? '+' : ''}{fmt(pl)} {plPct ? `(${plPct})` : ''}
                </span>
              } />
            )}
            <Row label="Supplier TDS" value={booking.supplierTds != null ? `${booking.supplierTds}%` : '—'} />
            <Row label="Customer Advance %" value={booking.customerAdvancePct != null ? `${booking.customerAdvancePct}%` : '—'} />
            <Row label="Supplier Advance %" value={booking.supplierAdvancePct != null ? `${booking.supplierAdvancePct}%` : '—'} />
          </div>

          {/* Operational column */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Operational</p>
            <Row label="Transaction Type" value={booking.bookingType?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
            <Row label="EXIM" value={booking.exim ? booking.exim.charAt(0).toUpperCase() + booking.exim.slice(1) : '—'} />
            <Row label="Load Type" value={booking.loadType ?? '—'} />
            <Row label="Invoice To" value={booking.invoiceTo ?? '—'} />
            <Row label="Lane Code" value={booking.laneCode ?? '—'} />
            <Row label="Trip Km" value={booking.tripKm != null ? `${booking.tripKm} km` : '—'} />
            <Row label="Actual Km" value={booking.actualKm != null ? `${booking.actualKm} km` : '—'} />
            <Row label="ETA" value={booking.expectedDeliveryDate ? formatDate(booking.expectedDeliveryDate, 'dd MMM yyyy, hh:mm a') : '—'} />
            <Row label="Order Date" value={formatDate(booking.createdAt, 'dd MMM yyyy')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
