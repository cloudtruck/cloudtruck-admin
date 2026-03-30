'use client';

import { useState } from 'react';
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
import { EmployeeTable } from '@/components/organization/EmployeeTable';
import { AddEmployeeModal } from '@/components/organization/AddEmployeeModal';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployeeStore } from '@/store/employeeStore';
import { DEPARTMENTS } from '@/lib/constants';

export default function EmployeesPage() {
  const { employees, loading, refetch, updateEmployee } = useEmployees();
  const { filters, setFilters, clearFilters, pagination } = useEmployeeStore();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const resetPage = () => {
    useEmployeeStore.setState((state) => ({
      pagination: { ...state.pagination, currentPage: 1 },
    }));
  };

  const handleSearch = () => {
    resetPage();
    setFilters({ ...filters, search: searchInput });
  };

  const handleClearFilters = () => {
    resetPage();
    clearFilters();
    setSearchInput('');
  };

  const handlePageChange = (page: number) => {
    useEmployeeStore.setState((state) => ({
      pagination: { ...state.pagination, currentPage: page },
    }));
  };

  const hasActiveFilters =
    filters.search || filters.department || filters.roleTemplate || filters.status;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage staff members and their roles"
        actions={
          <div className="flex gap-2">
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <AddEmployeeModal onSuccess={refetch} />
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search by name, email..."
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
                  value={filters.department || 'all'}
                  onValueChange={(value) => {
                    resetPage();
                    setFilters({ ...filters, department: value === 'all' ? undefined : value });
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => {
                    resetPage();
                    setFilters({ ...filters, status: value === 'all' ? undefined : value });
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
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

      <EmployeeTable
        employees={employees}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRefresh={refetch}
        onDeactivate={(id) => updateEmployee(id, { status: 'inactive' })}
      />
    </div>
  );
}
