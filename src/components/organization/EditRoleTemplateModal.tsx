'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { roleTemplateApi } from '@/lib/api';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PermissionSelector } from '@/components/organization/PermissionSelector';
import type { RoleTemplate, ApiErrorResponse } from '@/types';

interface EditRoleTemplateModalProps {
  template: RoleTemplate;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'support', label: 'Support' },
  { value: 'management', label: 'Management' },
  { value: 'admin', label: 'Admin' },
  { value: 'custom', label: 'Custom' },
];

export function EditRoleTemplateModal({
  template,
  onClose,
  onSuccess,
}: EditRoleTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    templateName: template.templateName,
    description: template.description,
    category: template.category,
    permissions: Array.isArray(template.permissions)
      ? template.permissions.map((p: string | { _id?: string }) =>
          typeof p === 'string' ? p : p._id || ''
        )
      : [],
    isActive: template.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.templateName || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    try {
      setLoading(true);
      const response = await roleTemplateApi.update(template._id, formData);

      if (response.data.success) {
        const affected = response.data.data?.affectedEmployees || 0;
        if (affected > 0) {
          toast.success(
            `Role template updated successfully. ${affected} employee(s) will have updated permissions.`
          );
        } else {
          toast.success('Role template updated successfully');
        }
        onSuccess();
      }
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update role template');
      logger.error('Error updating role template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Role Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">
                  Template Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="templateName"
                  value={formData.templateName}
                  onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                  placeholder="e.g., Operations Manager"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as RoleTemplate['category'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this role and its responsibilities"
                rows={3}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (can be assigned to employees)
              </Label>
            </div>

            <div className="space-y-2">
              <Label>
                Permissions <span className="text-red-500">*</span>
              </Label>
              <PermissionSelector
                selectedPermissions={formData.permissions}
                onChange={(permissions: string[]) => setFormData({ ...formData, permissions })}
              />
              <p className="text-xs text-gray-500">
                Selected: {formData.permissions.length} permission(s)
              </p>
              {template.employeeCount > 0 && (
                <p className="text-xs text-orange-600">
                  ⚠️ Changing permissions will affect {template.employeeCount} employee(s) using
                  this template
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner className="mr-2" /> : null}
              Update Role Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
