'use client';

import { use, useState, useEffect } from 'react';
import { RefreshCw, Download, CreditCard, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { MarkAsReceivedModal } from '@/components/payments/MarkAsReceivedModal';
import { paymentApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Payment } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { id } = use(params);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [markAsReceivedModalOpen, setMarkAsReceivedModalOpen] = useState(false);

  useEffect(() => {
    fetchPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPayment = async () => {
    setLoading(true);
    try {
      const response = await paymentApi.getById(id);
      setPayment(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      toast.error('Failed to fetch payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await paymentApi.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Payment Not Found"
          description="The payment you are looking for does not exist"
        />
        {/* <div className="flex justify-center">
          <Button onClick={() => router.push('/payments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
        </div> */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Payment #${payment._id.slice(-8)}`}
        description={`For booking ${payment.booking.bookingId}`}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={fetchPayment} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {payment.paymentStatus === 'unpaid' && (
              <Button
                onClick={() => setMarkAsReceivedModalOpen(true)}
                variant="default"
                size="sm"
              >
                Mark as Received
              </Button>
            )}
            <Button onClick={handleDownloadInvoice} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Invoice
            </Button>
            {/* <Button onClick={() => router.push('/payments')} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button> */}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Total Amount</p>
                </div>
                <PaymentStatusBadge status={payment.paymentStatus} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                
                <div>
                <p className="text-sm text-muted-foreground mb-1">Advance Paid</p>
                {payment.advanceAmount && payment.advanceAmount > 0 && (
                    <p className="text-xl font-semibold">
                      ₹{payment.advanceAmount.toLocaleString('en-IN')}
                    </p>
                )}
                </div>
                
                <div>
                <p className="text-sm text-muted-foreground mb-1">Balance Due</p>
                {payment.balanceAmount && payment.balanceAmount > 0 && (                    
                    <p className="text-xl font-semibold text-red-600">
                      ₹{payment.balanceAmount.toLocaleString('en-IN')}
                    </p>
                )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium capitalize">
                      {payment.paymentMethod || 'Not Set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {payment.transactionReference && (
                  <div className="flex items-center gap-3 col-span-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction Reference</p>
                      <p className="font-medium font-mono text-sm">
                        {payment.transactionReference}
                      </p>
                    </div>
                  </div>
                )}

                {payment.paidAt && (
                  <div className="flex items-center gap-3 col-span-2">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid At</p>
                      <p className="font-medium">
                        {format(new Date(payment.paidAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <Link
                    href={`/bookings/${payment.booking._id}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {payment.booking.bookingId}
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pickup</p>
                    <p className="font-medium">{payment.booking.pickup?.city}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Drop</p>
                    <p className="font-medium">{payment.booking.drop?.city}</p>
                  </div>
                  {payment.booking.materialType && (
                    <div>
                      <p className="text-muted-foreground">Material</p>
                      <p className="font-medium">{payment.booking.materialType}</p>
                    </div>
                  )}
                  {payment.booking.truckTypeNeeded && (
                    <div>
                      <p className="text-muted-foreground">Truck Type</p>
                      <p className="font-medium">{payment.booking.truckTypeNeeded}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Company Name</p>
                  <p className="font-medium">{payment.booking.customer.companyName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{payment.booking.customer.contactPerson?.name || 'N/A'}</p>
                </div>
                {payment.booking.customer.contactPerson?.phone && (
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{payment.booking.customer.contactPerson.phone}</p>
                  </div>
                )}
                {payment.booking.customer.contactPerson?.email && (
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{payment.booking.customer.contactPerson.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {payment.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{payment.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MarkAsReceivedModal
        paymentId={id}
        open={markAsReceivedModalOpen}
        onClose={() => setMarkAsReceivedModalOpen(false)}
        onSuccess={fetchPayment}
      />
    </div>
  );
}
