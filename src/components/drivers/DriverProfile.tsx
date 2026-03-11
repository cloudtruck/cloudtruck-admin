'use client';

import { useState } from 'react';
import { Phone, Mail, CreditCard, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { DriverStatusBadge } from './DriverStatusBadge';
import { driverApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Driver } from '@/types';
import { format } from 'date-fns';

interface DriverProfileProps {
  driver: Driver;
  onSuccess?: () => void;
}

export function DriverProfile({ driver, onSuccess }: DriverProfileProps) {
  const [loading, setLoading] = useState(false);
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');

  const initials = driver.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const needsReview =
    !driver.isVerified &&
    (driver.kycStatus === 'submitted' || driver.accountInfoStatus === 'submitted');

  const handleApprove = async () => {
    setLoading(true);
    try {
      await driverApi.approve(driver._id);
      toast.success('Driver approved successfully');
      onSuccess?.();
      setActionDialog(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to approve driver');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (reason.trim().length < 10) {
      toast.error('Please provide a reason with at least 10 characters');
      return;
    }
    setLoading(true);
    try {
      await driverApi.reject(driver._id, { reason });
      toast.success('Driver rejected');
      onSuccess?.();
      setActionDialog(null);
      setReason('');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to reject driver');
    } finally {
      setLoading(false);
    }
  };

  // Derive a single clean verification status for display
  const verificationBadge = () => {
    if (driver.isBlacklisted) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Blacklisted</Badge>;
    }
    if (driver.isVerified) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Verified</Badge>;
    }
    if (driver.kycStatus === 'rejected' || driver.accountInfoStatus === 'rejected') {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
    }
    if (driver.kycStatus === 'submitted' || driver.accountInfoStatus === 'submitted') {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Review Pending</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Not Submitted</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Driver Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={driver.profilePhoto} alt={driver.name} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{driver.name}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <DriverStatusBadge status={driver.status} />
                {verificationBadge()}
              </div>

              {/* KYC review panel — only shown when review is needed */}
              {needsReview && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-900">Verification Review Required</p>
                    <div className="flex gap-3 text-xs text-amber-700">
                      {driver.kycStatus === 'submitted' && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          KYC submitted
                        </span>
                      )}
                      {driver.accountInfoStatus === 'submitted' && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          Account info submitted
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setActionDialog('approve')}
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
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

          {driver.rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm font-medium text-red-800">Rejection Reason</p>
              <p className="text-sm text-red-700 mt-1">{driver.rejectionReason}</p>
              {driver.rejectedAt && (
                <p className="text-xs text-red-500 mt-2">
                  Rejected on {format(new Date(driver.rejectedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{driver.phone}</p>
              </div>
            </div>

            {driver.email && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{driver.email}</p>
                </div>
              </div>
            )}

            {driver.licenseNumber && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License Number</p>
                  <p className="font-medium">{driver.licenseNumber}</p>
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
                  {format(new Date(driver.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {driver.preferredTruckTypes && driver.preferredTruckTypes.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Preferred Truck Types</p>
              <div className="flex flex-wrap gap-2">
                {driver.preferredTruckTypes.map((type) => (
                  <Badge key={type} variant="secondary">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-2xl font-bold">{driver.totalTrips || 0}</p>
              <p className="text-sm text-muted-foreground">Total Trips</p>
            </div>
            {driver.rating ? (
              <div>
                <p className="text-2xl font-bold">{driver.rating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Approve dialog */}
      <AlertDialog open={actionDialog === 'approve'} onOpenChange={(open) => !open && setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {driver.name}? They will be able to accept trips.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={loading}>
              {loading ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog open={actionDialog === 'reject'} onOpenChange={(open) => !open && setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting {driver.name}.
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
            <AlertDialogAction onClick={handleReject} disabled={loading}>
              {loading ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
