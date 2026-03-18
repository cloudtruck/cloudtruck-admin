'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Inbox, FileText, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/types';
import { toCsvString, downloadCsv } from '@/lib/exportCsv';

export interface AvailableVehicleRow {
  vehicle: Vehicle;
  /** Hours since truck was last unloaded (from stats.lastTripDate) */
  unloadedHrsAgo?: number;
  /** Hours truck has been available (TAT) */
  availableTatHrs?: number;
  driverName?: string;
  driverPhone?: string;
  city?: string;
  region?: string;
  lastComment?: string;
}

interface AvailableListProps {
  rows: AvailableVehicleRow[];
  loading?: boolean;
  selectedRing?: string;
}

type SortKey = 'availableTatHrs' | 'unloadedHrsAgo';

const AVAIL_BADGE: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  'on-trip': 'bg-blue-50 text-blue-700',
  maintenance: 'bg-yellow-50 text-yellow-700',
  offline: 'bg-gray-100 text-gray-500',
};

const OWN_LABEL: Record<string, string> = {
  own: 'Own',
  leased: 'Leased',
  attached: 'Attached',
};

function fmtHrs(hrs?: number) {
  if (hrs == null || isNaN(hrs)) return '—';
  if (hrs < 1) return `${Math.round(hrs * 60)}m`;
  if (hrs < 24) return `${Math.round(hrs)}h`;
  return `${Math.floor(hrs / 24)}d ${Math.round(hrs % 24)}h`;
}

function Th({
  children,
  sortKey,
  currentSort,
  onSort,
}: {
  children: React.ReactNode;
  sortKey?: SortKey;
  currentSort?: SortKey;
  onSort?: (k: SortKey) => void;
}) {
  return (
    <th
      onClick={sortKey && onSort ? () => onSort(sortKey) : undefined}
      className={cn(
        'px-3 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 border-b border-gray-100',
        sortKey && 'cursor-pointer hover:text-gray-700'
      )}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortKey && (
          <ArrowUpDown
            className={cn('h-2.5 w-2.5', currentSort === sortKey ? 'text-blue-500' : 'opacity-30')}
          />
        )}
      </div>
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={cn(
        'px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap border-b border-gray-50',
        className
      )}
    >
      {children}
    </td>
  );
}

/** Build chart data from vehicle rows — availability bucket counts */
function buildChartData(rows: AvailableVehicleRow[]) {
  let avGt24 = 0,
    avLt24 = 0,
    unavLt7 = 0,
    unavGt7 = 0,
    active = 0;
  for (const r of rows) {
    const { vehicle, availableTatHrs } = r;
    if (vehicle.availability === 'on-trip') {
      active++;
      continue;
    }
    if (vehicle.availability === 'available') {
      if ((availableTatHrs ?? 0) > 24) avGt24++;
      else avLt24++;
    } else {
      // maintenance / offline = unavailable
      const hrsUnavail = availableTatHrs ?? 0;
      if (hrsUnavail < 7 * 24) unavLt7++;
      else unavGt7++;
    }
  }
  return [
    {
      name: 'Available',
      'Available > 24H': avGt24,
      'Available < 24H': avLt24,
      'Unavailable < 7': unavLt7,
      'Unavailable > 7': unavGt7,
      Active: active,
    },
    {
      name: 'Unavailable',
      'Available > 24H': 0,
      'Available < 24H': 0,
      'Unavailable < 7': unavLt7,
      'Unavailable > 7': unavGt7,
      Active: 0,
    },
  ];
}

const CHART_COLORS = {
  'Available > 24H': '#3b82f6',
  'Available < 24H': '#22c55e',
  'Unavailable < 7': '#f59e0b',
  'Unavailable > 7': '#f97316',
  Active: '#bae6fd',
};

export function AvailableList({ rows, loading, selectedRing }: AvailableListProps) {
  const showTat = selectedRing !== 'ring4';
  const [tab, setTab] = useState<'live' | 'chart'>('live');
  const [sortKey, setSortKey] = useState<SortKey>('availableTatHrs');

  function handleExport() {
    const headers = [
      'Id',
      'Truck',
      'Truck Type',
      'Ownership',
      'Unloaded (hrs ago)',
      'Status',
      'Available TAT (hrs)',
      'Driver',
      'Mobile',
      'City',
      'Region',
      'Last Comments',
    ];
    const csvRows = sorted.map((r) => [
      r.vehicle._id.slice(-6).toUpperCase(),
      r.vehicle.vehicleNumber || '',
      r.vehicle.truckType || '',
      r.vehicle.ownershipType ? OWN_LABEL[r.vehicle.ownershipType] || r.vehicle.ownershipType : '',
      r.unloadedHrsAgo != null ? r.unloadedHrsAgo.toFixed(1) : '',
      r.vehicle.availability,
      r.availableTatHrs != null ? r.availableTatHrs.toFixed(1) : '',
      r.driverName || '',
      r.driverPhone || '',
      r.city || '',
      r.region || '',
      r.lastComment || '',
    ]);
    downloadCsv('available-vehicles.csv', toCsvString(headers, csvRows));
  }

  const sorted = [...rows].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    return bVal - aVal; // descending — longest TAT / unloaded first
  });

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Tab bar + export */}
      <div className="flex items-center gap-6 px-4 border-b border-gray-100 bg-white">
        {(['live', 'chart'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div className="flex-1" />
        <FileText
          className="h-4 w-4 text-green-600 cursor-pointer hover:text-green-700"
          aria-label="Export"
          onClick={handleExport}
        />
      </div>

      {tab === 'live' ? (
        rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Inbox className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">No data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <Th>Id</Th>
                  <Th>Truck</Th>
                  <Th>Truck Type</Th>
                  <Th>Ownership</Th>
                  <Th sortKey="unloadedHrsAgo" currentSort={sortKey} onSort={setSortKey}>
                    Unloaded
                  </Th>
                  <Th>Status</Th>
                  {showTat && (
                    <Th sortKey="availableTatHrs" currentSort={sortKey} onSort={setSortKey}>
                      Available TAT
                    </Th>
                  )}
                  <Th>Driver</Th>
                  <Th>Mobile</Th>
                  <Th>City</Th>
                  <Th>Region</Th>
                  <Th>Last Comments</Th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  const v = r.vehicle;
                  const tatHrs = r.availableTatHrs;
                  const tatColor =
                    tatHrs == null
                      ? 'text-gray-500'
                      : tatHrs > 24
                        ? 'text-red-500 font-semibold'
                        : tatHrs > 12
                          ? 'text-yellow-600'
                          : 'text-green-600';
                  return (
                    <tr
                      key={v._id}
                      className={cn(
                        'hover:bg-blue-50/30 transition-colors',
                        i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                      )}
                    >
                      <Td className="text-[10px]">
                        <Link
                          href={`/vehicles/${v._id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {v._id.slice(-6).toUpperCase()}
                        </Link>
                      </Td>
                      <Td>
                        <Link
                          href={`/vehicles/${v._id}`}
                          className="font-medium text-gray-800 hover:text-blue-600 hover:underline"
                        >
                          {v.vehicleNumber || '—'}
                        </Link>
                      </Td>
                      <Td>{v.truckType || '—'}</Td>
                      <Td>
                        {v.ownershipType ? OWN_LABEL[v.ownershipType] || v.ownershipType : '—'}
                      </Td>
                      <Td>{fmtHrs(r.unloadedHrsAgo)} ago</Td>
                      <Td>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-medium',
                            AVAIL_BADGE[v.availability] || 'bg-gray-100 text-gray-500'
                          )}
                        >
                          {v.availability}
                        </span>
                      </Td>
                      {showTat && <Td className={tatColor}>{fmtHrs(tatHrs)}</Td>}
                      <Td>{r.driverName || '—'}</Td>
                      <Td>{r.driverPhone || '—'}</Td>
                      <Td>{r.city || '—'}</Td>
                      <Td>{r.region || '—'}</Td>
                      <Td className="max-w-[180px] truncate text-gray-500">
                        {r.lastComment || '—'}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Chart tab */
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={buildChartData(rows)}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {(Object.keys(CHART_COLORS) as (keyof typeof CHART_COLORS)[]).map((key) => (
                <Bar key={key} dataKey={key} stackId="a" fill={CHART_COLORS[key]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
