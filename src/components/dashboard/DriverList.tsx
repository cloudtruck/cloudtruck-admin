'use client';

import { Inbox, Search, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { toCsvString, downloadCsv } from '@/lib/exportCsv';

export interface DriverRow {
  _id: string;
  name: string;
  phone: string;
  vehicleNumber?: string;
  truckType?: string;
  appInstalled: boolean;
  availability: string;
  trips: number;
  podPending: number;
  podReceived: number;
  sIn: number; // reached-pickup count
  sInPct: number;
  sOut: number; // loaded count
  sOutPct: number;
  dIn: number; // reached-destination count
  dInPct: number;
  dOut: number; // delivered count
  dOutPct: number;
}

interface DriverListProps {
  drivers: DriverRow[];
  loading?: boolean;
}

const AVAIL_BADGE: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  'on-trip': 'bg-blue-50 text-blue-700',
  offline: 'bg-gray-100 text-gray-500',
};

function Th({ children, search }: { children: React.ReactNode; search?: boolean }) {
  return (
    <th className="px-3 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 border-b border-gray-100">
      {search ? (
        <div className="flex items-center gap-1">
          {children}
          <Search className="h-2.5 w-2.5 opacity-40" />
        </div>
      ) : (
        children
      )}
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

function PctCell({ count, pct, good }: { count: number; pct: number; good?: boolean }) {
  const color = good
    ? pct >= 80
      ? 'text-green-600'
      : pct >= 50
        ? 'text-yellow-600'
        : 'text-red-500'
    : 'text-gray-700';
  return (
    <Td>
      <span className={cn('font-medium', color)}>{count}</span>
      <span className="text-gray-400 ml-1 text-[10px]">({pct}%)</span>
    </Td>
  );
}

export function DriverList({ drivers, loading }: DriverListProps) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? drivers.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          (d.vehicleNumber || '').toLowerCase().includes(query.toLowerCase())
      )
    : drivers;

  function handleExport() {
    const headers = [
      'Captain',
      'Phone',
      'Truck No',
      'Truck Type',
      'Status',
      'App Installed',
      'Trips',
      'POD Pending',
      'POD Received',
      'S-in',
      'S-in%',
      'S-out',
      'S-out%',
      'D-in',
      'D-in%',
      'D-out',
      'D-out%',
    ];
    const rows = filtered.map((d) => [
      d.name,
      d.phone,
      d.vehicleNumber || '',
      d.truckType || '',
      d.availability,
      d.appInstalled ? 'Yes' : 'No',
      d.trips,
      d.podPending,
      d.podReceived,
      d.sIn,
      `${d.sInPct}%`,
      d.sOut,
      `${d.sOutPct}%`,
      d.dIn,
      `${d.dInPct}%`,
      d.dOut,
      `${d.dOutPct}%`,
    ]);
    downloadCsv('drivers.csv', toCsvString(headers, rows));
  }

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
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Drivers</span>
        <div className="relative ml-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search truck / driver..."
            className="text-xs border border-gray-200 rounded pl-6 pr-6 py-1 w-44 focus:outline-none focus:border-blue-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex-1" />
        <FileText
          aria-label="Export"
          onClick={handleExport}
          className="h-4 w-4 text-green-600 cursor-pointer hover:text-green-700"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Inbox className="h-12 w-12 mb-2 opacity-30" />
          <p className="text-sm">{query ? 'No matching drivers' : 'No data'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <Th>Captain</Th>
                <Th>Truck No</Th>
                <Th>Truck Type</Th>
                <Th>Status</Th>
                <Th>App Installed</Th>
                <Th>Trips</Th>
                <Th>POD Pending</Th>
                <Th>POD Received</Th>
                <Th>S-in</Th>
                <Th>S-in%</Th>
                <Th>S-out</Th>
                <Th>S-out%</Th>
                <Th>D-in</Th>
                <Th>D-in%</Th>
                <Th>D-out</Th>
                <Th>D-out%</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr
                  key={d._id}
                  className={cn(
                    'hover:bg-blue-50/30 transition-colors',
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                  )}
                >
                  <Td>
                    <Link
                      href={`/drivers/${d._id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {d.name}
                    </Link>
                    <span className="block text-gray-400 text-[10px]">{d.phone}</span>
                  </Td>
                  <Td className="font-medium">{d.vehicleNumber || '—'}</Td>
                  <Td>{d.truckType || '—'}</Td>
                  <Td>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-medium',
                        AVAIL_BADGE[d.availability] || 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {d.availability}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-medium',
                        d.appInstalled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      )}
                    >
                      {d.appInstalled ? 'Yes' : 'No'}
                    </span>
                  </Td>
                  <Td className="font-semibold text-gray-800">{d.trips}</Td>
                  <Td
                    className={cn(
                      'font-medium',
                      d.podPending > 0 ? 'text-red-500' : 'text-gray-600'
                    )}
                  >
                    {d.podPending}
                  </Td>
                  <Td className="text-green-600 font-medium">{d.podReceived}</Td>
                  {/* S-in / S-out / D-in / D-out */}
                  <Td>{d.sIn}</Td>
                  <Td>
                    <span
                      className={cn(
                        'font-medium',
                        d.sInPct >= 80 ? 'text-green-600' : 'text-yellow-600'
                      )}
                    >
                      {d.sInPct}%
                    </span>
                  </Td>
                  <Td>{d.sOut}</Td>
                  <Td>
                    <span
                      className={cn(
                        'font-medium',
                        d.sOutPct >= 80 ? 'text-green-600' : 'text-yellow-600'
                      )}
                    >
                      {d.sOutPct}%
                    </span>
                  </Td>
                  <Td>{d.dIn}</Td>
                  <Td>
                    <span
                      className={cn(
                        'font-medium',
                        d.dInPct >= 80 ? 'text-green-600' : 'text-yellow-600'
                      )}
                    >
                      {d.dInPct}%
                    </span>
                  </Td>
                  <Td>{d.dOut}</Td>
                  <Td>
                    <span
                      className={cn(
                        'font-medium',
                        d.dOutPct >= 80 ? 'text-green-600' : 'text-yellow-600'
                      )}
                    >
                      {d.dOutPct}%
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
