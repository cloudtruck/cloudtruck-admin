import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../src/lib/axios';
import { organizationSettingsApi } from '../src/lib/api';

describe('organizationSettingsApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getSettings calls correct endpoint', async () => {
    const mock = { data: { data: { companyName: 'CloudTruck' } } };
    vi.spyOn(api, 'get').mockResolvedValueOnce(mock as any);

    const res = await organizationSettingsApi.getSettings();
    expect(api.get).toHaveBeenCalledWith('/organization/settings');
    expect(res.data.data.companyName).toEqual('CloudTruck');
  });

  it('updateSettings calls patch endpoint with data', async () => {
    const mockData = { companyName: 'New Name' };
    const mockResponse = { data: { data: { ...mockData } } };
    vi.spyOn(api, 'patch').mockResolvedValueOnce(mockResponse as any);

    const res = await organizationSettingsApi.updateSettings(mockData);
    expect(api.patch).toHaveBeenCalledWith('/organization/settings', mockData);
    expect(res.data.data.companyName).toEqual('New Name');
  });

  it('getNextBookingNumber calls correct endpoint', async () => {
    const mock = { data: { data: { bookingNumber: 'BK000001' } } };
    vi.spyOn(api, 'get').mockResolvedValueOnce(mock as any);

    const res = await organizationSettingsApi.getNextBookingNumber();
    expect(api.get).toHaveBeenCalledWith('/organization/settings/next-booking-number');
    expect(res.data.data.bookingNumber).toEqual('BK000001');
  });
});
