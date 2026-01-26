import { describe, it, expect, vi } from 'vitest';
import { bookingApi } from '../src/lib/api';
import { useDashboardStore } from '../src/store/dashboardStore';

describe('Dashboard wiring', () => {
  it('uses percent-change values from API response', async () => {
    const mockStats = {
      newRequests: 2,
      assigned: 1,
      inTransit: 0,
      delivered: 0,
      podPending: 0,
      total: 3,
      newRequestsChange: { value: 100, isPositive: true },
      assignedChange: { value: 0, isPositive: false }
    };

    vi.spyOn(bookingApi, 'getStats').mockResolvedValue({ data: { data: mockStats } } as never);

    // Simulate fetch and setStats
    const resp = await bookingApi.getStats();
    useDashboardStore.getState().setStats(resp.data.data);

    const state = useDashboardStore.getState();
    expect(state.stats.newRequestsChange?.value).toEqual(100);
    expect(state.stats.newRequests).toEqual(2);
  });
});