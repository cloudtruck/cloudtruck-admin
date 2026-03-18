'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { employeeApi, roleTemplateApi } from '@/lib/api';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DEPARTMENTS } from '@/lib/constants';
import type { CreateStaffData, RoleTemplate, Permission, ApiErrorResponse } from '@/types';

// Department → RoleTemplate category mapping
const DEPT_TO_CATEGORY: Record<string, RoleTemplate['category']> = {
  operations: 'operations',
  finance: 'finance',
  support: 'support',
  management: 'management',
  admin: 'admin',
  traffic: 'operations',
  sales: 'custom',
};

function getPopulatedPermissions(template: RoleTemplate): Permission[] {
  return template.permissions.filter(
    (p): p is Permission => typeof p === 'object' && p !== null && 'name' in p
  );
}

interface RoleTemplateSectionProps {
  roleTemplates: RoleTemplate[];
  loadingTemplates: boolean;
  selectedTemplateId: string;
  department: string;
  onSelect: (id: string) => void;
}

function RoleTemplateSection({
  roleTemplates,
  loadingTemplates,
  selectedTemplateId,
  department,
  onSelect,
}: RoleTemplateSectionProps) {
  const matchCategory = department ? DEPT_TO_CATEGORY[department] : null;

  const suggested = matchCategory
    ? roleTemplates.filter((t) => t.category === matchCategory)
    : [];
  const others = matchCategory
    ? roleTemplates.filter((t) => t.category !== matchCategory)
    : roleTemplates;

  const selectedTemplate = roleTemplates.find((t) => t._id === selectedTemplateId);
  const permissions = selectedTemplate ? getPopulatedPermissions(selectedTemplate) : [];

  return (
    <div className="space-y-2 col-span-2">
      <Label htmlFor="roleTemplate">Role Template</Label>
      <Select
        value={selectedTemplateId}
        onValueChange={onSelect}
        disabled={loadingTemplates}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={loadingTemplates ? 'Loading...' : 'Select role template (optional)'}
          />
        </SelectTrigger>
        <SelectContent>
          {suggested.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs text-blue-600 font-semibold">
                Suggested for {DEPARTMENTS.find((d) => d.value === department)?.label}
              </SelectLabel>
              {suggested.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  <span>{t.templateName}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {t.permissions.length} permissions
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {suggested.length > 0 && others.length > 0 && <SelectSeparator />}
          {others.length > 0 && (
            <SelectGroup>
              {suggested.length > 0 && (
                <SelectLabel className="text-xs text-gray-400 font-semibold">
                  Other Templates
                </SelectLabel>
              )}
              {others.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  <span>{t.templateName}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {t.permissions.length} permissions
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      {/* Permissions preview */}
      {selectedTemplate && (
        <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 mt-1">
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            {selectedTemplate.templateName} —{' '}
            <span className="text-gray-700">{selectedTemplate.permissions.length} permissions</span>
          </p>
          {permissions.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              {permissions.map((p) => (
                <span key={p._id} className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="text-green-500 font-bold">✓</span>
                  {p.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">
              {selectedTemplate.permissions.length > 0
                ? `${selectedTemplate.permissions.length} permissions assigned`
                : 'No permissions assigned'}
            </p>
          )}
        </div>
      )}

      {!selectedTemplateId && (
        <p className="text-xs text-gray-500">
          Optional: Assign a role template to auto-apply permissions
        </p>
      )}
    </div>
  );
}

interface AddEmployeeModalProps {
  onSuccess: () => void;
}

export function AddEmployeeModal({ onSuccess }: AddEmployeeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [formData, setFormData] = useState<CreateStaffData>({
    name: '',
    email: '',
    phone: '',
    department: '',
    roleTemplate: '',
    password: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchRoleTemplates();
    }
  }, [isOpen]);

  const fetchRoleTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await roleTemplateApi.list({ isActive: true });
      if (response.data.success && response.data.data) {
        setRoleTemplates(response.data.data);
      }
    } catch {
      toast.error('Failed to load role templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleDepartmentChange = (value: string) => {
    // Clear role template when department changes — suggested list changes
    setFormData((prev) => ({ ...prev, department: value, roleTemplate: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await employeeApi.create(formData);

      if (response.data.success) {
        toast.success('Employee added successfully');
        setIsOpen(false);
        setFormData({ name: '', email: '', phone: '', department: '', roleTemplate: '', password: '' });
        onSuccess();
      }
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Employee
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={handleDepartmentChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Initial Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Empty cell to keep grid aligned */}
              <div />

              <RoleTemplateSection
                roleTemplates={roleTemplates}
                loadingTemplates={loadingTemplates}
                selectedTemplateId={formData.roleTemplate || ''}
                department={formData.department || ''}
                onSelect={(id) => setFormData({ ...formData, roleTemplate: id })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <LoadingSpinner className="mr-2" /> : null}
                Add Employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
