import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../src/lib/axios';
import { ewayBillApi } from '../src/lib/api';

describe('ewayBillApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sync calls correct endpoint', async () => {
    const mockId = '123456789012';
    const mockResponse = { data: { data: { ewayBillNumber: mockId }, success: true } };
    vi.spyOn(api, 'post').mockResolvedValueOnce(mockResponse as any);

    const res = await ewayBillApi.sync(mockId);
    expect(api.post).toHaveBeenCalledWith(`/eway-bills/${mockId}/sync`, {});
    expect(res.data.data.ewayBillNumber).toBe(mockId);
  });

  it('getAll calls correct endpoint with params', async () => {
    const filters = { status: 'active' };
    const mockResponse = { data: { data: { ewayBills: [] }, success: true } };
    vi.spyOn(api, 'get').mockResolvedValueOnce(mockResponse as any);

    await ewayBillApi.getAll(filters as any);
    expect(api.get).toHaveBeenCalledWith('/eway-bills', { params: filters });
  });
});
