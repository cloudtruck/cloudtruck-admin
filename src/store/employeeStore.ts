import { create } from 'zustand';
import type { Staff, StaffFilters, Pagination } from '@/types';

interface EmployeeState {
  employees: Staff[];
  filters: StaffFilters;
  pagination: Pagination;
  selectedEmployee: Staff | null;
  setEmployees: (employees: Staff[]) => void;
  setFilters: (filters: StaffFilters) => void;
  setPagination: (pagination: Pagination) => void;
  setSelectedEmployee: (employee: Staff | null) => void;
  clearFilters: () => void;
  updateEmployeeInList: (id: string, updates: Partial<Staff>) => void;
}

const initialFilters: StaffFilters = {
  search: undefined,
  department: undefined,
  roleTemplate: undefined,
  status: undefined,
  branch: undefined,
};

const initialPagination: Pagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 20,
};

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],
  filters: initialFilters,
  pagination: initialPagination,
  selectedEmployee: null,

  setEmployees: (employees) => set({ employees }),

  setFilters: (filters) => set({ filters }),

  setPagination: (pagination) => set({ pagination }),

  setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),

  clearFilters: () => set({ filters: initialFilters }),

  updateEmployeeInList: (id, updates) =>
    set((state) => ({
      employees: state.employees.map((emp) => (emp._id === id ? { ...emp, ...updates } : emp)),
    })),
}));
