import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '../src/lib/axios';
import { roleTemplateApi } from '../src/lib/api';

describe('roleTemplateApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('list calls /role-templates', async () => {
    const mock = { data: { data: [{ _id: '1', templateName: 'Admin' }] } };
    vi.spyOn(api, 'get').mockResolvedValueOnce(mock as any);

    const res = await roleTemplateApi.list();
    expect(api.get).toHaveBeenCalledWith('/role-templates', { params: undefined });
    expect(res.data.data[0].templateName).toBe('Admin');
  });

  it('create calls /role-templates POST', async () => {
    const payload = { templateName: 'New Role', permissions: [] };
    const mock = { data: { data: { ...payload, _id: '1' } } };
    vi.spyOn(api, 'post').mockResolvedValueOnce(mock as any);

    const res = await roleTemplateApi.create(payload);
    expect(api.post).toHaveBeenCalledWith('/role-templates', payload);
  });
});
