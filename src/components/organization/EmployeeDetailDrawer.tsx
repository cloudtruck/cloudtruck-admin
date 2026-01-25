'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Staff } from '@/types';
import { format } from 'date-fns';
import { Mail, Phone, Calendar, Shield, Building2, CheckCircle2 } from 'lucide-react';

interface EmployeeDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Staff;
}

export function EmployeeDetailDrawer({ isOpen, onClose, employee }: EmployeeDetailDrawerProps) {
  const getRoleBadge = (role?: string) => {
    if (!role) return <Badge variant="outline">N/A</Badge>;
    const colors: Record<string, string> = {
      'super-admin': 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      operations: 'bg-green-100 text-green-800',
      staff: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">N/A</Badge>;
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      blocked: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Name</span>
                <span className="text-sm text-gray-600">{employee.name}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </span>
                <span className="text-sm text-gray-600">{employee.email}</span>
              </div>

              {employee.phone && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Phone
                    </span>
                    <span className="text-sm text-gray-600">{employee.phone}</span>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Department
                </span>
                <span className="text-sm text-gray-600">
                  {employee.department
                    ? employee.department.charAt(0).toUpperCase() + employee.department.slice(1)
                    : 'N/A'}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Role
                </span>
                {getRoleBadge(employee.role)}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {getStatusBadge(employee.status)}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Joined
                </span>
                <span className="text-sm text-gray-600">
                  {employee.createdAt
                    ? format(new Date(employee.createdAt), 'MMM d, yyyy')
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Role Template */}
          {employee.roleTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Role Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Template</span>
                    <Badge variant="outline">
                      {typeof employee.roleTemplate === 'string'
                        ? employee.roleTemplate
                        : employee.roleTemplate.templateName}
                    </Badge>
                  </div>
                  {typeof employee.roleTemplate === 'object' && (
                    <>
                      <Separator />
                      <p className="text-sm text-gray-600">{employee.roleTemplate.description}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.permissions && employee.permissions.length > 0 ? (
                <div className="space-y-2">
                  {employee.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">{permission}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No specific permissions assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
