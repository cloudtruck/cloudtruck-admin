import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { roleTemplateApi } from '@/lib/api';
import { toast } from 'sonner';
import type { RoleTemplate, ApiErrorResponse } from '@/types';

export function useRoleTemplates(filters?: { category?: string; isActive?: boolean }) {
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await roleTemplateApi.list(filters);

      if (response.data.success) {
        setTemplates(response.data.data || []);
      }
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to fetch role templates');
      logger.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (data: Partial<RoleTemplate>) => {
    try {
      const response = await roleTemplateApi.create(data);

      if (response.data.success) {
        toast.success('Role template created successfully');
        await fetchTemplates();
        return response.data.data;
      }
      return null;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to create template');
      return null;
    }
  };

  const updateTemplate = async (id: string, data: Partial<RoleTemplate>) => {
    try {
      const response = await roleTemplateApi.update(id, data);

      if (response.data.success) {
        const affectedEmployees = response.data.data.affectedEmployees || 0;
        toast.success(
          `Template updated - ${affectedEmployees} employee${affectedEmployees !== 1 ? 's' : ''} affected`
        );
        await fetchTemplates();
        return response.data.data.template;
      }
      return null;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update template');
      return null;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const response = await roleTemplateApi.delete(id);

      if (response.data.success) {
        toast.success('Role template deleted successfully');
        await fetchTemplates();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to delete template');
      return false;
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.category, filters?.isActive]);

  return {
    templates,
    loading,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
