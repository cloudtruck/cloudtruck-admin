'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { PaymentTable } from '@/components/payments/PaymentTable';
import { MarkAsReceivedModal } from '@/components/payments/MarkAsReceivedModal';
import { paymentApi } from '@/lib/api';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { Payment, Pagination, PaymentFilters } from '@/types';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [markAsReceivedModalOpen, setMarkAsReceivedModalOpen] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await paymentApi.getAll({
        ...filters,
        page: pagination.currentPage,
        limit: 20,
      });
      setPayments(response.data.data.payments);
      setPagination(response.data.data.pagination);
    } catch (error) {
      logger.error('Failed to fetch payments:', error);
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchInput('');
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleMarkAsReceived = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setMarkAsReceivedModalOpen(true);
  };

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      const response = await paymentApi.downloadInvoice(paymentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded');
    } catch (error) {
      logger.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const hasActiveFilters = filters.search || filters.paymentStatus || filters.paymentMethod;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Manage all payment transactions"
        actions={
          <Button onClick={fetchPayments} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search by booking ID, customer..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="max-w-md"
                />
                <Button onClick={handleSearch} size="icon" variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Select
                  value={filters.paymentStatus || 'all'}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      paymentStatus: value === 'all' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.paymentMethod || 'all'}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      paymentMethod: value === 'all' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="neft">NEFT</SelectItem>
                    <SelectItem value="rtgs">RTGS</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="ghost" size="sm">
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentTable
        payments={payments}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onMarkAsReceived={handleMarkAsReceived}
        onDownloadInvoice={handleDownloadInvoice}
      />

      <MarkAsReceivedModal
        paymentId={selectedPaymentId}
        open={markAsReceivedModalOpen}
        onClose={() => setMarkAsReceivedModalOpen(false)}
        onSuccess={fetchPayments}
      />
    </div>
  );
}
