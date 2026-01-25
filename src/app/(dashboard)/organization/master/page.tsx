'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { GripVertical, Loader2, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMasterData } from '@/hooks/useMasterData';
import { AddMasterDataModal } from '@/components/organization/AddMasterDataModal';
import { EditMasterDataModal } from '@/components/organization/EditMasterDataModal';
import type { MasterData } from '@/types';

const CATEGORIES = [
  { value: 'truck-type', label: 'Truck Types' },
  { value: 'material-type', label: 'Material Types' },
  { value: 'charge-type', label: 'Charge Types' },
  { value: 'body-type', label: 'Body Types' },
  { value: 'document-type', label: 'Document Types' },
];

export default function MasterDataPage() {
  const [selectedCategory, setSelectedCategory] = useState('truck-type');
  const { data, loading, deleteItem, refetch } = useMasterData(selectedCategory);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MasterData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MasterData | null>(null);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(itemToDelete._id);
    await deleteItem(itemToDelete._id);
    setDeleting(null);
    setItemToDelete(null);
  };

  const renderCategoryContent = (category: string) => {
    if (loading) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      );
    }

    const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || category;

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{categoryLabel} ({data.length})</h3>
            <AddMasterDataModal category={category} categoryLabel={categoryLabel.slice(0, -1)} onSuccess={refetch} />
          </div>

          {data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No {categoryLabel.toLowerCase()} found</p>
              <AddMasterDataModal category={category} categoryLabel={categoryLabel.slice(0, -1)} onSuccess={refetch} />
            </div>
          ) : (
            <div className="space-y-2">
              {data.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    <div className="flex-1">
                      <span className="font-medium">{item.displayName}</span>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    {item.usageCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Used {item.usageCount} times
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setItemToDelete(item)}
                      disabled={deleting === item._id}
                    >
                      {deleting === item._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 text-red-600" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data"
        description="Manage system-wide master data categories"
      />

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
        <TabsList>
          {CATEGORIES.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((category) => (
          <TabsContent key={category.value} value={category.value}>
            {renderCategoryContent(category.value)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Modal */}
      {editingItem && (
        <EditMasterDataModal
          key={editingItem._id}
          item={editingItem}
          open={!!editingItem}
          onCloseAction={() => setEditingItem(null)}
          onSuccess={refetch}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Master Data</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left pt-4">
              Are you sure you want to delete <strong>{itemToDelete?.displayName}</strong>?
              {itemToDelete?.usageCount ? (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm text-amber-800">
                    ⚠️ This item is currently used in <strong>{itemToDelete.usageCount}</strong> place(s).
                    Deleting it may affect existing records.
                  </p>
                </div>
              ) : null}
              <p className="mt-3 text-sm">
                This action cannot be undone. The item will be permanently deleted from the system.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting === itemToDelete?._id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting === itemToDelete?._id}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting === itemToDelete?._id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
