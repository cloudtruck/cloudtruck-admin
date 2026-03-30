import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../src/lib/axios';
import { branchApi, accountApi } from '../src/lib/api';

describe('Organization Management APIs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('branchApi', () => {
    it('list calls /branches', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true } } as any);
      await branchApi.list({ isActive: true });
      expect(api.get).toHaveBeenCalledWith('/branches', { params: { isActive: true } });
    });

    it('getById calls correct GET endpoint', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true } } as any);
      await branchApi.getById('b1');
      expect(api.get).toHaveBeenCalledWith('/branches/b1');
    });
  });

  describe('accountApi', () => {
    it('list calls /accounts', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true } } as any);
      await accountApi.list();
      expect(api.get).toHaveBeenCalledWith('/accounts');
    });
  });
});
