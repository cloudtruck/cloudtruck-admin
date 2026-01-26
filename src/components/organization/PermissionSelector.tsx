'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, CheckSquare, Square } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface Permission {
  _id: string;
  key: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

interface PermissionSelectorProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
}

export function PermissionSelector({ selectedPermissions, onChange }: PermissionSelectorProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      // Fetch from backend - you may need to add this endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/permissions`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setPermissions(data.data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Filter by search
  const filteredResources = Object.entries(permissionsByResource).filter(([resource, perms]) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      resource.toLowerCase().includes(searchLower) ||
      perms.some(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.key.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
    );
  });

  const handleTogglePermission = (permissionId: string) => {
    if (selectedPermissions.includes(permissionId)) {
      onChange(selectedPermissions.filter(id => id !== permissionId));
    } else {
      onChange([...selectedPermissions, permissionId]);
    }
  };

  const handleToggleResource = (resourcePerms: Permission[]) => {
    const resourceIds = resourcePerms.map(p => p._id);
    const allSelected = resourceIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      onChange(selectedPermissions.filter(id => !resourceIds.includes(id)));
    } else {
      const newPermissions = [...selectedPermissions];
      resourceIds.forEach(id => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id);
        }
      });
      onChange(newPermissions);
    }
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === permissions.length) {
      onChange([]);
    } else {
      onChange(permissions.map(p => p._id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  const allSelected = permissions.length > 0 && selectedPermissions.length === permissions.length;

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          {allSelected ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Deselect All
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4 mr-2" />
              Select All
            </>
          )}
        </Button>
      </div>

      {/* Permissions List */}
      <div className="max-h-96 overflow-y-auto">
        <Accordion type="multiple" className="w-full">
          {filteredResources.map(([resource, perms]) => {
            const resourceSelected = perms.every(p => selectedPermissions.includes(p._id));
            const resourcePartial = perms.some(p => selectedPermissions.includes(p._id)) && !resourceSelected;

            return (
              <AccordionItem key={resource} value={resource}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={resourceSelected}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = resourcePartial;
                        }
                      }}
                      onCheckedChange={() => handleToggleResource(perms)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="capitalize font-medium">
                      {resource.replace('-', ' ')}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {perms.filter(p => selectedPermissions.includes(p._id)).length} / {perms.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-6">
                    {perms.map((perm) => (
                      <div key={perm._id} className="flex items-start gap-2">
                        <Checkbox
                          id={perm._id}
                          checked={selectedPermissions.includes(perm._id)}
                          onCheckedChange={() => handleTogglePermission(perm._id)}
                        />
                        <label
                          htmlFor={perm._id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          <div className="font-medium">{perm.name}</div>
                          {perm.description && (
                            <div className="text-gray-500 text-xs">{perm.description}</div>
                          )}
                          <div className="text-gray-400 text-xs mt-1">
                            <code>{perm.key}</code>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No permissions found matching &quot;{search}&quot;
        </div>
      )}
    </div>
  );
}
