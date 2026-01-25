'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { useMasterData } from '@/hooks/useMasterData';
import type { MasterData } from '@/types';

interface AddMasterDataModalProps {
  category: string;
  categoryLabel: string;
  onSuccess?: () => void;
}

export function AddMasterDataModal({ category, categoryLabel, onSuccess }: AddMasterDataModalProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { createItem } = useMasterData(category);
  const [formData, setFormData] = useState({
    displayName: '',
    key: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await createItem({
      category: category as MasterData['category'],
      displayName: formData.displayName,
      key: formData.key || formData.displayName.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      isActive: true,
    });

    setSaving(false);

    if (result) {
      onSuccess?.();
      setOpen(false);
      setFormData({ displayName: '', key: '', description: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add {categoryLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {categoryLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="e.g., Tata Ace, FMCG, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key">Key (optional)</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="Auto-generated from display name"
            />
            <p className="text-xs text-gray-500">Unique identifier for this item</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.displayName}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
