'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { bookingApi, exportApi } from '@/lib/api';
import { downloadBlob } from '@/lib/export';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Download,
  Truck,
  CreditCard,
  UserCheck,
  Building2,
  TrendingUp,
  PackageCheck,
  Clock,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { BookingStats, TrendData } from '@/types';

// ─── Colour palette ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending: '#6366f1',
  confirmed: '#3b82f6',
  loading: '#f59e0b',
  intransit: '#8b5cf6',
  unloading: '#06b6d4',
  delivered: '#10b981',
  'pod-received': '#14b8a6',
  closed: '#22c55e',
  cancelled: '#ef4444',
};
const FALLBACK_COLORS = [
  '#6366f1',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#10b981',
  '#ef4444',
  '#06b6d4',
];

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border-muted/60">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('p-3 rounded-xl', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  // Analytics state
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    async function load() {
      setLoadingAnalytics(true);
      try {
        const [statsRes, trendsRes, statusRes] = await Promise.all([
          bookingApi.getStats(),
          bookingApi.getTrends({ days: 14 }),
          bookingApi.getStatusBreakdown(),
        ]);
        setStats(statsRes.data.data ?? null);
        setTrends(trendsRes.data.data ?? []);
        const breakdown = statusRes.data.data ?? {};
        setStatusBreakdown(
          Object.entries(breakdown)
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({ name, value }))
        );
      } catch {
        toast.error('Failed to load analytics data');
      } finally {
        setLoadingAnalytics(false);
      }
    }
    load();
  }, []);

  const handleExport = async (type: 'bookings' | 'payments' | 'drivers' | 'customers') => {
    setExportLoading(type);
    try {
      const params: Record<string, string> = {};
      if (dateRange.from) params.dateFrom = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange.to) params.dateTo = format(dateRange.to, 'yyyy-MM-dd');
      const response = await exportApi[type](params);
      const filename = `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      downloadBlob(response.data, filename);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded`);
    } catch {
      toast.error(`Failed to export ${type} report`);
    } finally {
      setExportLoading(null);
    }
  };

  const reports = [
    {
      id: 'bookings',
      title: 'Bookings Report',
      description: 'All bookings with status, route, material, payment info',
      icon: Truck,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      id: 'payments',
      title: 'Payments Report',
      description: 'Payment records with transaction details and status',
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'drivers',
      title: 'Driver Performance Report',
      description: 'Driver trips, ratings, and availability',
      icon: UserCheck,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      id: 'customers',
      title: 'Customer Report',
      description: 'Customer list with booking count and payment history',
      icon: Building2,
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Live metrics, booking trends, and Excel exports"
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Bookings"
          value={loadingAnalytics ? '—' : (stats?.total ?? 0)}
          icon={Truck}
          color="bg-indigo-50 text-indigo-600"
        />
        <KpiCard
          label="In Transit"
          value={loadingAnalytics ? '—' : (stats?.inTransit ?? 0)}
          icon={TrendingUp}
          color="bg-purple-50 text-purple-600"
        />
        <KpiCard
          label="Delivered"
          value={loadingAnalytics ? '—' : (stats?.delivered ?? 0)}
          icon={PackageCheck}
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="POD Pending"
          value={loadingAnalytics ? '—' : (stats?.podPending ?? 0)}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="New Requests"
          value={loadingAnalytics ? '—' : (stats?.newRequests ?? 0)}
          icon={PackageCheck}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="Assigned"
          value={loadingAnalytics ? '—' : (stats?.assigned ?? 0)}
          icon={Truck}
          color="bg-cyan-50 text-cyan-600"
        />
        <KpiCard
          label="Cancelled"
          value={loadingAnalytics ? '—' : (stats?.cancelled ?? 0)}
          icon={XCircle}
          color="bg-red-50 text-red-600"
        />
        <KpiCard
          label="Closed"
          value={loadingAnalytics ? '—' : '—'}
          icon={PackageCheck}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking trends — takes 2 cols */}
        <Card className="lg:col-span-2 border-muted/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Booking Trends (Last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                Loading…
              </div>
            ) : trends.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                No trend data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trends} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d) => {
                      const dt = new Date(d);
                      return isNaN(dt.getTime()) ? d : format(dt, 'dd MMM');
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v, name) => [v, name === 'bookings' ? 'Total' : 'Delivered']}
                    labelFormatter={(d) => {
                      const dt = new Date(d);
                      return isNaN(dt.getTime()) ? String(d) : format(dt, 'dd MMM yyyy');
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    name="Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="delivered"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Delivered"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown pie */}
        <Card className="border-muted/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                Loading…
              </div>
            ) : statusBreakdown.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {statusBreakdown.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={
                          STATUS_COLORS[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Daily bookings bar chart ── */}
      <Card className="border-muted/60">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Daily Booking Volume</CardTitle>
          <CardDescription>New bookings created per day over the last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAnalytics ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Loading…
            </div>
          ) : trends.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trends} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => {
                    const dt = new Date(d);
                    return isNaN(dt.getTime()) ? d : format(dt, 'dd MMM');
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(d) => {
                    const dt = new Date(d);
                    return isNaN(dt.getTime()) ? String(d) : format(dt, 'dd MMM yyyy');
                  }}
                />
                <Bar dataKey="bookings" fill="#6366f1" radius={[3, 3, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Export section ── */}
      <div className="pt-2">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Export Reports</h2>

        <Card className="mb-4 border-muted/60">
          <CardHeader>
            <CardTitle className="text-sm">Date Range Filter</CardTitle>
            <CardDescription>Leave empty for all-time data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full sm:w-60 justify-start text-left font-normal',
                      !dateRange.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange((r) => ({ ...r, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full sm:w-60 justify-start text-left font-normal',
                      !dateRange.to && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange((r) => ({ ...r, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="outline"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="transition-all hover:shadow-md border-muted/60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                    <div
                      className={cn(
                        'p-3 rounded-xl flex items-center justify-center',
                        report.color
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() =>
                      handleExport(report.id as 'bookings' | 'payments' | 'drivers' | 'customers')
                    }
                    disabled={exportLoading === report.id}
                    className="w-full"
                  >
                    {exportLoading === report.id ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Exporting…
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export to Excel
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
