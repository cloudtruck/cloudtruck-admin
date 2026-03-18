'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { ArrowUpDown, Search, Inbox } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MaintenanceRecord {
  _id: string;
  truck?: string;
  date?: string;
  createdBy?: string;
  billNumber?: string;
  serviceProvider?: string;
  type?: string;
  km?: number;
  remarks?: string;
  amount?: number;
  payment?: number;
  balance?: number;
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface MaintenanceTabTableProps {
  records?: MaintenanceRecord[];
  loading?: boolean;
}

export function MaintenanceTabTable({ records = [], loading }: MaintenanceTabTableProps) {
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
          <TableRow className="bg-white border-b">
            <TableHead className="text-xs font-semibold text-gray-600 w-16">
              <span className="flex items-center gap-1.5">
                Action
                <span className="text-green-600 border border-green-400 rounded px-1 py-0.5 text-[10px] leading-none cursor-pointer hover:bg-green-50">
                  ↓
                </span>
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                Truck <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                <Search className="h-3 w-3 text-gray-400" /> Date
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3 text-gray-400" /> Created By
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Bill Number</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Service Provider</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                <Search className="h-3 w-3 text-gray-400" /> Type
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                <Search className="h-3 w-3 text-gray-400" /> KM
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600">Remarks</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 text-right">Amount</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 text-right">Payment</TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Inbox className="h-10 w-10 opacity-30" />
                  <span className="text-sm">No data</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            records.map((r) => (
              <TableRow key={r._id} className="hover:bg-gray-50">
                <TableCell className="py-2 text-sm text-gray-400">•••</TableCell>
                <TableCell className="text-sm font-medium text-blue-600">{r.truck || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">{r.date || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">{r.createdBy || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">{r.billNumber || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">{r.serviceProvider || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">{r.type || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700">{r.km != null ? `${r.km.toLocaleString()} km` : '—'}</TableCell>
                <TableCell className="text-sm text-gray-600">{r.remarks || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700 text-right">
                  {r.amount != null ? `₹${r.amount.toLocaleString()}` : '—'}
                </TableCell>
                <TableCell className="text-sm text-gray-700 text-right">
                  {r.payment != null ? `₹${r.payment.toLocaleString()}` : '—'}
                </TableCell>
                <TableCell className={`text-sm text-right font-medium ${r.balance ? 'text-red-500' : 'text-gray-700'}`}>
                  {r.balance != null ? `₹${r.balance.toLocaleString()}` : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
