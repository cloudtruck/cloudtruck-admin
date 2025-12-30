import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../src/lib/axios';
import { bookingApi } from '../src/lib/api';

describe('bookingApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getActivities calls correct endpoint and returns data', async () => {
    const mock = { data: { data: [{ _id: '1', type: 'booking_created' }] } };
    vi.spyOn(api, 'get').mockResolvedValueOnce(mock as any);

    const res = await bookingApi.getActivities({ limit: 10 });
    expect(api.get).toHaveBeenCalledWith('/bookings/dashboard/activities', { params: { limit: 10 } });
    expect(res.data.data).toEqual([{ _id: '1', type: 'booking_created' }]);
  });

  it('getTrends calls correct endpoint and returns data', async () => {
    const mock = { data: { data: [{ date: 'Mon', bookings: 1, delivered: 0 }] } };
    vi.spyOn(api, 'get').mockResolvedValueOnce(mock as any);

    const res = await bookingApi.getTrends({ days: 7 });
    expect(api.get).toHaveBeenCalledWith('/bookings/dashboard/trends', { params: { days: 7 } });
    expect(res.data.data).toEqual([{ date: 'Mon', bookings: 1, delivered: 0 }]);
  });
});