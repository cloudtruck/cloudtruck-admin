'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supplierApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Supplier } from '@/types';

interface EditSupplierModalProps {
  supplier: Supplier;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  displayName: string;
  companyName: string;
  phone: string;
  email: string;
  city: string;
  gstin: string;
  panNumber: string;
  aadharNumber: string;
  companyRegistrationNumber: string;
}

export function EditSupplierModal({ supplier, open, onClose, onSuccess }: EditSupplierModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    displayName: '',
    companyName: '',
    phone: '',
    email: '',
    city: '',
    gstin: '',
    panNumber: '',
    aadharNumber: '',
    companyRegistrationNumber: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        displayName: supplier.displayName ?? '',
        companyName: supplier.companyName ?? '',
        phone: supplier.phone ?? '',
        email: supplier.email ?? '',
        city: supplier.city ?? '',
        gstin: supplier.gstin ?? '',
        panNumber: supplier.panNumber ?? '',
        aadharNumber: supplier.aadharNumber ?? '',
        companyRegistrationNumber: supplier.companyRegistrationNumber ?? '',
      });
    }
  }, [open, supplier]);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    const payload: Record<string, string> = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
      if (form[key].trim()) payload[key] = form[key].trim();
    });

    setLoading(true);
    try {
      await supplierApi.update(supplier._id, payload);
      toast.success('Supplier updated');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to update supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => set('displayName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={form.gstin}
                onChange={(e) => set('gstin', e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input
                id="panNumber"
                value={form.panNumber}
                onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadharNumber">Aadhaar Number</Label>
              <Input
                id="aadharNumber"
                value={form.aadharNumber}
                onChange={(e) => set('aadharNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="12 digits"
                maxLength={12}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="companyRegistrationNumber">Company Registration No.</Label>
              <Input
                id="companyRegistrationNumber"
                value={form.companyRegistrationNumber}
                onChange={(e) => set('companyRegistrationNumber', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
