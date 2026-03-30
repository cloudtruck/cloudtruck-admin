'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { organizationSettingsApi } from '@/lib/api';
import type { DeletionPolicyResource, OrganizationSettings } from '@/types';

const RESOURCES: { value: DeletionPolicyResource; label: string; description: string }[] = [
  { value: 'driver', label: 'Drivers', description: 'Driver records' },
  { value: 'vehicle', label: 'Vehicles', description: 'Truck/vehicle records' },
  { value: 'customer', label: 'Customers', description: 'Customer accounts' },
  { value: 'staff', label: 'Staff', description: 'Staff/employee records' },
  { value: 'branch', label: 'Branches', description: 'Branch offices' },
  { value: 'supplier', label: 'Suppliers', description: 'Supplier / transport partner records' },
  { value: 'master-data', label: 'Master Data', description: 'Truck types, material types, etc.' },
  { value: 'account', label: 'Accounts', description: 'Bank/financial accounts' },
  { value: 'route', label: 'Routes', description: 'Route definitions' },
  { value: 'document', label: 'Documents', description: 'Uploaded documents' },
];

export function DeletionPolicyConfig() {
  const [selected, setSelected] = useState<DeletionPolicyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    organizationSettingsApi.getSettings()
      .then((res) => {
        if (res.data.success) {
          const settings = res.data.data as OrganizationSettings;
          setSelected(settings.deletionPolicy?.requireApprovalFor ?? []);
        }
      })
      .catch(() => toast.error('Failed to load deletion policy'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (resource: DeletionPolicyResource) => {
    setSelected((prev) =>
      prev.includes(resource)
        ? prev.filter((r) => r !== resource)
        : [...prev, resource]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await organizationSettingsApi.updateDeletionPolicy({ requireApprovalFor: selected });
      toast.success('Deletion policy saved');
    } catch {
      toast.error('Failed to save deletion policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          Deletion Approval Policy
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Staff members cannot delete the selected resources on their own. A manager{' '}
          <span className="font-medium">(Internal or Super-admin)</span> must approve each
          deletion request before it takes effect.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RESOURCES.map((resource) => (
            <div
              key={resource.value}
              className="flex items-start gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
              onClick={() => toggle(resource.value)}
            >
              <Checkbox
                id={`policy-${resource.value}`}
                checked={selected.includes(resource.value)}
                onCheckedChange={() => toggle(resource.value)}
                className="mt-0.5"
              />
              <div>
                <Label
                  htmlFor={`policy-${resource.value}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {resource.label}
                </Label>
                <p className="text-xs text-gray-500">{resource.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-gray-400">
            {selected.length === 0
              ? 'No resources require approval — all roles can delete freely.'
              : `${selected.length} resource${selected.length > 1 ? 's' : ''} require manager approval before deletion.`}
          </p>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Policy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
