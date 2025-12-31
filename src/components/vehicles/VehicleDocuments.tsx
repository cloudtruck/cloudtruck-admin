'use client';

import { FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Vehicle } from '@/types';
import { format } from 'date-fns';

interface VehicleDocumentsProps {
  vehicle: Vehicle;
}

export function VehicleDocuments({ vehicle }: VehicleDocumentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {vehicle.rcDocument && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">RC Document</p>
                <p className="text-sm text-muted-foreground">Registration Certificate</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={vehicle.rcDocument} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href={vehicle.rcDocument} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {(vehicle.expiryDates?.fitness || vehicle.expiryDates?.permit) && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-3">Validity Information</h4>
            <div className="space-y-2 text-sm">
              {vehicle.expiryDates?.fitness && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fitness Expires</span>
                  <span className="font-medium">
                    {format(new Date(vehicle.expiryDates.fitness), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              {vehicle.expiryDates?.permit && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Permit Expires</span>
                  <span className="font-medium">
                    {format(new Date(vehicle.expiryDates.permit), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {!vehicle.rcDocument && !vehicle.expiryDates?.fitness && !vehicle.expiryDates?.permit && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents uploaded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
