'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Users, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { RoleTemplate } from '@/types';

interface RoleTemplateDetailDrawerProps {
  template: RoleTemplate;
  onClose: () => void;
  onEdit: () => void;
}

const categoryColors: Record<string, string> = {
  operations: 'bg-blue-100 text-blue-800',
  finance: 'bg-green-100 text-green-800',
  support: 'bg-purple-100 text-purple-800',
  management: 'bg-orange-100 text-orange-800',
  admin: 'bg-red-100 text-red-800',
  custom: 'bg-gray-100 text-gray-800',
};

export function RoleTemplateDetailDrawer({
  template,
  onClose,
  onEdit,
}: RoleTemplateDetailDrawerProps) {
  // Group permissions by resource
  const permissionsByResource = template.permissions.reduce((acc, perm) => {
    const permission = typeof perm === 'string' ? { key: perm } : perm;
    const resource = permission.key?.split('.')[0] || 'other';
    
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Array<{ key: string; name?: string; resource?: string }>>);

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>{template.templateName}</span>
            <Button onClick={onEdit} size="sm" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Overview */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Category</span>
                <Badge variant="outline" className={categoryColors[template.category]}>
                  {template.category}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant={template.isActive ? 'default' : 'secondary'}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Employees Using</span>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{template.employeeCount || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Permissions</span>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{template.permissions.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {format(new Date(template.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-sm text-gray-700">{template.description}</p>
          </div>

          {/* Permissions */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Permissions ({template.permissions.length})
            </h3>
            <div className="space-y-4">
              {Object.entries(permissionsByResource).map(([resource, perms]) => (
                <div key={resource} className="border rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 capitalize mb-2">
                    {resource.replace('-', ' ')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {typeof perm === 'string' ? perm : perm.name || perm.key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Metadata</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div>
                <span className="font-medium">ID:</span> {template._id}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {format(new Date(template.updatedAt), 'MMM dd, yyyy HH:mm')}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
