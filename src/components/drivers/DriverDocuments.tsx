'use client';

import { FileText, Image as ImageIcon, CreditCard, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Driver } from '@/types';

interface DriverDocumentsProps {
  driver: Driver;
}

export function DriverDocuments({ driver }: DriverDocumentsProps) {
  const documents = [
    {
      label: 'License Photo',
      value: driver.licensePhoto,
      icon: CreditCard,
      type: 'image',
    },
    {
      label: 'Aadhar Photo',
      value: driver.aadhaarPhoto,
      icon: CreditCard,
      type: 'image',
    },
    {
      label: 'PAN Photo',
      value: driver.panPhoto,
      icon: CreditCard,
      type: 'image',
    },
    {
      label: 'Cancelled Cheque',
      value: driver.chequePhoto,
      icon: FileText,
      type: 'image',
    },
    {
      label: 'TDS Document',
      value: driver.tdsDocument,
      icon: FileText,
      type: 'document',
    },
    {
      label: 'Profile Photo',
      value: driver.profilePhoto,
      icon: ImageIcon,
      type: 'image',
    },
  ];

  const availableDocs = documents.filter((doc) => doc.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {availableDocs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents uploaded</p>
          </div>
        ) : (
          <div className="space-y-4">
            {availableDocs.map((doc) => (
              <div
                key={doc.label}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <doc.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.type === 'image' ? 'Image' : 'Document'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={doc.value} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={doc.value} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}

            {driver.bankDetails && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Bank Details</h4>
                <div className="space-y-2 text-sm">
                  {driver.bankDetails.accountHolderName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Holder</span>
                      <span className="font-medium">{driver.bankDetails.accountHolderName}</span>
                    </div>
                  )}
                  {driver.bankDetails.accountNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number</span>
                      <span className="font-medium">{driver.bankDetails.accountNumber}</span>
                    </div>
                  )}
                  {driver.bankDetails.ifscCode && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IFSC Code</span>
                      <span className="font-medium">{driver.bankDetails.ifscCode}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
