'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import type { Vehicle, Pagination } from '@/types';

interface VehicleTableProps {
  vehicles: Vehicle[] | undefined;
  loading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
}

export function VehicleTable({ vehicles, loading, pagination, onPageChange }: VehicleTableProps) {
  const columns = [
    {
      header: 'Vehicle Number',
      accessor: 'vehicleNumber',
      cell: (vehicle: Vehicle) => (
        <Link
          href={`/vehicles/${vehicle._id}`}
          className="font-semibold hover:underline text-lg"
        >
          {vehicle.vehicleNumber}
        </Link>
      ),
    },
    {
      header: 'Truck Type',
      accessor: 'truckType',
      cell: (vehicle: Vehicle) => (
        <div>
          <p className="font-medium">{vehicle.truckType}</p>
          <p className="text-sm text-muted-foreground capitalize">{vehicle.bodyType}</p>
        </div>
      ),
    },
    {
      header: 'Specifications',
      accessor: 'length',
      cell: (vehicle: Vehicle) => (
        <div className="text-sm space-y-1">
          <p>
            Length: {vehicle.length.value} {vehicle.length.unit}
          </p>
          <p>
            Capacity: {vehicle.capacity.value} {vehicle.capacity.unit}
          </p>
        </div>
      ),
    },
    {
      header: 'Owner/Driver',
      accessor: 'owner',
      cell: (vehicle: Vehicle) => (
        <div className="text-sm">
          {vehicle.owner && (
            <p>
              Owner:{' '}
              <Link href={`/drivers/${vehicle.owner._id}`} className="hover:underline">
                {vehicle.owner.name}
              </Link>
            </p>
          )}
          {vehicle.driver && (
            <p className="text-muted-foreground">
              Driver:{' '}
              <Link href={`/drivers/${vehicle.driver._id}`} className="hover:underline">
                {vehicle.driver.name}
              </Link>
            </p>
          )}
          {!vehicle.owner && !vehicle.driver && (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'availability',
      cell: (vehicle: Vehicle) => (
        <div className="flex flex-col gap-1">
          <VehicleStatusBadge status={vehicle.availability} />
          <VehicleStatusBadge status={vehicle.verificationStatus} className="text-[10px] px-1 h-4" />
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: '_id',
      cell: (vehicle: Vehicle) => (
        <Button asChild variant="outline" size="sm">
          <Link href={`/vehicles/${vehicle._id}`}>View Details</Link>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={vehicles}
      loading={loading}
      pagination={pagination}
      onPageChange={onPageChange}
    />
  );
}
