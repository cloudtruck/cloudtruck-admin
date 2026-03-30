'use client';

import { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Pencil,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { EditSupplierModal } from './EditSupplierModal';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { Supplier } from '@/types';
import { format } from 'date-fns';

interface SupplierProfileProps {
  supplier: Supplier;
  onSuccess?: () => void;
}

export function SupplierProfile({ supplier, onSuccess }: SupplierProfileProps) {
  const [actionDialog, setActionDialog] = useState<'verify' | 'reject' | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const { verifySupplier, rejectSupplier } = useSuppliers();

  const initials = supplier.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const needsReview = supplier.verificationStatus === 'documents-submitted';

  const handleVerify = async () => {
    setLoading(true);
    const ok = await verifySupplier(supplier._id);
    setLoading(false);
    if (ok) {
      setActionDialog(null);
      onSuccess?.();
    }
  };

  const handleReject = async () => {
    if (reason.trim().length < 10) return;
    setLoading(true);
    const ok = await rejectSupplier(supplier._id, reason);
    setLoading(false);
    if (ok) {
      setActionDialog(null);
      setReason('');
      onSuccess?.();
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Supplier Profile</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{supplier.displayName}</h3>
              {supplier.companyName && (
                <p className="text-sm text-muted-foreground">{supplier.companyName}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <SupplierStatusBadge status={supplier.verificationStatus} />
                <Badge
                  variant="outline"
                  className={
                    supplier.supplierType === 'company'
                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                      : 'bg-orange-100 text-orange-700 border-orange-200'
                  }
                >
                  {supplier.supplierType === 'company' ? 'Company' : 'Individual'}
                </Badge>
                {supplier.isBlacklisted && (
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                    Blacklisted
                  </Badge>
                )}
              </div>

              {needsReview && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-amber-900">
                    Documents submitted — review required
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setActionDialog('verify')}
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setActionDialog('reject')}
                      disabled={loading}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {supplier.rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm font-medium text-red-800">Rejection Reason</p>
              <p className="text-sm text-red-700 mt-1">{supplier.rejectionReason}</p>
            </div>
          )}

          {supplier.blacklistReason && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm font-medium text-red-800">Blacklist Reason</p>
              <p className="text-sm text-red-700 mt-1">{supplier.blacklistReason}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{supplier.phone}</p>
              </div>
            </div>

            {supplier.email && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{supplier.email}</p>
                </div>
              </div>
            )}

            {supplier.city && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{supplier.city}</p>
                </div>
              </div>
            )}

            {supplier.gstin && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GSTIN</p>
                  <p className="font-medium">{supplier.gstin}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {format(new Date(supplier.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-2xl font-bold">{supplier.fleetStats.totalDrivers}</p>
              <p className="text-sm text-muted-foreground">Total Drivers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{supplier.fleetStats.activeDrivers}</p>
              <p className="text-sm text-muted-foreground">Active Drivers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{supplier.performance.totalBookings}</p>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{supplier.performance.completedBookings}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={actionDialog === 'verify'}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify {supplier.displayName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerify} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditSupplierModal
        supplier={supplier}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          onSuccess?.();
        }}
      />

      <AlertDialog
        open={actionDialog === 'reject'}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting {supplier.displayName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Enter rejection reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={loading || reason.trim().length < 10}
            >
              {loading ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
