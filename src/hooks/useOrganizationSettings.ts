import { useState, useEffect } from 'react';
import { organizationSettingsApi } from '@/lib/api';
import { toast } from 'sonner';
import type { OrganizationSettings, ApiErrorResponse } from '@/types';

export function useOrganizationSettings() {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await organizationSettingsApi.getSettings();

      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to fetch organization settings');
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (data: Partial<OrganizationSettings>) => {
    try {
      const response = await organizationSettingsApi.updateSettings(data);

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Settings updated successfully');
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update settings');
      console.error('Error updating settings:', error);
      return false;
    }
  };

  const updateCompanyInfo = async (data: Partial<OrganizationSettings>) => {
    try {
      const response = await organizationSettingsApi.updateCompanyInfo(data);

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Company information updated successfully');
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update company info');
      return false;
    }
  };

  const updateBookingConfig = async (data: Partial<OrganizationSettings>) => {
    try {
      const response = await organizationSettingsApi.updateBookingConfig(data);

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Booking configuration updated successfully');
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update booking config');
      return false;
    }
  };

  const updateOperationalSettings = async (data: Partial<OrganizationSettings>) => {
    try {
      const response = await organizationSettingsApi.updateOperationalSettings(data);

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Operational settings updated successfully');
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update operational settings');
      return false;
    }
  };

  const updateNotificationSettings = async (data: Partial<OrganizationSettings>) => {
    try {
      const response = await organizationSettingsApi.updateNotificationSettings(data);

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Notification settings updated successfully');
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update notification settings');
      return false;
    }
  };

  const updateTaxSettings = async (data: Partial<OrganizationSettings>) => {
    try {
      const response = await organizationSettingsApi.updateTaxSettings(data);

      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Tax settings updated successfully');
        return true;
      }
      return false;
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to update tax settings');
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    refetch: fetchSettings,
    updateSettings,
    updateCompanyInfo,
    updateBookingConfig,
    updateOperationalSettings,
    updateNotificationSettings,
    updateTaxSettings,
  };
}
