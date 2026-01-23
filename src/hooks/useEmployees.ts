import { useState, useEffect } from 'react';
import { employeeApi } from '@/lib/api';
import { useEmployeeStore } from '@/store/employeeStore';
import { toast } from 'sonner';
import type { Staff } from '@/types';

export function useEmployees() {
  const [loading, setLoading] = useState(false);
  const { filters, setEmployees, setPagination, pagination } = useEmployeeStore();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getAll({
        ...filters,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      });

      if (response.data.success) {
        setEmployees(response.data.data.staff);
        setPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch employees');
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage]);

  return {
    employees: useEmployeeStore((state) => state.employees),
    loading,
    refetch: fetchEmployees,
  };
}
