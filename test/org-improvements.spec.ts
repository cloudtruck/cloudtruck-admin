import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../src/lib/axios';
import { masterDataApi } from '../src/lib/api';

describe('Organization Module Improvements', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('masterDataApi.getByCategory supports includeInactive', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true } } as any);
    await masterDataApi.getByCategory('test', true);
    expect(api.get).toHaveBeenCalledWith('/master-data/category/test?includeInactive=true');
  });
});
