'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { DriverStatusBadge } from './DriverStatusBadge';
import { DriverActions } from './DriverActions';
import type { Driver, Pagination } from '@/types';
import { formatDistance } from 'date-fns';

interface DriverTableProps {
  drivers: Driver[] | undefined;
  loading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onRefresh: () => void;
}

export function DriverTable({ drivers, loading, pagination, onPageChange, onRefresh }: DriverTableProps) {
  const columns = [
    {
      header: 'Driver',
      accessor: 'name',
      cell: (driver: Driver) => {
        const initials = driver.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={driver.profilePhoto} alt={driver.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/drivers/${driver._id}`}
                className="font-medium hover:underline"
              >
                {driver.name}
              </Link>
              <p className="text-sm text-muted-foreground">{driver.phone}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (driver: Driver) => <DriverStatusBadge status={driver.status} />,
    },
    {
      header: 'Verification',
      accessor: 'isVerified',
      cell: (driver: Driver) => {
        const variant = driver.isVerified
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-yellow-100 text-yellow-800 border-yellow-200';
        const text = driver.isVerified ? 'Verified' : 'Pending';

        return (
          <Badge variant="outline" className={variant}>
            {text}
          </Badge>
        );
      },
    },
    {
      header: 'Truck Types',
      accessor: 'preferredTruckTypes',
      cell: (driver: Driver) => (
        <div className="flex flex-wrap gap-1">
          {driver.preferredTruckTypes && driver.preferredTruckTypes.length > 0 ? (
            driver.preferredTruckTypes.slice(0, 2).map((type) => (
              <span
                key={type}
                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
              >
                {type}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
          {driver.preferredTruckTypes && driver.preferredTruckTypes.length > 2 && (
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
              +{driver.preferredTruckTypes.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Total Trips',
      accessor: 'totalTrips',
      cell: (driver: Driver) => (
        <span className="text-sm">{driver.totalTrips || 0}</span>
      ),
    },
    {
      header: 'Last Active',
      accessor: 'lastActive',
      cell: (driver: Driver) => (
        <span className="text-sm text-muted-foreground">
          {driver.lastActive
            ? formatDistance(new Date(driver.lastActive), new Date(), { addSuffix: true })
            : '-'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      cell: (driver: Driver) => (
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/drivers/${driver._id}`}>View</Link>
          </Button>
          <DriverActions driver={driver} onSuccess={onRefresh} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={drivers}
      loading={loading}
      pagination={pagination}
      onPageChange={onPageChange}
    />
  );
}
