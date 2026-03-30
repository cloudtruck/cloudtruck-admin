'use client';

import Link from 'next/link';
import { Phone, Building2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import type { Supplier } from '@/types';

interface SupplierCardProps {
  supplier: Supplier;
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  const initials = supplier.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-base">{supplier.displayName}</h3>
            {supplier.companyName && (
              <p className="text-xs text-muted-foreground">{supplier.companyName}</p>
            )}
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {supplier.phone}
            </p>
          </div>
        </div>
        <SupplierStatusBadge status={supplier.verificationStatus} />
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {supplier.fleetStats.totalDrivers} driver
              {supplier.fleetStats.totalDrivers !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="capitalize">{supplier.supplierType}</span>
          </div>
        </div>

        {supplier.city && (
          <p className="text-xs text-gray-500">{supplier.city}</p>
        )}

        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/suppliers/${supplier._id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
