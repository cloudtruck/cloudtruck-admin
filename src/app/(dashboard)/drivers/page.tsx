'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { DriverTable } from '@/components/drivers/DriverTable';
import { AddDriverModal } from '@/components/drivers/AddDriverModal';
import { useDrivers } from '@/hooks/useDrivers';
import { useDriverStore } from '@/store/driverStore';

export default function DriversPage() {
  const searchParams = useSearchParams();
  const { drivers, loading, refetch } = useDrivers();
  const { filters, setFilters, clearFilters, pagination } = useDriverStore();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Sync URL params with store
  useEffect(() => {
    const status = searchParams.get('status');
    if (filters.status !== (status || undefined)) {
      setFilters({ ...filters, status: status || undefined });
    }
  }, [searchParams, filters, setFilters]);

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
  };

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
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Manage and monitor all drivers"
        actions={
          <div className="flex gap-2">
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <AddDriverModal onSuccess={refetch} />
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search by name, phone..."
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
                  value={filters.status || 'all'}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on-trip">On Trip</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={
                    filters.isVerified === undefined
                      ? 'all'
                      : filters.isVerified
                      ? 'verified'
                      : 'pending'
                  }
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      isVerified:
                        value === 'all' ? undefined : value === 'verified' ? true : false,
                    })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verification</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
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
