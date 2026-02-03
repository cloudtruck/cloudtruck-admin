import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../src/lib/axios';
import { masterDataApi } from '../src/lib/api';

describe('masterDataApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getByCategory calls endpoint with query param', async () => {
    const category = 'truck_type';
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true } } as any);

    await masterDataApi.getByCategory(category, false);
    expect(api.get).toHaveBeenCalledWith(`/master-data/category/${category}?includeInactive=false`);
  });

  it('list calls endpoint with filters', async () => {
    const params = { category: 'department', isActive: true };
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true } } as any);

    await masterDataApi.list(params);
    expect(api.get).toHaveBeenCalledWith('/master-data', { params });
  });
});
