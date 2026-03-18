'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Download, Inbox } from 'lucide-react';
import { toCsvString, downloadCsv } from '@/lib/exportCsv';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
} from 'recharts';

export interface BranchKpiRow {
  branch: string;
  total: number;
  closed: number;
  closedPct: number;
  ontime: number;
  ontimePct: number;
  failed: number;
  failedPct: number;
  cancelled: number;
  cancelledPct: number;
}

export interface HistoryKpiRow {
  date: string;
  total: number;
  closed: number;
  closedPct: number;
  ontime: number;
  ontimePct: number;
  failed: number;
  failedPct: number;
  cancelled: number;
  cancelledPct: number;
}

interface BranchKpiTableProps {
  liveData: BranchKpiRow[];
  historyData: HistoryKpiRow[];
  loading?: boolean;
}

type BranchSortKey = keyof BranchKpiRow;
type HistorySortKey = keyof HistoryKpiRow;
type SortDir = 'asc' | 'desc';

const pctColor = (v: number, invert = false) => {
  if (invert) return v === 0 ? 'text-green-600' : v < 10 ? 'text-yellow-600' : 'text-red-500';
  return v >= 80 ? 'text-green-600' : v >= 50 ? 'text-yellow-600' : 'text-gray-600';
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Inbox className="h-12 w-12 mb-2 opacity-30" />
      <p className="text-sm">No data</p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

export function BranchKpiTable({ liveData, historyData, loading }: BranchKpiTableProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [branchSortKey, setBranchSortKey] = useState<BranchSortKey>('branch');
  const [branchSortDir, setBranchSortDir] = useState<SortDir>('asc');
  const [historySortKey, setHistorySortKey] = useState<HistorySortKey>('date');
  const [historySortDir, setHistorySortDir] = useState<SortDir>('desc');

  const handleBranchSort = (key: BranchSortKey) => {
    if (branchSortKey === key) setBranchSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setBranchSortKey(key);
      setBranchSortDir('asc');
    }
  };

  const handleHistorySort = (key: HistorySortKey) => {
    if (historySortKey === key) setHistorySortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setHistorySortKey(key);
      setHistorySortDir('asc');
    }
  };

  const sortBranch = (data: BranchKpiRow[]) =>
    [...data].sort((a, b) => {
      const av = a[branchSortKey],
        bv = b[branchSortKey];
      const cmp =
        typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return branchSortDir === 'asc' ? cmp : -cmp;
    });

  const sortHistory = (data: HistoryKpiRow[]) =>
    [...data].sort((a, b) => {
      const av = a[historySortKey],
        bv = b[historySortKey];
      const cmp =
        typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return historySortDir === 'asc' ? cmp : -cmp;
    });

  const branchColumns: { key: BranchSortKey; label: string }[] = [
    { key: 'branch', label: 'Branch' },
    { key: 'total', label: 'Total' },
    { key: 'closed', label: 'Closed' },
    { key: 'closedPct', label: 'Closed %' },
    { key: 'ontime', label: 'Ontime' },
    { key: 'ontimePct', label: 'Ontime %' },
    { key: 'failed', label: 'Failed' },
    { key: 'failedPct', label: 'Failed %' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'cancelledPct', label: 'Cancelled %' },
  ];

  const historyColumns: { key: HistorySortKey; label: string }[] = [
    { key: 'date', label: 'Created Date' },
    { key: 'total', label: 'Total' },
    { key: 'closed', label: 'Closed' },
    { key: 'closedPct', label: 'Closed %' },
    { key: 'ontime', label: 'Ontime' },
    { key: 'ontimePct', label: 'Ontime %' },
    { key: 'failed', label: 'Failed' },
    { key: 'failedPct', label: 'Failed %' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'cancelledPct', label: 'Cancelled %' },
  ];

  const thClass =
    'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 whitespace-nowrap';

  const SortIcon = ({ active }: { active: boolean }) => (
    <ArrowUpDown className={cn('h-3 w-3 opacity-40', active && 'opacity-100 text-blue-600')} />
  );

  const renderLiveTable = () => {
    if (loading) return <SkeletonRows />;
    if (!liveData.length) return <EmptyState />;
    const sorted = sortBranch(liveData);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {branchColumns.map((col) => (
                <th key={col.key} className={thClass} onClick={() => handleBranchSort(col.key)}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon active={branchSortKey === col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{row.branch}</td>
                <td className="px-4 py-3 text-gray-600">{row.total}</td>
                <td className="px-4 py-3 text-gray-600">{row.closed}</td>
                <td className="px-4 py-3">
                  <span className={cn('font-medium', pctColor(row.closedPct))}>
                    {row.closedPct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.ontime}</td>
                <td className="px-4 py-3">
                  <span className={cn('font-medium', pctColor(row.ontimePct))}>
                    {row.ontimePct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.failed}</td>
                <td className="px-4 py-3">
                  <span className={cn('font-medium', pctColor(row.failedPct, true))}>
                    {row.failedPct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.cancelled}</td>
                <td className="px-4 py-3">
                  <span className={cn('font-medium', pctColor(row.cancelledPct, true))}>
                    {row.cancelledPct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (loading) return <SkeletonRows />;
    if (!historyData.length) return <EmptyState />;

    // Sort by date asc for chart
    const chartData = [...historyData].sort((a, b) => a.date.localeCompare(b.date));
    const sorted = sortHistory(historyData);

    return (
      <div>
        {/* Bar + Line Composed Chart */}
        <div className="px-4 pt-4 pb-2">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#d1d5db" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#d1d5db" />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                stroke="#d1d5db"
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="total" name="Total" fill="#3b82f6" barSize={28} />
              <Bar yAxisId="left" dataKey="closed" name="Closed" fill="#1e3a5f" barSize={28} />
              <Bar yAxisId="left" dataKey="ontime" name="Ontime" fill="#86efac" barSize={28} />
              <Bar yAxisId="left" dataKey="failed" name="Failed" fill="#d1fae5" barSize={28} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="failedPct"
                name="Failed %"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Bar
                yAxisId="left"
                dataKey="cancelled"
                name="Cancelled"
                fill="#1e3a5f"
                barSize={28}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {historyColumns.map((col) => (
                  <th key={col.key} className={thClass} onClick={() => handleHistorySort(col.key)}>
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon active={historySortKey === col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.date}</td>
                  <td className="px-4 py-3 text-gray-600">{row.total}</td>
                  <td className="px-4 py-3 text-gray-600">{row.closed}</td>
                  <td className="px-4 py-3">
                    <span className={cn('font-medium', pctColor(row.closedPct))}>
                      {row.closedPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.ontime}</td>
                  <td className="px-4 py-3">
                    <span className={cn('font-medium', pctColor(row.ontimePct))}>
                      {row.ontimePct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.failed}</td>
                  <td className="px-4 py-3">
                    <span className={cn('font-medium', pctColor(row.failedPct, true))}>
                      {row.failedPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.cancelled}</td>
                  <td className="px-4 py-3">
                    <span className={cn('font-medium', pctColor(row.cancelledPct, true))}>
                      {row.cancelledPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const KPI_HEADERS = [
    'Branch/Date',
    'Total',
    'Closed',
    'Closed %',
    'Ontime',
    'Ontime %',
    'Failed',
    'Failed %',
    'Cancelled',
    'Cancelled %',
  ];

  function handleExport() {
    if (activeTab === 'live') {
      const rows = liveData.map((r) => [
        r.branch,
        r.total,
        r.closed,
        `${r.closedPct}%`,
        r.ontime,
        `${r.ontimePct}%`,
        r.failed,
        `${r.failedPct}%`,
        r.cancelled,
        `${r.cancelledPct}%`,
      ]);
      downloadCsv('branch-kpi-live.csv', toCsvString(KPI_HEADERS, rows));
    } else {
      const rows = historyData.map((r) => [
        r.date,
        r.total,
        r.closed,
        `${r.closedPct}%`,
        r.ontime,
        `${r.ontimePct}%`,
        r.failed,
        `${r.failedPct}%`,
        r.cancelled,
        `${r.cancelledPct}%`,
      ]);
      downloadCsv('branch-kpi-history.csv', toCsvString(KPI_HEADERS, rows));
    }
  }

  return (
    <Card className="shadow-none border border-gray-200">
      <Tabs value={activeTab}>
        <div className="flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex gap-6">
            {(['live', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="text-green-600 hover:text-green-700 h-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <TabsContent value="live" className="m-0">
          {activeTab === 'live' && renderLiveTable()}
        </TabsContent>
        <TabsContent value="history" className="m-0">
          {activeTab === 'history' && renderHistoryTab()}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
