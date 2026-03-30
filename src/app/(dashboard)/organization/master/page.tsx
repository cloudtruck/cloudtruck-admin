'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { GripVertical, Loader2, Edit2, Trash2, Shield, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMasterData } from '@/hooks/useMasterData';
import { useDeleteRequests } from '@/hooks/useDeleteRequests';
import { AddMasterDataModal } from '@/components/organization/AddMasterDataModal';
import { EditMasterDataModal } from '@/components/organization/EditMasterDataModal';
import { DeletionPolicyConfig } from '@/components/organization/DeletionPolicyConfig';
import { DeleteRequestQueue } from '@/components/organization/DeleteRequestQueue';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import type { MasterData } from '@/types';
import Image from 'next/image';

const CATEGORIES = [
  { value: 'truck-type', label: 'Truck Types' },
  { value: 'material-type', label: 'Material Types' },
  { value: 'charge-type', label: 'Charge Types' },
  { value: 'body-type', label: 'Body Types' },
  { value: 'document-type', label: 'Document Types' },
  { value: 'location', label: 'Locations' },
  { value: 'lane', label: 'Lanes' },
  { value: 'cost-center', label: 'Cost Centers' },
] as const;

export default function MasterDataPage() {
  const [selectedCategory, setSelectedCategory] = useState<MasterData['category']>('truck-type');
  const { data, loading, deleteItem, refetch } = useMasterData(selectedCategory);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MasterData | null>(null);

  const { user } = useAuthStore();
  const isStaff = user?.role === 'staff';
  const canManagePolicy = user?.role === 'super-admin';
  const canApprove = user?.role === 'admin' || user?.role === 'super-admin';

  const { items: pendingRequests } = useDeleteRequests({ status: 'pending', autoFetch: canApprove });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setDeleting(id);
    try {
      const result = await deleteItem(id);
      // If backend returned 202, the delete is pending approval — toast shown by hook
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((result as any)?.status === 202) {
        toast.info('Deletion request submitted — awaiting manager approval');
      }
    } finally {
      setDeleting(null);
    }
  };

  const renderCategoryContent = (category: MasterData['category']) => {
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
            <AddMasterDataModal category={category} categoryLabel={categoryLabel.slice(0, -1)} onSuccess={() => refetch()} />
          </div>

          {data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No {categoryLabel.toLowerCase()} found</p>
              <AddMasterDataModal category={category} categoryLabel={categoryLabel.slice(0, -1)} onSuccess={() => refetch()} />
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
                    {item.category === 'truck-type' && (
                      <div className="relative h-10 w-10 border rounded overflow-hidden flex-shrink-0 bg-gray-50">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.displayName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                    )}
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
                      onClick={() => handleDelete(item._id)}
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

      <Tabs 
        value={selectedCategory} 
        onValueChange={(value) => setSelectedCategory(value as MasterData['category'])} 
        className="space-y-4"
      >
        <TabsList className="flex-wrap h-auto gap-1">
          {CATEGORIES.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label}
            </TabsTrigger>
          ))}
          {canManagePolicy && (
            <TabsTrigger value="deletion-policy" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Deletion Policy
            </TabsTrigger>
          )}
          {canApprove && (
            <TabsTrigger value="pending-deletions" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Pending Deletions
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0 min-w-[16px] h-4">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {CATEGORIES.map((category) => (
          <TabsContent key={category.value} value={category.value}>
            {renderCategoryContent(category.value)}
          </TabsContent>
        ))}

        {canManagePolicy && (
          <TabsContent value="deletion-policy">
            <DeletionPolicyConfig />
          </TabsContent>
        )}

        {canApprove && (
          <TabsContent value="pending-deletions">
            <DeleteRequestQueue />
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Modal */}
      {editingItem && (
        <EditMasterDataModal
          key={editingItem._id}
          item={editingItem}
          open={!!editingItem}
          onCloseAction={() => {
            setEditingItem(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
