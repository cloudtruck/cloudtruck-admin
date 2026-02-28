'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, X } from 'lucide-react';
import { useMasterData } from '@/hooks/useMasterData';
import type { MasterData } from '@/types';
import Image from 'next/image';
import { useEffect } from 'react';

interface EditMasterDataModalProps {
  item: MasterData;
  open: boolean;
  onCloseAction: () => void;
}

export function EditMasterDataModal({ item, open, onCloseAction }: EditMasterDataModalProps) {
  const [saving, setSaving] = useState(false);
  const { updateItem } = useMasterData(item.category);
  const [formData, setFormData] = useState({
    displayName: item.displayName || '',
    description: item.description || '',
    isActive: item.isActive !== false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(item.imageUrl || null);

  useEffect(() => {
    setFormData({
      displayName: item.displayName || '',
      description: item.description || '',
      isActive: item.isActive !== false,
    });
    setImagePreview(item.imageUrl || null);
    setImageFile(null);
  }, [item, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = new FormData();
    data.append('displayName', formData.displayName);
    data.append('description', formData.description);
    data.append('isActive', String(formData.isActive));
    if (imageFile) {
      data.append('image', imageFile);
    }

    const result = await updateItem(item._id, data);

    setSaving(false);

    if (result) {
      onCloseAction();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {item.displayName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {item.category === 'truck-type' && (
            <div className="space-y-2">
              <Label>Truck Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors border-gray-300">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="text-[10px] text-gray-500 mt-1">Upload</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
                <div className="text-xs text-gray-500">
                  <p>Update the image for this truck type.</p>
                  <p>Recommended: Square image, max 2MB.</p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active Status</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCloseAction}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.displayName}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
