'use client';

import { useEffect, useState } from 'react';
import { 
  Package, 
  Truck, 
  TrendingUp, 
  CheckCircle, 
  FileText 
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { BookingTrendsChart } from '@/components/dashboard/BookingTrendsChart';
import { StatusDistributionChart } from '@/components/dashboard/StatusDistributionChart';
import { bookingApi } from '@/lib/api';
import { useDashboardStore } from '@/store/dashboardStore';
import { toast } from 'sonner';

interface Activity {
  _id: string;
  type: 'booking_created' | 'driver_assigned' | 'status_update' | 'pod_uploaded' | 'payment_received';
  message: string;
  bookingId?: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

interface TrendData {
  date: string;
  bookings: number;
  delivered: number;
}

interface StatusData {
  status: string;
  count: number;
  color: string;
}

export default function DashboardPage() {
  const { stats, loading, setStats, setLoading } = useDashboardStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);

  const fetchDashboardData = async () => {
    // Fetch stats
    setLoading(true);
    try {
      const response = await bookingApi.getStats();
      setStats(response.data.data);
    } catch (error: unknown) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }

    // Fetch recent activities
    setLoadingActivities(true);
    try {
      const resp = await bookingApi.getActivities({ limit: 20 });
      setActivities(resp.data.data || []);
    } catch (error: unknown) {
      console.error('Failed to fetch activities:', error);
      // fallback to empty
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }

    // Fetch chart data
    setLoadingCharts(true);
    try {
      const [tResp, sResp] = await Promise.all([
        bookingApi.getTrends({ days: 7 }),
        bookingApi.getStatusBreakdown()
      ]);

      const trendApi = tResp.data.data || [];
      setTrendData(trendApi);

      const statusObj = sResp.data.data || {};
      const mockStatusData: StatusData[] = [
        { status: 'created', count: statusObj.created || 0, color: '#3b82f6' },
        { status: 'assigned', count: statusObj.assigned || 0, color: '#eab308' },
        { status: 'in-transit', count: statusObj['in-transit'] || statusObj['in-transit'] || statusObj['driver-enroute-to-pickup'] || 0, color: '#6366f1' },
        { status: 'delivered', count: statusObj.delivered || 0, color: '#22c55e' },
        { status: 'pod-received', count: statusObj['pod-received'] || 0, color: '#059669' },
      ];
      setStatusData(mockStatusData);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      setTrendData([]);
      setStatusData([]);
    } finally {
      setLoadingCharts(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your trucking operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="New Requests"
          value={stats.newRequests}
          icon={Package}
          loading={loading}
          trend={stats.newRequestsChange || { value: 0, isPositive: false }}
        />
        <StatCard
          title="Assigned Today"
          value={stats.assigned}
          icon={Truck}
          loading={loading}
          trend={stats.assignedChange || { value: 0, isPositive: false }}
        />
        <StatCard
          title="In Transit"
          value={stats.inTransit}
          icon={TrendingUp}
          loading={loading}
          trend={stats.inTransitChange || { value: 0, isPositive: false }}
        />
        <StatCard
          title="Delivered Today"
          value={stats.delivered}
          icon={CheckCircle}
          loading={loading}
          trend={stats.deliveredChange || { value: 0, isPositive: false }}
        />
        <StatCard
          title="POD Pending"
          value={stats.podPending}
          icon={FileText}
          loading={loading}
          trend={stats.podPendingChange || { value: 0, isPositive: false }}
        />
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BookingTrendsChart data={trendData} loading={loadingCharts} />
        <StatusDistributionChart data={statusData} loading={loadingCharts} />
      </div>

      {/* Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={activities} loading={loadingActivities} />
        </div>
        
      </div>
    </div>
  );
}
