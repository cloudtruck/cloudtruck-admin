'use client';

import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Inbox, Settings2, Filter, Search } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FuelStation {
  _id: string;
  name: string;
  branch?: string;
  location?: string;
  city?: string;
  rate?: number;
  outstanding?: number;
  status?: 'active' | 'inactive';
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50 pointer-events-none">
          {label}
        </span>
      )}
    </span>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface FuelTabTableProps {
  stations?: FuelStation[];
  loading?: boolean;
}

export function FuelTabTable({ stations = [], loading }: FuelTabTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded border p-8 text-center text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-white rounded border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b">
            <TableHead className="text-xs font-semibold text-gray-600 w-24">
              <span className="flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5" /> Action
                <span className="ml-1 text-green-600 border border-green-400 rounded px-1 py-0.5 text-[10px] leading-none cursor-pointer hover:bg-green-50">
                  ↓
                </span>
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 w-24">ID</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                Fuel Station <Search className="h-3 w-3 text-gray-400" />
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                <Filter className="h-3 w-3 text-gray-400" /> Branch
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                <Filter className="h-3 w-3 text-gray-400" /> Location
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">City</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Rate</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Outstanding</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                Status <Filter className="h-3 w-3 text-gray-400" />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Inbox className="h-10 w-10 opacity-30" />
                  <span className="text-sm">No data</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            stations.map((station, idx) => (
              <TableRow key={station._id} className="hover:bg-gray-50">
                <TableCell className="py-2">
                  <Tooltip label="View">
                    <button className="text-blue-400 hover:text-blue-600 p-0.5 text-xs">•••</button>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {String(idx + 1).padStart(3, '0')}
                </TableCell>
                <TableCell className="text-sm font-medium text-gray-800">{station.name}</TableCell>
                <TableCell className="text-sm text-gray-600">{station.branch || '—'}</TableCell>
                <TableCell className="text-sm text-gray-600">{station.location || '—'}</TableCell>
                <TableCell className="text-sm text-gray-600">{station.city || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">
                  {station.rate != null ? `₹${station.rate}/L` : '—'}
                </TableCell>
                <TableCell className="text-sm text-gray-700">
                  {station.outstanding != null ? `₹${station.outstanding.toLocaleString()}` : '—'}
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    station.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {station.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
