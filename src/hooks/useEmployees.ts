import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { employeeApi } from '@/lib/api';
import { useEmployeeStore } from '@/store/employeeStore';
import { toast } from 'sonner';
import type { ApiErrorResponse, Pagination, Staff, UpdateStaffData } from '@/types';

export function useEmployees() {
  const [loading, setLoading] = useState(false);
  const { filters, setEmployees, setPagination, pagination } = useEmployeeStore();

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
        const data = response.data.data as unknown as { staff: Staff[]; pagination: Pagination };
        if (data.staff && Array.isArray(data.staff)) {
          // Normalize data from backend (flatten nested user object)
          const normalizedStaff = data.staff.map((s: Staff & { user?: Partial<Staff> }) => {
            const role =
              s.user?.role ||
              (typeof s.roleTemplate === 'object'
                ? s.roleTemplate?.templateName
                : s.roleTemplate) ||
              s.role ||
              'staff';

            return {
              ...s,
              email: s.user?.email || s.email,
              phone: s.user?.phone || s.phone,
              status: s.user?.status || s.status,
              role: role as Staff['role'],
            } as Staff;
          });

          setEmployees(normalizedStaff);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        } else if (Array.isArray(response.data.data)) {
          // Fallback for old format
          const normalizedStaff = (response.data.data as (Staff & { user?: Partial<Staff> })[]).map(
            (s: Staff & { user?: Partial<Staff> }) => {
              const role =
                s.user?.role ||
                (typeof s.roleTemplate === 'object'
                  ? s.roleTemplate?.templateName
                  : s.roleTemplate) ||
                s.role ||
                'staff';

              return {
                ...s,
                email: s.user?.email || s.email,
                phone: s.user?.phone || s.phone,
                status: s.user?.status || s.status,
                role: role as Staff['role'],
              } as Staff;
            }
          );
          setEmployees(normalizedStaff);
        }
      }
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to fetch employees');
      logger.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (id: string, data: UpdateStaffData & { status?: string }) => {
    try {
      const payload: Record<string, unknown> = { ...data };
      if ('status' in payload) {
        payload.isActive = payload.status === 'active';
        delete payload.status;
      }
      const response = await employeeApi.update(id, payload as UpdateStaffData);
      if (response.data.success) {
        toast.success('Employee updated successfully');
        await fetchEmployees();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update employee');
      return false;
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  return {
    employees: useEmployeeStore((state) => state.employees),
    loading,
    refetch: fetchEmployees,
    updateEmployee,
  };
}
