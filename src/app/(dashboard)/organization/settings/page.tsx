'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, FileText, Settings as SettingsIcon, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function OrganizationSettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'Cloudtruck Logistics Pvt Ltd',
    gstNumber: '27AABCT1332L1Z5',
    bookingSeriesPrefix: 'CT',
    podMandatory: true,
    advancePaymentPercentage: 20,
  });

  const handleSave = () => {
    toast.success('Settings updated successfully');
  };

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
                  value={settings.companyName}
                  onChange={(e) =>
                    setSettings({ ...settings, companyName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={settings.gstNumber}
                  onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                />
              </div>
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
                value={settings.bookingSeriesPrefix}
                onChange={(e) =>
                  setSettings({ ...settings, bookingSeriesPrefix: e.target.value })
                }
                className="max-w-xs"
              />
              <p className="text-sm text-gray-500">
                Booking IDs will be generated as {settings.bookingSeriesPrefix}-XXXX
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
                  value={settings.advancePaymentPercentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      advancePaymentPercentage: parseInt(e.target.value),
                    })
                  }
                />
                <span className="text-gray-600">%</span>
              </div>
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
                checked={settings.podMandatory}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, podMandatory: checked as boolean })
                }
              />
              <Label htmlFor="podMandatory" className="cursor-pointer">
                POD (Proof of Delivery) is mandatory for booking completion
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
