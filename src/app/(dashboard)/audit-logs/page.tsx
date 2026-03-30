'use client';

import { useEffect, useState } from 'react';
import { auditApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AuditLog {
  _id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  user?: { name?: string; email?: string };
  ipAddress?: string;
  changes?: Record<string, unknown>;
  createdAt: string;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  topActions: { action: string; count: number }[];
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
};

function actionColor(action: string): string {
  const key = Object.keys(ACTION_COLOR).find((k) => action.toUpperCase().includes(k));
  return key ? ACTION_COLOR[key] : 'bg-gray-100 text-gray-600';
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (p = page) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page: p, limit: 30 };
      if (search) params.search = search;
      if (entityFilter) params.entityType = entityFilter;
      const res = await auditApi.getAll(params);
      const responseData = res.data.data as {
        items?: AuditLog[];
        logs?: AuditLog[];
        pagination?: { pages?: number };
      };
      setLogs(responseData?.items ?? responseData?.logs ?? []);
      if (responseData?.pagination) {
        setTotalPages(responseData.pagination.pages ?? 1);
      }
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await auditApi.getStats();
      setStats(res.data.data ?? null);
    } catch {
      // stats are optional
    }
  };

  useEffect(() => {
    fetchLogs(1);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs(1);
  };

  const changePage = (newPage: number) => {
    setPage(newPage);
    fetchLogs(newPage);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">System activity and change history</p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Logs</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalLogs?.toLocaleString('en-IN') ?? '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Today</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayLogs ?? '—'}</p>
          </div>
          {stats.topActions?.slice(0, 2).map((a) => (
            <div key={a.action} className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide truncate">
                {a.action.replace(/_/g, ' ')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{a.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search action or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-64"
        />
        <Button variant="outline" size="sm" onClick={handleSearch}>
          Search
        </Button>
        {['', 'booking', 'customer', 'driver', 'vehicle', 'user'].map((et) => (
          <Button
            key={et}
            variant={entityFilter === et ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setEntityFilter(et);
              setPage(1);
            }}
          >
            {et === '' ? 'All' : et.charAt(0).toUpperCase() + et.slice(1)}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>User</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id} className="hover:bg-gray-50">
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}
                    >
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {log.entityType ? (
                      <span className="capitalize">
                        {log.entityType}
                        {log.entityId && (
                          <span className="ml-1 font-mono text-xs text-gray-400">
                            #{log.entityId.slice(-6).toUpperCase()}
                          </span>
                        )}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {log.user?.name || log.user?.email || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 font-mono">
                    {log.ipAddress || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => changePage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => changePage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
