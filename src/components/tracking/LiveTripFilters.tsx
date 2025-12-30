'use client';

import { Search, X } from 'lucide-react';
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

interface LiveTripFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function LiveTripFilters({
  searchQuery,
  onSearchChange,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  hasActiveFilters,
}: LiveTripFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search by booking ID, customer, driver..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="max-w-md"
            />
            <Button onClick={onSearch} size="icon" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="driver-en-route">En Route to Pickup</SelectItem>
                <SelectItem value="reached-pickup">At Pickup</SelectItem>
                <SelectItem value="loaded">Loaded</SelectItem>
                <SelectItem value="in-transit">In Transit</SelectItem>
                <SelectItem value="reached-destination">At Destination</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button onClick={onClearFilters} variant="ghost" size="sm">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
