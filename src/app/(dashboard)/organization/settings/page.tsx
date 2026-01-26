'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, FileText, Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { Skeleton } from '@/components/ui/skeleton';

type SettingsFormState = {
  companyName: string;
  gstNumber: string;
  bookingSeriesPrefix: string;
  advancePaymentPercentage: number;
  podMandatory: boolean;
};

export default function OrganizationSettingsPage() {
  const { 
    settings, 
    loading, 
    updateCompanyInfo, 
    updateBookingConfig, 
    updateOperationalSettings 
  } = useOrganizationSettings();

  const [savingCompany, setSavingCompany] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [savingOperational, setSavingOperational] = useState(false);
  const [localSettings, setLocalSettings] = useState<SettingsFormState>({
    companyName: '',
    gstNumber: '',
    bookingSeriesPrefix: '',
    advancePaymentPercentage: 30,
    podMandatory: false,
  });
  const [lastSavedSettings, setLastSavedSettings] = useState<SettingsFormState | null>(null);

  // Update local settings when API data loads
  useEffect(() => {
    if (settings) {
      const newSettings = {
        companyName: settings.companyName || '',
        gstNumber: settings.gstNumber || '',
        bookingSeriesPrefix: settings.bookingSeriesPrefix || '',
        advancePaymentPercentage: settings.advancePaymentPercentage || 30,
        podMandatory: settings.podMandatory || false,
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSettings(newSettings);
      setLastSavedSettings(newSettings);
    }
  }, [settings]);

  const handleSaveCompanyInfo = async () => {
    setSavingCompany(true);
    const success = await updateCompanyInfo({
      companyName: localSettings.companyName,
      gstNumber: localSettings.gstNumber,
    });
    if (success) {
      setLastSavedSettings((prev) =>
        prev
          ? {
              ...prev,
              companyName: localSettings.companyName,
              gstNumber: localSettings.gstNumber,
            }
          : prev
      );
    }
    setSavingCompany(false);
  };

  const handleSaveBookingConfig = async () => {
    setSavingBooking(true);
    const success = await updateBookingConfig({
      bookingSeriesPrefix: localSettings.bookingSeriesPrefix,
      advancePaymentPercentage: localSettings.advancePaymentPercentage,
    });
    if (success) {
      setLastSavedSettings((prev) =>
        prev
          ? {
              ...prev,
              bookingSeriesPrefix: localSettings.bookingSeriesPrefix,
              advancePaymentPercentage: localSettings.advancePaymentPercentage,
            }
          : prev
      );
    }
    setSavingBooking(false);
  };

  const handleSaveOperational = async () => {
    setSavingOperational(true);
    const success = await updateOperationalSettings({
      podMandatory: localSettings.podMandatory,
    });
    if (success) {
      setLastSavedSettings((prev) =>
        prev
          ? {
              ...prev,
              podMandatory: localSettings.podMandatory,
            }
          : prev
      );
    }
    setSavingOperational(false);
  };

  const isCompanyDirty = Boolean(
    lastSavedSettings &&
      (localSettings.companyName !== lastSavedSettings.companyName ||
        localSettings.gstNumber !== lastSavedSettings.gstNumber)
  );
  const isBookingDirty = Boolean(
    lastSavedSettings &&
      (localSettings.bookingSeriesPrefix !== lastSavedSettings.bookingSeriesPrefix ||
        localSettings.advancePaymentPercentage !== lastSavedSettings.advancePaymentPercentage)
  );
  const isOperationalDirty = Boolean(
    lastSavedSettings && localSettings.podMandatory !== lastSavedSettings.podMandatory
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization Settings"
          description="Configure system-wide settings and preferences"
        />
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Organization Settings"
          description="Configure system-wide settings and preferences"
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No settings found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Configure system-wide settings and preferences"
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Company Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={localSettings.companyName}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, companyName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={localSettings.gstNumber}
                  onChange={(e) => 
                    setLocalSettings({ ...localSettings, gstNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveCompanyInfo} disabled={!isCompanyDirty || savingCompany}>
                {savingCompany && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Company Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Billing Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookingSeriesPrefix">Booking Series Prefix</Label>
              <Input
                id="bookingSeriesPrefix"
                value={localSettings.bookingSeriesPrefix}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, bookingSeriesPrefix: e.target.value })
                }
                className="max-w-xs"
              />
              <p className="text-sm text-gray-500">
                Booking IDs will be generated as {localSettings.bookingSeriesPrefix || 'BK'}-XXXXXX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advancePaymentPercentage">
                Advance Payment Percentage
              </Label>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  id="advancePaymentPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={localSettings.advancePaymentPercentage}
                  onChange={(e) =>
                    setLocalSettings({ 
                      ...localSettings,
                      advancePaymentPercentage: parseInt(e.target.value) || 0
                    })
                  }
                />
                <span className="text-gray-600">%</span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveBookingConfig} disabled={!isBookingDirty || savingBooking}>
                {savingBooking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Booking Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Operational Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Operational Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="podMandatory"
                checked={localSettings.podMandatory}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, podMandatory: checked as boolean })
                }
              />
              <Label htmlFor="podMandatory" className="cursor-pointer">
                POD (Proof of Delivery) is mandatory for booking completion
              </Label>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveOperational} disabled={!isOperationalDirty || savingOperational}>
                {savingOperational && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Operational Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
