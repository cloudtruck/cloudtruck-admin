'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { customerApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Customer } from '@/types';
import { Search, X } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    kycStatus: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, [filters, pagination.currentPage]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerApi.getAll({
        ...filters,
        search: search || undefined,
        page: pagination.currentPage,
        limit: 20,
      });
      setCustomers(response.data.data.customers);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchCustomers();
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilters({
      status: '',
      kycStatus: '',
    });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const hasActiveFilters = search || filters.status || filters.kycStatus;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer accounts and view their booking history"
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company name, GST, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-9"
          />
        </div>

        <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.kycStatus} onValueChange={(value) => setFilters({ ...filters, kycStatus: value })}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="KYC Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="not-submitted">Not Submitted</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button onClick={handleClearFilters} variant="outline" size="icon">
            <X className="h-4 w-4" />
          </Button>
        )}

        <Button onClick={fetchCustomers} variant="default">
          Search
        </Button>
      </div>

      <CustomerTable
        customers={customers}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, currentPage: page })}
      />
    </div>
  );
}
