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

    // Fetch recent activities (mock data for now)
    setLoadingActivities(true);
    try {
      // TODO: Replace with actual API call when endpoint is ready
      const mockActivities: Activity[] = [
        {
          _id: '1',
          type: 'booking_created',
          message: 'New booking created by ABC Logistics',
          bookingId: 'BK-2024-001',
          timestamp: new Date().toISOString(),
        },
        {
          _id: '2',
          type: 'driver_assigned',
          message: 'Driver Rajesh Kumar assigned to booking',
          bookingId: 'BK-2024-002',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          _id: '3',
          type: 'status_update',
          message: 'Booking status updated to In Transit',
          bookingId: 'BK-2024-003',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
        {
          _id: '4',
          type: 'pod_uploaded',
          message: 'POD uploaded for booking',
          bookingId: 'BK-2024-004',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
        {
          _id: '5',
          type: 'payment_received',
          message: 'Payment received from XYZ Traders',
          bookingId: 'BK-2024-005',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
      ];
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoadingActivities(false);
    }

    // Fetch chart data (mock data for now)
    setLoadingCharts(true);
    try {
      // TODO: Replace with actual API call when endpoint is ready
      const mockTrendData: TrendData[] = [
        { date: 'Mon', bookings: 12, delivered: 8 },
        { date: 'Tue', bookings: 15, delivered: 10 },
        { date: 'Wed', bookings: 18, delivered: 14 },
        { date: 'Thu', bookings: 20, delivered: 16 },
        { date: 'Fri', bookings: 17, delivered: 15 },
        { date: 'Sat', bookings: 10, delivered: 8 },
        { date: 'Sun', bookings: 8, delivered: 6 },
      ];
      setTrendData(mockTrendData);

      const mockStatusData: StatusData[] = [
        { status: 'created', count: stats.newRequests || 0, color: '#3b82f6' },
        { status: 'assigned', count: stats.assigned || 0, color: '#eab308' },
        { status: 'in-transit', count: stats.inTransit || 0, color: '#6366f1' },
        { status: 'delivered', count: stats.delivered || 0, color: '#22c55e' },
        { status: 'pod-received', count: stats.podPending || 0, color: '#059669' },
      ];
      setStatusData(mockStatusData);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
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
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Assigned Today"
          value={stats.assigned}
          icon={Truck}
          loading={loading}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="In Transit"
          value={stats.inTransit}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Delivered Today"
          value={stats.delivered}
          icon={CheckCircle}
          loading={loading}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="POD Pending"
          value={stats.podPending}
          icon={FileText}
          loading={loading}
          trend={{ value: 5, isPositive: false }}
        />
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
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
