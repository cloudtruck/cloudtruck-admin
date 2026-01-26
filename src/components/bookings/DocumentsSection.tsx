'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/types';
import { FileText, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface DocumentsSectionProps {
  booking: Booking;
}

export function DocumentsSection({ booking }: DocumentsSectionProps) {
  const handleDownload = (url: string, filename?: string) => {
    // TODO: Implement download logic
    console.log('Download:', url, filename);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents & Images
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cargo Images */}
        {booking.images && booking.images.length > 0 ? (
          <div>
            <p className="text-sm font-medium mb-3">Cargo Images ({booking.images.length})</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {booking.images.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg border overflow-hidden group"
                >
                  <Image
                    src={image}
                    alt={`Cargo image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(image)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No cargo images uploaded</p>
          </div>
        )}

        {/* POD Documents */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Proof of Delivery (POD)</p>
          {booking.status === 'delivered' || booking.status === 'pod-received' ? (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">POD_{booking.bookingId}.pdf</p>
                  <p className="text-xs text-muted-foreground">Uploaded 2 days ago</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload('pod-url')}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                POD will be available after delivery
              </p>
            </div>
          )}
        </div>

        {/* Loading Images */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Loading Images</p>
          {booking.status === 'loaded' ||
          booking.status === 'in-transit' ||
          booking.status === 'reached-destination' ||
          booking.status === 'delivered' ||
          booking.status === 'pod-received' ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg border overflow-hidden group"
                >
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload('loading-url')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">
                Loading images will be available after loading
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
