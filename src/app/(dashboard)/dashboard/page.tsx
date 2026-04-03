'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { bookingApi, driverApi, vehicleApi } from '@/lib/api';
import { logger } from '@/lib/logger';
import { getCityRegion } from '@/lib/cityRegionMap';
import { toCsvString, downloadCsv } from '@/lib/exportCsv';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PipelineCard, PipelineCardProps, RingType } from '@/components/dashboard/PipelineCard';
import { IndentList } from '@/components/dashboard/IndentList';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Activity, Booking, TrendData, Vehicle } from '@/types';
// Type-only imports (no runtime cost)
import type { BranchKpiRow, HistoryKpiRow } from '@/components/dashboard/BranchKpiTable';
import type { DriverRow } from '@/components/dashboard/DriverList';
import type { AvailableVehicleRow } from '@/components/dashboard/AvailableList';

// Lazy-loaded components — deferred until needed, keeps initial bundle small
const BranchKpiTable = dynamic(
  () =>
    import('@/components/dashboard/BranchKpiTable').then((m) => ({ default: m.BranchKpiTable })),
  { ssr: false }
);
const BookingTrendsChart = dynamic(
  () =>
    import('@/components/dashboard/BookingTrendsChart').then((m) => ({
      default: m.BookingTrendsChart,
    })),
  { ssr: false }
);
const StatusDistributionChart = dynamic(
  () =>
    import('@/components/dashboard/StatusDistributionChart').then((m) => ({
      default: m.StatusDistributionChart,
    })),
  { ssr: false }
);
const DriverList = dynamic(
  () => import('@/components/dashboard/DriverList').then((m) => ({ default: m.DriverList })),
  { ssr: false }
);
const AvailableList = dynamic(
  () => import('@/components/dashboard/AvailableList').then((m) => ({ default: m.AvailableList })),
  { ssr: false }
);
const PodList = dynamic(
  () => import('@/components/dashboard/PodList').then((m) => ({ default: m.PodList })),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Ring filter helpers
// ---------------------------------------------------------------------------
const UNTRACKED_THRESHOLD_MS = 2 * 3600 * 1000; // no GPS update in >2H = untracked

/** Returns true if booking has no recent GPS tracking update */
function isUntracked(b: Booking): boolean {
  if (!b.lastLocationUpdate) return true;
  return Date.now() - new Date(b.lastLocationUpdate).getTime() > UNTRACKED_THRESHOLD_MS;
}

/** Hours since booking entered the current stage (createdAt for indents, statusHistory otherwise) */
function hoursInStage(b: Booking, entryStatuses: string[]): number {
  // Find the earliest matching status transition
  const entries = (b.statusHistory || [])
    .filter((h) => entryStatuses.includes(h.status))
    .map((h) => new Date(h.timestamp).getTime());
  const entryTime = entries.length ? Math.min(...entries) : new Date(b.createdAt).getTime();
  return (Date.now() - entryTime) / 3600000;
}

/**
 * Per-stage, per-ring filter definitions.
 * stageIdx → ringType → filter fn
 */
const RING_FILTERS: Record<number, Partial<Record<RingType, (b: Booking) => boolean>>> = {
  // Indents: ring1=Ontime (<12H created, not yet confirmed), ring2=>12H (waiting >12H)
  0: {
    ring1: (b) => hoursInStage(b, ['created', 'under-review']) < 12,
    ring2: (b) => hoursInStage(b, ['created', 'under-review']) >= 12,
  },
  // Confirmed: ring1=>12H waiting for loading to start
  1: {
    ring1: (b) => hoursInStage(b, ['assigned']) >= 12,
  },
  // Loading: ring1=>24H in loading stage, ring2=Untracked
  2: {
    ring1: (b) => hoursInStage(b, ['driver-en-route', 'reached-pickup', 'loaded']) >= 24,
    ring2: (b) => isUntracked(b),
  },
  // Intransit: ring1=>12H delay (in-transit >12H), ring2=Untracked
  3: {
    ring1: (b) => hoursInStage(b, ['in-transit']) >= 12,
    ring2: (b) => isUntracked(b),
  },
  // Unloading: ring1=>24H at destination, ring2=Untracked
  4: {
    ring1: (b) => hoursInStage(b, ['reached-destination']) >= 24,
    ring2: (b) => isUntracked(b),
  },
  // Delivered: ring1=Ontime (<24H to deliver), ring2=Untracked
  5: {
    ring1: (b) => hoursInStage(b, ['in-transit']) < 24,
    ring2: (b) => isUntracked(b),
  },
};

/** Per-stage ring labels */
const RING_LABEL_MAP: Record<number, Partial<Record<RingType, string>>> = {
  0: { ring1: 'Ontime', ring2: '>12H Pending' },
  1: { ring1: '>12H Pending Dispatch' },
  2: { ring1: '>24H Delayed', ring2: 'Untracked' },
  3: { ring1: '>12H Delay', ring2: 'Untracked' },
  4: { ring1: '>24H at Destination', ring2: 'Untracked' },
  5: { ring1: 'Ontime Delivered', ring2: 'Untracked' },
};

// ---------------------------------------------------------------------------
// StageIndentPanel — Live/History tabs (Total ring) or direct filtered list
// ---------------------------------------------------------------------------
interface StageIndentPanelProps {
  stageIdx: number;
  stageTitle: string;
  selectedRing: RingType;
  bookings: Booking[];
  loading: boolean;
  liveData: BranchKpiRow[];
  historyData: HistoryKpiRow[];
  loadingKpi: boolean;
}

// Column visibility per stage index
const STAGE_COLUMNS: Record<
  number,
  { showLrWeight: boolean; showLocation: boolean; showStageTats: boolean }
> = {
  0: { showLrWeight: false, showLocation: false, showStageTats: false }, // Indents
  1: { showLrWeight: false, showLocation: false, showStageTats: false }, // Confirmed
  2: { showLrWeight: true, showLocation: false, showStageTats: false }, // Loading
  3: { showLrWeight: true, showLocation: true, showStageTats: false }, // In Transit
  4: { showLrWeight: true, showLocation: false, showStageTats: false }, // Unloading
  5: { showLrWeight: true, showLocation: false, showStageTats: false }, // Delivered
};

function StageIndentPanel({
  stageIdx,
  stageTitle,
  selectedRing,
  bookings,
  loading,
  liveData,
  historyData,
  loadingKpi,
}: StageIndentPanelProps) {
  const [tab, setTab] = useState<'live' | 'history'>('live');

  const isIndentsStage = stageIdx === 0;
  const colFlags = STAGE_COLUMNS[stageIdx] ?? {
    showLrWeight: false,
    showLocation: false,
    showStageTats: false,
  };

  const filteredBookings = (() => {
    if (isIndentsStage || selectedRing === 'total') return bookings;
    const filterFn = RING_FILTERS[stageIdx]?.[selectedRing];
    return filterFn ? bookings.filter(filterFn) : bookings;
  })();

  const ringLabel =
    !isIndentsStage && selectedRing !== 'total'
      ? RING_LABEL_MAP[stageIdx]?.[selectedRing] || selectedRing
      : null;

  const listTitle = ringLabel ? `${stageTitle} — ${ringLabel}` : stageTitle;

  if (!isIndentsStage && selectedRing !== 'total') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <IndentList
          bookings={filteredBookings}
          loading={loading}
          stageTitle={listTitle}
          showActions={stageIdx !== 0}
          {...colFlags}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-6 px-4 border-b border-gray-100">
        {(['live', 'history'] as const).map((t) => (
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
      </div>

      {tab === 'live' ? (
        <IndentList
          bookings={filteredBookings}
          loading={loading}
          stageTitle={stageTitle}
          showActions={stageIdx !== 0}
          {...colFlags}
        />
      ) : (
        <BranchKpiTable liveData={liveData} historyData={historyData} loading={loadingKpi} />
      )}
    </div>
  );
}

interface StatusData {
  status: string;
  count: number;
  color: string;
}

// Circle color palette
const C = {
  green: { borderColor: '#22c55e', bgColor: '#dcfce7' },
  amber: { borderColor: '#f59e0b', bgColor: '#fef3c7' },
  blue: { borderColor: '#93c5fd', bgColor: '#eff6ff' },
  red: { borderColor: '#f87171', bgColor: '#fee2e2' },
  purple: { borderColor: '#c084fc', bgColor: '#f3e8ff' },
  teal: { borderColor: '#2dd4bf', bgColor: '#ccfbf1' },
};

// Maps each pipeline stage index to the booking statuses it represents
const STAGE_STATUSES: Record<number, string[]> = {
  0: ['created', 'under-review'], // Indents
  1: ['assigned'], // Confirmed
  2: ['driver-en-route', 'reached-pickup', 'loaded'], // Loading
  3: ['in-transit'], // Intransit
  4: ['reached-destination'], // Unloading
  5: ['delivered', 'pod-received', 'closed'], // Delivered
  8: ['delivered', 'pod-received', 'closed'], // Pod
};

type StageDef = Omit<
  PipelineCardProps,
  'isActive' | 'selectedRing' | 'onCardClick' | 'onRingClick' | 'loading'
>;

export default function DashboardPage() {
  const [stages, setStages] = useState<StageDef[]>([]);
  const [branchLive, setBranchLive] = useState<BranchKpiRow[]>([]);
  const [branchHistory, setBranchHistory] = useState<HistoryKpiRow[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);

  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [selectedRing, setSelectedRing] = useState<RingType>('total');

  const [stageBookings, setStageBookings] = useState<Booking[]>([]);
  const [loadingStageBookings, setLoadingStageBookings] = useState(false);

  const [driverRows, setDriverRows] = useState<DriverRow[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  const [availableRows, setAvailableRows] = useState<AvailableVehicleRow[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);

  // WebSocket — subscribe to notification:new to trigger a soft refresh
  const { on } = useWebSocket('/notifications');
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const buildStages = useCallback(
    (
      statusObj: Record<string, number>,
      driverCounts: { available: number; unavailable: number; onTrip: number; total: number }
    ): StageDef[] => {
      const get = (k: string) => statusObj[k] || 0;

      const indentsTotal = get('created') + get('under-review');
      const confirmedTotal = get('assigned');
      const loadingTotal = get('driver-en-route') + get('reached-pickup') + get('loaded');
      const intransitTotal = get('in-transit');
      const unloadingTotal = get('reached-destination');
      const deliveredTotal = get('delivered') + get('pod-received') + get('closed');

      const podPending = get('delivered');
      const podApproved = get('pod-received');
      const podReceived = get('closed');

      // Ring counts start at 0 — updated by updateStageRingCounts() once bookings load
      return [
        {
          title: 'Indents',
          circles: [
            { ringType: 'ring1', label: 'Ontime', count: 0, percent: 0, ...C.green },
            { ringType: 'ring2', label: '>12H', count: 0, percent: 0, ...C.amber },
            { ringType: 'total', label: 'Total', count: indentsTotal, ...C.blue },
          ],
        },
        {
          title: 'Confirmed',
          circles: [
            { ringType: 'ring1', label: '>12H', count: 0, percent: 0, ...C.red },
            { ringType: 'total', label: 'Total', count: confirmedTotal, ...C.blue },
          ],
        },
        {
          title: 'Loading',
          circles: [
            { ringType: 'ring1', label: '>24H', count: 0, percent: 0, ...C.red },
            { ringType: 'ring2', label: 'Untracked', count: 0, percent: 0, ...C.amber },
            { ringType: 'total', label: 'Total', count: loadingTotal, ...C.blue },
          ],
        },
        {
          title: 'Intransit',
          circles: [
            { ringType: 'ring1', label: '>12H Delay', count: 0, percent: 0, ...C.red },
            { ringType: 'ring2', label: 'Untracked', count: 0, percent: 0, ...C.amber },
            { ringType: 'total', label: 'Total', count: intransitTotal, ...C.blue },
          ],
        },
        {
          title: 'Unloading',
          circles: [
            { ringType: 'ring1', label: '>24H', count: 0, percent: 0, ...C.red },
            { ringType: 'ring2', label: 'Untracked', count: 0, percent: 0, ...C.amber },
            { ringType: 'total', label: 'Total', count: unloadingTotal, ...C.blue },
          ],
        },
        {
          title: 'Delivered',
          circles: [
            { ringType: 'ring1', label: 'Ontime', count: 0, percent: 0, ...C.green },
            { ringType: 'ring2', label: 'Untracked', count: 0, percent: 0, ...C.amber },
            { ringType: 'total', label: 'Total', count: deliveredTotal, ...C.blue },
          ],
        },
        {
          title: 'Available',
          showExport: true,
          circles: [
            { ringType: 'ring1', label: 'Available', count: driverCounts.available, ...C.blue },
            { ringType: 'ring2', label: 'Available >24H', count: 0, percent: 0, ...C.green },
            {
              ringType: 'ring3',
              label: 'Unavailable',
              count: driverCounts.unavailable,
              percent: pct(driverCounts.unavailable, driverCounts.total),
              ...C.amber,
            },
            {
              ringType: 'ring4',
              label: 'Active',
              count: driverCounts.onTrip,
              percent: pct(driverCounts.onTrip, driverCounts.total),
              ...C.purple,
            },
          ],
        },
        {
          title: 'Driver',
          circles: [{ ringType: 'total', label: 'Total', count: driverCounts.total, ...C.blue }],
        },
        {
          title: 'Pod',
          circles: [
            { ringType: 'ring1', label: 'Pod Pending', count: podPending, ...C.red },
            { ringType: 'ring2', label: 'POD Approve', count: podApproved, ...C.green },
            { ringType: 'ring3', label: 'Pod Received', count: podReceived, ...C.teal },
          ],
        },
      ];
    },
    []
  );

  /**
   * After bookings for a stage load, compute real ring counts from actual data
   * using the same RING_FILTERS logic and patch the stages state.
   */
  const updateStageRingCounts = useCallback(
    (stageIdx: number, bookings: Booking[]) => {
      setStages((prev) => {
        const next = [...prev];
        const stage = next[stageIdx];
        if (!stage) return prev;
        const stageFilters = RING_FILTERS[stageIdx] || {};
        const total = bookings.length;
        next[stageIdx] = {
          ...stage,
          circles: stage.circles.map((circle) => {
            if (circle.ringType === 'total') return circle; // total comes from status breakdown, keep it
            const filterFn = stageFilters[circle.ringType];
            if (!filterFn) return circle;
            const count = bookings.filter(filterFn).length;
            return { ...circle, count, percent: pct(count, total) };
          }),
        };
        return next;
      });
    },
    [pct]
  );

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch status breakdown + all driver counts in parallel (4 requests at once)
      const [sResp, totalResp, availResp, onTripResp] = await Promise.all([
        bookingApi.getStatusBreakdown(),
        driverApi.getAll({ limit: 1 } as Parameters<typeof driverApi.getAll>[0]),
        driverApi.getAll({ status: 'available', limit: 1 } as Parameters<
          typeof driverApi.getAll
        >[0]),
        driverApi.getAll({ status: 'on-trip', limit: 1 } as Parameters<typeof driverApi.getAll>[0]),
      ]);

      const statusObj: Record<string, number> = sResp.data.data || {};

      const driverCounts = {
        available: availResp.data.data?.pagination?.totalItems || 0,
        onTrip: onTripResp.data.data?.pagination?.totalItems || 0,
        unavailable: 0, // offline drivers — would need separate call
        total: totalResp.data.data?.pagination?.totalItems || 0,
      };
      driverCounts.unavailable = Math.max(
        0,
        driverCounts.total - driverCounts.available - driverCounts.onTrip
      );

      setStages(buildStages(statusObj, driverCounts));

      setStatusData([
        { status: 'created', count: statusObj.created || 0, color: '#3b82f6' },
        { status: 'assigned', count: statusObj.assigned || 0, color: '#eab308' },
        { status: 'in-transit', count: statusObj['in-transit'] || 0, color: '#6366f1' },
        { status: 'delivered', count: statusObj.delivered || 0, color: '#22c55e' },
        { status: 'pod-received', count: statusObj['pod-received'] || 0, color: '#059669' },
      ]);
    } catch (error: unknown) {
      logger.error('Failed to fetch pipeline stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }

    // Branch KPI, activities, and trends — run in parallel via backend aggregations
    const [branchKpiResult, activitiesResult, trendsResult] = await Promise.allSettled([
      bookingApi.getBranchKpi(),
      bookingApi.getActivities({ limit: 20 }),
      bookingApi.getTrends({ days: 7 }),
    ]);

    setLoadingBookings(true);
    try {
      if (branchKpiResult.status === 'fulfilled') {
        const kpi = branchKpiResult.value.data.data;
        setBranchLive((kpi?.live || []) as BranchKpiRow[]);
        setBranchHistory((kpi?.history || []) as HistoryKpiRow[]);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingBookings(false);
    }

    // Activities (result already fetched in parallel above)
    setLoadingActivities(true);
    try {
      if (activitiesResult.status === 'fulfilled') {
        setActivities(activitiesResult.value.data.data || []);
      } else {
        setActivities([]);
      }
    } finally {
      setLoadingActivities(false);
    }

    // Trends (result already fetched in parallel above)
    setLoadingCharts(true);
    try {
      if (trendsResult.status === 'fulfilled') {
        setTrendData(trendsResult.value.data.data || []);
      } else {
        setTrendData([]);
      }
    } finally {
      setLoadingCharts(false);
    }
  };

  // Fetch bookings for all stages in parallel on mount to populate ring counts immediately
  const fetchAllRingCounts = useCallback(async () => {
    const stageIndices = Object.keys(STAGE_STATUSES).map(Number);
    await Promise.all(
      stageIndices.map(async (idx) => {
        const statuses = STAGE_STATUSES[idx];
        try {
          const results = await Promise.all(
            statuses.map((s) =>
              bookingApi.getAll({ status: s, limit: 100 } as Parameters<
                typeof bookingApi.getAll
              >[0])
            )
          );
          const merged: Booking[] = results.flatMap((r) => r.data.data?.bookings || []);
          updateStageRingCounts(idx, merged);
          // Also seed stageBookings for the default selected stage (0)
          if (idx === 0) {
            merged.sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
            setStageBookings(merged);
          }
        } catch {
          // ignore per-stage failures
        }
      })
    );
  }, [updateStageRingCounts]);

  useEffect(() => {
    setLoadingStageBookings(true);
    Promise.all([fetchDashboardData(), fetchAllRingCounts()]).finally(() =>
      setLoadingStageBookings(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Soft-refresh dashboard when a new notification arrives (booking status change, etc.)
  // Debounced to 3s to avoid hammering the API on rapid events
  useEffect(() => {
    const cleanup = on('notification:new', () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        fetchDashboardData();
        fetchAllRingCounts();
      }, 3000);
    });
    return () => {
      cleanup?.();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  const fetchStageBookings = useCallback(
    async (idx: number) => {
      const statuses = STAGE_STATUSES[idx];
      if (!statuses) {
        setStageBookings([]);
        return;
      }
      setLoadingStageBookings(true);
      try {
        const results = await Promise.all(
          statuses.map((s) =>
            bookingApi.getAll({ status: s, limit: 100 } as Parameters<typeof bookingApi.getAll>[0])
          )
        );
        const merged: Booking[] = results.flatMap((r) => r.data.data?.bookings || []);
        merged.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setStageBookings(merged);
        // Update ring counts on the pipeline card with real computed values
        updateStageRingCounts(idx, merged);
      } catch {
        setStageBookings([]);
      } finally {
        setLoadingStageBookings(false);
      }
    },
    [updateStageRingCounts]
  );

  // Driver card index (7 = "Driver" stage in stages array)
  const DRIVER_STAGE_IDX = 7;
  // Pod card index (8 = "Pod" stage in stages array)
  const POD_STAGE_IDX = 8;

  const fetchDriverRows = useCallback(async () => {
    setLoadingDrivers(true);
    try {
      const resp = await bookingApi.getDriverStats();
      setDriverRows((resp.data.data || []) as DriverRow[]);
    } catch {
      setDriverRows([]);
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  // Available card index (6 = "Available" stage in stages array)
  const AVAILABLE_STAGE_IDX = 6;

  const fetchAvailableRows = useCallback(async () => {
    setLoadingAvailable(true);
    try {
      const resp = await vehicleApi.getAll({ limit: 200 } as Parameters<
        typeof vehicleApi.getAll
      >[0]);
      const vehicles: Vehicle[] = resp.data.data?.vehicles || [];
      const now = Date.now();

      const rows: AvailableVehicleRow[] = vehicles.map((v) => {
        const lastTripDate = v.stats?.lastTripDate
          ? new Date(v.stats.lastTripDate).getTime()
          : null;
        const unloadedHrsAgo = lastTripDate ? (now - lastTripDate) / 3600000 : undefined;

        // TAT = how long since it became available = use updatedAt as proxy when availability is 'available'
        const availableTatHrs =
          v.availability === 'available' && v.updatedAt
            ? (now - new Date(v.updatedAt).getTime()) / 3600000
            : undefined;

        const driverObj = typeof v.driver === 'object' && v.driver ? v.driver : null;
        const ownerObj = typeof v.owner === 'object' && v.owner ? v.owner : null;

        return {
          vehicle: v,
          unloadedHrsAgo,
          availableTatHrs,
          driverName: driverObj?.name || ownerObj?.name,
          driverPhone: driverObj?.phone || ownerObj?.phone,
          city: v.registrationCity,
          region: v.registrationCity ? getCityRegion(v.registrationCity) : undefined,
        };
      });

      setAvailableRows(rows);

      // Update Available card ring counts from real vehicle data
      const total = rows.length;
      const avail = rows.filter((r) => r.vehicle.availability === 'available').length;
      const availGt24 = rows.filter(
        (r) => r.vehicle.availability === 'available' && (r.availableTatHrs ?? 0) > 24
      ).length;
      const unavail = rows.filter(
        (r) => r.vehicle.availability === 'maintenance' || r.vehicle.availability === 'offline'
      ).length;
      const active = rows.filter((r) => r.vehicle.availability === 'on-trip').length;
      setStages((prev) => {
        const next = [...prev];
        const stage = next[AVAILABLE_STAGE_IDX];
        if (!stage) return prev;
        next[AVAILABLE_STAGE_IDX] = {
          ...stage,
          circles: stage.circles.map((c) => {
            if (c.ringType === 'ring1') return { ...c, count: avail, percent: pct(avail, total) };
            if (c.ringType === 'ring2')
              return { ...c, count: availGt24, percent: pct(availGt24, avail) };
            if (c.ringType === 'ring3')
              return { ...c, count: unavail, percent: pct(unavail, total) };
            if (c.ringType === 'ring4') return { ...c, count: active, percent: pct(active, total) };
            return c;
          }),
        };
        return next;
      });
    } catch {
      setAvailableRows([]);
    } finally {
      setLoadingAvailable(false);
    }
  }, [pct]);

  const handleCardClick = (idx: number) => {
    setSelectedStageIdx(idx);
    setSelectedRing('total');
    if (idx === DRIVER_STAGE_IDX) fetchDriverRows();
    else if (idx === AVAILABLE_STAGE_IDX) fetchAvailableRows();
    else fetchStageBookings(idx);
  };
  const handleRingClick = (idx: number, ring: RingType) => {
    // Indents stage (idx 0): all rings show the same list — skip reload if already active
    if (idx === 0 && selectedStageIdx === 0) return;
    setSelectedStageIdx(idx);
    setSelectedRing(ring);
    if (idx === DRIVER_STAGE_IDX) fetchDriverRows();
    else if (idx === AVAILABLE_STAGE_IDX) fetchAvailableRows();
    else fetchStageBookings(idx);
  };

  return (
    <div className="space-y-5">
      {/* Pipeline Cards + Detail Panel (no gap between them) */}
      <div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <PipelineCard key={i} title="" circles={[]} loading />
                ))
              : stages.map((stage, idx) => (
                  <div key={stage.title} className="border-r border-gray-100 last:border-r-0">
                    <PipelineCard
                      {...stage}
                      isActive={selectedStageIdx === idx}
                      selectedRing={selectedStageIdx === idx ? selectedRing : null}
                      allRingsSelected={selectedStageIdx === idx && idx === 0}
                      onCardClick={() => handleCardClick(idx)}
                      onRingClick={(ring) => handleRingClick(idx, ring)}
                      onExport={
                        idx === AVAILABLE_STAGE_IDX
                          ? () => {
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
                              ];
                              const rows = availableRows.map((r) => [
                                r.vehicle._id.slice(-6).toUpperCase(),
                                r.vehicle.vehicleNumber || '',
                                r.vehicle.truckType || '',
                                r.vehicle.ownershipType || '',
                                r.unloadedHrsAgo != null ? r.unloadedHrsAgo.toFixed(1) : '',
                                r.vehicle.availability,
                                r.availableTatHrs != null ? r.availableTatHrs.toFixed(1) : '',
                                r.driverName || '',
                                r.driverPhone || '',
                                r.city || '',
                                r.region || '',
                              ]);
                              downloadCsv('available-vehicles.csv', toCsvString(headers, rows));
                            }
                          : undefined
                      }
                    />
                  </div>
                ))}
          </div>
        </div>

        {/* Stage-filtered Indent List OR Available Truck List OR Driver List OR Branch KPI Table */}
        {selectedStageIdx === AVAILABLE_STAGE_IDX ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <AvailableList
              selectedRing={selectedRing}
              rows={availableRows.filter((r) => {
                const avail = r.vehicle.availability;
                if (selectedRing === 'ring1') return avail === 'available';
                if (selectedRing === 'ring2')
                  return avail === 'available' && (r.availableTatHrs ?? 0) > 24;
                if (selectedRing === 'ring3') return avail === 'maintenance' || avail === 'offline';
                if (selectedRing === 'ring4') return avail === 'on-trip';
                return true; // total — all
              })}
              loading={loadingAvailable}
            />
          </div>
        ) : selectedStageIdx === POD_STAGE_IDX ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <PodList
              bookings={stageBookings.filter((b) => {
                if (selectedRing === 'ring1') return b.status === 'delivered';
                if (selectedRing === 'ring2') return b.status === 'pod-received';
                if (selectedRing === 'ring3') return b.status === 'closed';
                return true; // total
              })}
              loading={loadingStageBookings}
            />
          </div>
        ) : selectedStageIdx === DRIVER_STAGE_IDX ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <DriverList drivers={driverRows} loading={loadingDrivers} />
          </div>
        ) : STAGE_STATUSES[selectedStageIdx] ? (
          <StageIndentPanel
            stageIdx={selectedStageIdx}
            stageTitle={stages[selectedStageIdx]?.title || ''}
            selectedRing={selectedRing}
            bookings={stageBookings}
            loading={loadingStageBookings}
            liveData={branchLive}
            historyData={branchHistory}
            loadingKpi={loadingBookings}
          />
        ) : (
          <BranchKpiTable
            liveData={branchLive}
            historyData={branchHistory}
            loading={loadingBookings}
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BookingTrendsChart data={trendData} loading={loadingCharts} />
        <StatusDistributionChart data={statusData} loading={loadingCharts} />
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={activities} loading={loadingActivities} />
    </div>
  );
}
