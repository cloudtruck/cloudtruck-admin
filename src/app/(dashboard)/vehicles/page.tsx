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
import { VehicleTable } from '@/components/vehicles/VehicleTable';
import { AddVehicleModal } from '@/components/vehicles/AddVehicleModal';
import { vehicleApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Vehicle, Pagination, VehicleFilters } from '@/types';
import { useMasterData } from '@/hooks/useMasterData';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  
  // Fetch master data
  const { data: truckTypes, loading: truckTypesLoading } = useMasterData('truck-type');
  const { data: bodyTypes, loading: bodyTypesLoading } = useMasterData('body-type');
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  useEffect(() => {
    fetchVehicles();
  }, [filters, pagination.currentPage]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await vehicleApi.getAll({
        ...filters,
        page: pagination.currentPage,
        limit: 20,
      });
      setVehicles(response.data.data.vehicles);
      setPagination(response.data.data.pagination);
    } catch (error: unknown) {
      console.error('Failed to fetch vehicles:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch vehicles');
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

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const hasActiveFilters = filters.search || filters.status || filters.truckType || filters.bodyType;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Manage all vehicles in the fleet"
        actions={
          <div className="flex gap-2">
            <Button onClick={fetchVehicles} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <AddVehicleModal onSuccess={fetchVehicles} />
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search by vehicle number..."
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
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.truckType || 'all'}
                  onValueChange={(value) =>
                    setFilters({ ...filters, truckType: value === 'all' ? undefined : value })
                  }
                  disabled={truckTypesLoading}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={truckTypesLoading ? "Loading..." : "Truck Type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {truckTypes
                      .filter(type => type.isActive)
                      .map((type) => (
                        <SelectItem key={type._id} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.bodyType || 'all'}
                  onValueChange={(value) =>
                    setFilters({ ...filters, bodyType: value === 'all' ? undefined : value })
                  }
                  disabled={bodyTypesLoading}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={bodyTypesLoading ? "Loading..." : "Body Type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Body Types</SelectItem>
                    {bodyTypes
                      .filter(type => type.isActive)
                      .map((type) => (
                        <SelectItem key={type._id} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
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

      <VehicleTable
        vehicles={vehicles}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
