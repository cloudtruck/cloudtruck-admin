'use client';

import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { RoleTemplateTable } from '@/components/organization/RoleTemplateTable';
import { AddRoleTemplateModal } from '@/components/organization/AddRoleTemplateModal';
import { useRoleTemplates } from '@/hooks/useRoleTemplates';

const CATEGORIES = [
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'support', label: 'Support' },
  { value: 'management', label: 'Management' },
  { value: 'admin', label: 'Admin' },
  { value: 'custom', label: 'Custom' },
];

export default function RoleTemplatesPage() {
  const [category, setCategory] = useState<string>('all');
  const [isActive, setIsActive] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  const { templates: roleTemplates, loading, refetch } = useRoleTemplates({
    category: category === 'all' ? undefined : category,
    isActive: isActive === 'all' ? undefined : isActive === 'active',
  });

  const filteredTemplates = roleTemplates.filter(template => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      template.templateName.toLowerCase().includes(searchLower) ||
      template.description.toLowerCase().includes(searchLower)
    );
  });

  const handleClearFilters = () => {
    setCategory('all');
    setIsActive('all');
    setSearch('');
  };

  const hasActiveFilters = category !== 'all' || isActive !== 'all' || search;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Templates"
        description="Manage role templates and permissions"
        actions={
          <div className="flex gap-2">
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <AddRoleTemplateModal onSuccess={refetch} />
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search role templates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={isActive} onValueChange={setIsActive}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="ghost" size="sm">
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {filteredTemplates.length} of {roleTemplates.length} role templates
              </span>
            </div>

            {/* Table */}
            <RoleTemplateTable
              roleTemplates={filteredTemplates}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
