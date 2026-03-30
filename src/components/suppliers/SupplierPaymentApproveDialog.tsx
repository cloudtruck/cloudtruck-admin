'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { useSupplierPayments } from '@/hooks/useSupplierPayments';
import type { SupplierPaymentRecord } from '@/types';

interface SupplierPaymentApproveDialogProps {
  payment: SupplierPaymentRecord;
  onSuccess: () => void;
}

/**
 * Two-step dialog:
 *  - Step 1 (status=pending): Manager approves → pending → approved
 *  - Step 2 (status=approved): Accounts marks paid → approved → paid (requires UTR/ref no.)
 */
export function SupplierPaymentApproveDialog({
  payment,
  onSuccess,
}: SupplierPaymentApproveDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const { approvePayment, markPaid } = useSupplierPayments();

  const isApproveStep = payment.status === 'pending';
  const isMarkPaidStep = payment.status === 'approved';

  const rupees = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);

  const handleApprove = async () => {
    setLoading(true);
    const ok = await approvePayment(payment._id);
    setLoading(false);
    if (ok) {
      setOpen(false);
      onSuccess();
    }
  };

  const handleMarkPaid = async () => {
    if (!referenceNumber.trim()) return;
    setLoading(true);
    const ok = await markPaid(payment._id, {
      referenceNumber: referenceNumber.trim(),
      transactionDate: transactionDate || undefined,
      remarks: remarks.trim() || undefined,
    });
    setLoading(false);
    if (ok) {
      setOpen(false);
      setReferenceNumber('');
      setTransactionDate('');
      setRemarks('');
      onSuccess();
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant={isApproveStep ? 'outline' : 'default'}
        onClick={() => setOpen(true)}
        className={isApproveStep ? 'text-blue-600 border-blue-300' : ''}
      >
        {isApproveStep ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Approve
          </>
        ) : (
          <>
            <CreditCard className="h-3 w-3 mr-1" />
            Mark Paid
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isApproveStep ? 'Approve Payment' : 'Mark Payment as Paid'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier</span>
                <span className="font-medium">{payment.supplier.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking</span>
                <span className="font-medium">{payment.booking.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-base">{rupees(payment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{payment.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{payment.paymentMethod}</span>
              </div>
              {payment.bankDetailsSnapshot && (
                <div className="mt-2 pt-2 border-t space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">Bank Details</p>
                  <p>{payment.bankDetailsSnapshot.accountHolderName}</p>
                  <p className="font-mono">{payment.bankDetailsSnapshot.accountNumber}</p>
                  <p>{payment.bankDetailsSnapshot.ifscCode} — {payment.bankDetailsSnapshot.bankName}</p>
                </div>
              )}
            </div>

            {isApproveStep && (
              <p className="text-muted-foreground text-xs">
                Approving will move this payment to &quot;approved&quot; status. Accounts team will then process the transfer.
              </p>
            )}

            {isMarkPaidStep && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="ref">Reference / UTR Number *</Label>
                  <Input
                    id="ref"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. NEFT123456789"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="txdate">Transaction Date</Label>
                  <Input
                    id="txdate"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional remarks..."
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {isApproveStep && (
              <Button onClick={handleApprove} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve
              </Button>
            )}
            {isMarkPaidStep && (
              <Button
                onClick={handleMarkPaid}
                disabled={loading || !referenceNumber.trim()}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark as Paid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
