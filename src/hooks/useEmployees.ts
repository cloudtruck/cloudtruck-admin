import { useState, useEffect } from 'react';
import { employeeApi } from '@/lib/api';
import { useEmployeeStore } from '@/store/employeeStore';
import { toast } from 'sonner';
import type { ApiErrorResponse } from '@/types';

export function useEmployees() {
  const [loading, setLoading] = useState(false);
  const { filters, setEmployees, setPagination } = useEmployeeStore();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.list({
        ...filters,
        ...useEmployeeStore.getState().pagination,
        isActive:
          filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
      });

      if (response.data.success && response.data.data) {
        // Handle new response format with pagination
        const data = response.data.data as unknown as { staff: any[]; pagination: Pagination };
        if (data.staff && Array.isArray(data.staff)) {
          // Normalize data from backend (flatten nested user object)
          const normalizedStaff = data.staff.map((s) => ({
            ...s,
            email: s.user?.email || s.email,
            phone: s.user?.phone || s.phone,
            status: s.user?.status || s.status,
            role:
              s.user?.role ||
              (typeof s.roleTemplate === 'object' ? s.roleTemplate?.templateName : s.roleTemplate) ||
              s.role ||
              'staff',
          }));

          setEmployees(normalizedStaff);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        } else if (Array.isArray(response.data.data)) {
          // Fallback for old format
          const normalizedStaff = (response.data.data as any[]).map((s) => ({
            ...s,
            email: s.user?.email || s.email,
            phone: s.user?.phone || s.phone,
            status: s.user?.status || s.status,
            role:
              s.user?.role ||
              (typeof s.roleTemplate === 'object' ? s.roleTemplate?.templateName : s.roleTemplate) ||
              s.role ||
              'staff',
          }));
          setEmployees(normalizedStaff);
        }
      }
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to fetch employees');
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return {
    employees: useEmployeeStore((state) => state.employees),
    loading,
    refetch: fetchEmployees,
  };
}
