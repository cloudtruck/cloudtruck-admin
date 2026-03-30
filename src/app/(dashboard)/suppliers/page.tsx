'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { AddSupplierModal } from '@/components/suppliers/AddSupplierModal';
import { DriverTable } from '@/components/drivers/DriverTable';
import { AddDriverModal } from '@/components/drivers/AddDriverModal';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSupplierStore } from '@/store/supplierStore';
import { useDrivers } from '@/hooks/useDrivers';
import { useDriverStore } from '@/store/driverStore';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

function SuppliersTab() {
  const { suppliers, loading, refetch } = useSuppliers();
  const { filters, setFilters, clearFilters, pagination } = useSupplierStore();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearch = () => setFilters({ ...filters, search: searchInput });
  const handleClear = () => {
    clearFilters();
    setSearchInput('');
  };
  const hasActiveFilters = filters.search || filters.verificationStatus;

  const handlePageChange = (page: number) => {
    useSupplierStore.setState((state) => ({
      pagination: { ...state.pagination, currentPage: page },
    }));
  };

  return (
    <div className="space-y-4">
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
          value={filters.verificationStatus || 'all'}
          onValueChange={(v) =>
            setFilters({ ...filters, verificationStatus: v === 'all' ? undefined : v })
          }
        >
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="documents-submitted">Docs Submitted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button onClick={handleClear} variant="ghost" size="sm" className="h-8">
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
        <div className="ml-auto">
          <AddSupplierModal onSuccess={refetch} />
        </div>
      </div>
      <SupplierTable
        suppliers={suppliers}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRefresh={refetch}
      />
    </div>
  );
}

function DriversTab() {
  const { drivers, loading, refetch } = useDrivers();
  const { filters, setFilters, clearFilters, pagination } = useDriverStore();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearch = () => setFilters({ ...filters, search: searchInput });
  const handleClear = () => {
    clearFilters();
    setSearchInput('');
  };
  const hasActiveFilters =
    filters.search || filters.status || filters.isVerified !== undefined || filters.truckType;

  const handlePageChange = (page: number) => {
    useDriverStore.setState((state) => ({
      pagination: { ...state.pagination, currentPage: page },
    }));
  };

  return (
    <div className="space-y-4">
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
          <Button onClick={handleClear} variant="ghost" size="sm" className="h-8">
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
        <div className="ml-auto">
          <AddDriverModal onSuccess={refetch} />
        </div>
      </div>
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

function SuppliersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'suppliers';

  const handleTabChange = (value: string) => {
    router.replace(`/suppliers?tab=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="drivers">Drivers (Individual)</TabsTrigger>
        </TabsList>
        <TabsContent value="suppliers" className="mt-4">
          <SuppliersTab />
        </TabsContent>
        <TabsContent value="drivers" className="mt-4">
          <DriversTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense>
      <SuppliersPageContent />
    </Suspense>
  );
}
