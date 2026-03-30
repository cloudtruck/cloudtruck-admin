'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, Eye, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supplierApi } from '@/lib/api';
import type { Supplier } from '@/types';

interface SupplierDocumentsProps {
  supplier: Supplier;
  onSuccess: () => void;
}

const DOC_TYPES: Array<{ key: keyof NonNullable<Supplier['documents']>; label: string }> = [
  { key: 'gstCertificate',      label: 'GST Certificate' },
  { key: 'companyRegistration', label: 'Company Registration' },
  { key: 'cancelledCheque',     label: 'Cancelled Cheque' },
  { key: 'panDocument',         label: 'PAN Document' },
  { key: 'aadharDocument',      label: 'Aadhaar Document' },
];

export function SupplierDocuments({ supplier, onSuccess }: SupplierDocumentsProps) {
  const docs = supplier.documents ?? {};
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleFileChange(docType: string, file: File) {
    setError(null);
    setUploading(docType);
    try {
      await supplierApi.uploadDocument(supplier._id, docType, file);
      onSuccess();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    try {
      await supplierApi.verify(supplier._id);
      onSuccess();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message ?? 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {DOC_TYPES.map(({ key, label }) => {
            const doc = docs[key];
            const isUploading = uploading === key;

            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{label}</p>
                    {doc ? (
                      <Badge variant="secondary" className="mt-0.5 gap-1 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-0.5 gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Not uploaded
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {doc && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </a>
                    </Button>
                  )}

                  <input
                    ref={(el) => { fileInputRefs.current[key] = el; }}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(key, file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    variant={doc ? 'ghost' : 'default'}
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRefs.current[key]?.click()}
                  >
                    <Upload className="mr-1 h-4 w-4" />
                    {isUploading ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {supplier.verificationStatus !== 'verified' && (
          <div className="border-t pt-4">
            <Button
              className="w-full gap-2"
              onClick={handleVerify}
              disabled={verifying}
            >
              <ShieldCheck className="h-4 w-4" />
              {verifying ? 'Approving…' : 'Approve KYC'}
            </Button>
          </div>
        )}

        {supplier.verificationStatus === 'verified' && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
            <ShieldCheck className="h-4 w-4" />
            KYC Verified
          </div>
        )}
      </CardContent>
    </Card>
  );
}
