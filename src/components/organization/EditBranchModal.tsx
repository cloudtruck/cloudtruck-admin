'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Branch } from '@/types';

interface EditBranchModalProps {
  branch: Branch;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Branch>) => Promise<boolean>;
}

export function EditBranchModal({ branch, open, onClose, onSave }: EditBranchModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    branchName: '',
    region: '',
    assignedCitiesRaw: '',
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        branchName: branch.branchName || '',
        region: branch.region || '',
        assignedCitiesRaw: (branch.assignedCities ?? []).join(', '),
      });
    }
  }, [branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const assignedCities = formData.assignedCitiesRaw
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const result = await onSave(branch._id, {
      branchName: formData.branchName,
      region: formData.region,
      assignedCities,
    });
    setSaving(false);
    if (result) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch Name *</Label>
            <Input
              id="branch-name"
              value={formData.branchName}
              onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-region">Region *</Label>
            <Input
              id="branch-region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-cities">
              Assigned Cities
              <span className="text-muted-foreground text-xs ml-1">(comma-separated)</span>
            </Label>
            <Input
              id="branch-cities"
              value={formData.assignedCitiesRaw}
              onChange={(e) => setFormData({ ...formData, assignedCitiesRaw: e.target.value })}
              placeholder="Mumbai, Delhi, Chennai"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
