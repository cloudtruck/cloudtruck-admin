'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { CustomerProfile } from '@/components/customers/CustomerProfile';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { CustomerBookingHistory } from '@/components/customers/CustomerBookingHistory';
import { CustomerPaymentHistory } from '@/components/customers/CustomerPaymentHistory';
import { Button } from '@/components/ui/button';
import { customerApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Customer } from '@/types';
import { ArrowLeft, RefreshCw, Ban, CheckCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const response = await customerApi.getById(id);
      setCustomer(response.data.data);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      toast.error('Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      toast.error('Please provide a reason for blocking');
      return;
    }

    setActionLoading(true);
    try {
      await customerApi.block(id, { reason: blockReason });
      toast.success('Customer blocked successfully');
      setBlockDialogOpen(false);
      setBlockReason('');
      fetchCustomer();
    } catch (error) {
      console.error('Failed to block customer:', error);
      toast.error('Failed to block customer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async () => {
    setActionLoading(true);
    try {
      await customerApi.unblock(id);
      toast.success('Customer unblocked successfully');
      setUnblockDialogOpen(false);
      fetchCustomer();
    } catch (error) {
      console.error('Failed to unblock customer:', error);
      toast.error('Failed to unblock customer');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Customer Not Found"
          description="The customer you are looking for does not exist"
        />
        <div className="flex justify-center">
          <Button onClick={() => router.push('/customers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const stats = {
    totalBookings: customer.totalBookings || 0,
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    averageBookingValue: 0,
    lastBookingDays: customer.lastBookingDate
      ? Math.floor((Date.now() - new Date(customer.lastBookingDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.companyName}
        description={`Customer ID: ${customer._id.slice(-8)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={fetchCustomer} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {customer.status === 'blocked' ? (
              <Button
                onClick={() => setUnblockDialogOpen(true)}
                variant="default"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Unblock
              </Button>
            ) : (
              <Button
                onClick={() => setBlockDialogOpen(true)}
                variant="destructive"
                size="sm"
              >
                <Ban className="h-4 w-4 mr-2" />
                Block
              </Button>
            )}
            <Button onClick={() => router.push('/customers')} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <CustomerStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CustomerProfile customer={customer} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <CustomerBookingHistory customerId={id} />
          <CustomerPaymentHistory customerId={id} />
        </div>
      </div>

      {/* Block Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block Customer</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent the customer from creating new bookings. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter reason for blocking..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} disabled={actionLoading || !blockReason.trim()}>
              {actionLoading ? 'Blocking...' : 'Block Customer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock Dialog */}
      <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock Customer</AlertDialogTitle>
            <AlertDialogDescription>
              This will allow the customer to resume creating bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock} disabled={actionLoading}>
              {actionLoading ? 'Unblocking...' : 'Unblock Customer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
