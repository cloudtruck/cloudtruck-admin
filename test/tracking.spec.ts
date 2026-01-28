import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../src/lib/axios';
import { trackingApi } from '../src/lib/api';

describe('trackingApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getLiveTrips calls correct endpoint', async () => {
    const mockData = { data: [{ _id: '1', status: 'in-transit' }] };
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockData } as any);

    const res = await trackingApi.getLiveTrips();
    expect(api.get).toHaveBeenCalledWith('/tracking/live-trips');
    expect(res.data.data[0].status).toBe('in-transit');
  });

  it('getLatest calls correct endpoint with bookingId', async () => {
    const bookingId = 'B1';
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true } } as any);

    await trackingApi.getLatest(bookingId);
    expect(api.get).toHaveBeenCalledWith(`/tracking/${bookingId}/last-location`);
  });
});
