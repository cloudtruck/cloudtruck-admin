'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DriverTable } from '@/components/drivers/DriverTable';
import { AddDriverModal } from '@/components/drivers/AddDriverModal';
import { useDrivers } from '@/hooks/useDrivers';
import { useDriverStore } from '@/store/driverStore';
import { Search, X } from 'lucide-react';

export default function DriversPage() {
  const searchParams = useSearchParams();
  const { drivers, loading, refetch } = useDrivers();
  const { filters, setFilters, clearFilters, pagination } = useDriverStore();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    const status = searchParams.get('status');
    if (filters.status !== (status || undefined)) {
      setFilters({ ...filters, status: status || undefined });
    }
  }, [searchParams, filters, setFilters]);

  const handleSearch = () => setFilters({ ...filters, search: searchInput });

  const handleClearFilters = () => {
    clearFilters();
    setSearchInput('');
  };

  const handlePageChange = (page: number) => {
    useDriverStore.setState((state) => ({
      pagination: { ...state.pagination, currentPage: page },
    }));
  };

  const hasActiveFilters =
    filters.search || filters.status || filters.isVerified !== undefined || filters.truckType;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-blue-600">Drivers</h1>
        </div>
        <AddDriverModal onSuccess={refetch} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search name, phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select
          value={filters.status || 'all'}
          onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[150px] h-8 text-sm">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="on-trip">On Trip</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={
            filters.isVerified === undefined ? 'all' : filters.isVerified ? 'verified' : 'pending'
          }
          onValueChange={(v) =>
            setFilters({ ...filters, isVerified: v === 'all' ? undefined : v === 'verified' })
          }
        >
          <SelectTrigger className="w-[150px] h-8 text-sm">
            <SelectValue placeholder="KYC Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button onClick={handleClearFilters} variant="ghost" size="sm" className="h-8">
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <DriverTable
        drivers={drivers}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRefresh={refetch}
      />
    </div>
  );
}
