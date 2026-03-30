'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { driverApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Driver, BankAccount } from '@/types';

interface DriverBankDetailsProps {
  driver: Driver;
  onSuccess: () => void;
}

interface BankForm {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  isPrimary: boolean;
}

const emptyForm: BankForm = {
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  bankName: '',
  branchName: '',
  isPrimary: false,
};

export function DriverBankDetails({ driver, onSuccess }: DriverBankDetailsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [form, setForm] = useState<BankForm>(emptyForm);

  const accounts: BankAccount[] = driver.bankAccounts ?? [];

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, isPrimary: accounts.length === 0 });
    setDialogOpen(true);
  };

  const openEdit = (account: BankAccount) => {
    setEditingId(account._id);
    setForm({
      accountHolderName: account.accountHolderName ?? '',
      accountNumber: '',
      ifscCode: account.ifscCode ?? '',
      bankName: account.bankName ?? '',
      branchName: account.branchName ?? '',
      isPrimary: account.isPrimary,
    });
    setDialogOpen(true);
  };

  const set = (key: keyof BankForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountHolderName.trim() || !form.ifscCode.trim()) {
      toast.error('Beneficiary name and IFSC are required');
      return;
    }
    if (!editingId && !form.accountNumber.trim()) {
      toast.error('Account number is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        const payload: Record<string, unknown> = {
          accountHolderName: form.accountHolderName.trim(),
          ifscCode: form.ifscCode.trim().toUpperCase(),
          bankName: form.bankName.trim(),
          branchName: form.branchName.trim(),
          isPrimary: form.isPrimary,
        };
        if (form.accountNumber.trim()) payload.accountNumber = form.accountNumber.trim();
        await driverApi.updateBankAccount(driver._id, editingId, payload);
        toast.success('Bank account updated');
      } else {
        await driverApi.addBankAccount(driver._id, {
          accountHolderName: form.accountHolderName.trim(),
          accountNumber: form.accountNumber.trim(),
          ifscCode: form.ifscCode.trim().toUpperCase(),
          bankName: form.bankName.trim(),
          branchName: form.branchName.trim(),
          isPrimary: form.isPrimary,
        });
        toast.success('Bank account added');
      }
      setDialogOpen(false);
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to save bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (accountId: string) => {
    if (!window.confirm('Remove this bank account?')) return;
    setRemovingId(accountId);
    try {
      await driverApi.removeBankAccount(driver._id, accountId);
      toast.success('Bank account removed');
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to remove bank account');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add Account
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-600 w-32">Primary Account</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Beneficiary Name</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Bank Name</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Account No</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">IFSC No</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Branch Name</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell>
                      {account.isPrimary ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs gap-1">
                          <Star className="h-3 w-3 fill-green-600" /> Primary
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {account.accountHolderName || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {account.bankName || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 font-mono">
                      {account.accountNumber || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 font-mono">
                      {account.ifscCode || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {account.branchName || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(account)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleRemove(account._id)}
                          disabled={removingId === account._id}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <svg className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 11h18" />
                      </svg>
                      <span className="text-sm">No data</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => !submitting && setDialogOpen(v)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="accountHolderName">Beneficiary Name *</Label>
              <Input
                id="accountHolderName"
                value={form.accountHolderName}
                onChange={(e) => set('accountHolderName', e.target.value)}
                placeholder="Name as per bank account"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">
                Account Number {editingId ? '(leave blank to keep existing)' : '*'}
              </Label>
              <Input
                id="accountNumber"
                value={form.accountNumber}
                onChange={(e) => set('accountNumber', e.target.value.replace(/\D/g, ''))}
                placeholder={editingId ? 'Enter to update account number' : 'Enter full account number'}
                required={!editingId}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code *</Label>
                <Input
                  id="ifscCode"
                  value={form.ifscCode}
                  onChange={(e) => set('ifscCode', e.target.value.toUpperCase())}
                  placeholder="SBIN0001234"
                  maxLength={11}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={form.bankName}
                  onChange={(e) => set('bankName', e.target.value)}
                  placeholder="State Bank of India"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchName">Branch Name</Label>
              <Input
                id="branchName"
                value={form.branchName}
                onChange={(e) => set('branchName', e.target.value)}
                placeholder="MG Road Branch"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isPrimary"
                checked={form.isPrimary}
                onCheckedChange={(v) => set('isPrimary', !!v)}
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">Set as primary account</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
