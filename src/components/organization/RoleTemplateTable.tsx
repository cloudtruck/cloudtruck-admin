'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Users, Eye } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EditRoleTemplateModal } from './EditRoleTemplateModal';
import { RoleTemplateDetailDrawer } from './RoleTemplateDetailDrawer';
import { roleTemplateApi } from '@/lib/api';
import { toast } from 'sonner';
import type { RoleTemplate, ApiErrorResponse } from '@/types';
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

interface RoleTemplateTableProps {
  roleTemplates: RoleTemplate[];
  loading: boolean;
  onRefetch: () => void;
}

const categoryColors: Record<string, string> = {
  operations: 'bg-blue-100 text-blue-800',
  finance: 'bg-green-100 text-green-800',
  support: 'bg-purple-100 text-purple-800',
  management: 'bg-orange-100 text-orange-800',
  admin: 'bg-red-100 text-red-800',
  custom: 'bg-gray-100 text-gray-800',
};

export function RoleTemplateTable({ roleTemplates, loading, onRefetch }: RoleTemplateTableProps) {
  const [editingTemplate, setEditingTemplate] = useState<RoleTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<RoleTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<RoleTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      setDeleting(true);
      await roleTemplateApi.delete(deletingTemplate._id);
      toast.success('Role template deleted successfully');
      setDeletingTemplate(null);
      onRefetch();
    } catch (error: unknown) {
      const err = error as ApiErrorResponse;
      toast.error(err.response?.data?.message || 'Failed to delete role template');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (roleTemplates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No role templates found</p>
        <p className="text-sm text-gray-400 mt-2">Create your first role template to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Permissions</TableHead>
              <TableHead className="text-center">Employees</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roleTemplates.map((template) => (
              <TableRow key={template._id}>
                <TableCell className="font-medium">{template.templateName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={categoryColors[template.category]}>
                    {template.category}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-gray-600">
                  {template.description}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm text-gray-600">
                    {template.permissions.length}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {template.employeeCount || 0}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingTemplate(template)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingTemplate(template)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      {editingTemplate && (
        <EditRoleTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSuccess={() => {
            setEditingTemplate(null);
            onRefetch();
          }}
        />
      )}

      {/* View Drawer */}
      {viewingTemplate && (
        <RoleTemplateDetailDrawer
          template={viewingTemplate}
          onClose={() => setViewingTemplate(null)}
          onEdit={() => {
            setEditingTemplate(viewingTemplate);
            setViewingTemplate(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingTemplate?.templateName}&quot;?
              {deletingTemplate && deletingTemplate.employeeCount > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Warning: {deletingTemplate.employeeCount} employee(s) are using this template.
                  They will lose these permissions.
                </span>
              )}
              <span className="block mt-2">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <LoadingSpinner className="mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
