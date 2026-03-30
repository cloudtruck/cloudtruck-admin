'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types';
import { FileText, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface LRDetailsProps {
  booking: Booking;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? '—'}</span>
    </div>
  );
}

export function LRDetails({ booking }: LRDetailsProps) {
  const lrNum = booking.lrDetails?.lrNumber || booking.lrNumber;
  const lrDate = booking.lrDetails?.lrDate;
  const docs = booking.lrDetails?.documents ?? [];

  // Only render if any LR-related data exists
  const hasAnyData =
    lrNum || lrDate || booking.boeNumber || booking.jobNo ||
    booking.hireChallan || booking.invoiceNo || booking.shipmentNo ||
    booking.containerNo || booking.poNumber || docs.length > 0;

  if (!hasAnyData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          LR & Reference Numbers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <Row label="LR Number" value={lrNum ?? '—'} />
            <Row label="LR Date" value={lrDate ? formatDate(lrDate, 'dd MMM yyyy') : '—'} />
            <Row label="BOE / Booking No" value={booking.boeNumber ?? '—'} />
            <Row label="Job No" value={booking.jobNo ?? '—'} />
            <Row label="Hire Challan" value={booking.hireChallan ?? '—'} />
          </div>
          <div>
            <Row label="Invoice No" value={booking.invoiceNo ?? '—'} />
            <Row label="Shipment No" value={booking.shipmentNo ?? '—'} />
            <Row label="Container No" value={booking.containerNo ?? '—'} />
            <Row label="PO Number" value={booking.poNumber ?? '—'} />
          </div>
        </div>

        {docs.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-3">LR Documents ({docs.length})</p>
            <div className="space-y-2">
              {docs.map((doc) => (
                <a
                  key={doc._id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{doc.originalName || `LR Document`}</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
