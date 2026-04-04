'use client';

import { useState, useEffect } from 'react';
import { X, Inbox } from 'lucide-react';
import { vehicleApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AuditLog {
  _id: string;
  action: string;
  context?: { description?: string };
  message?: string;
  text?: string;
  user?: { name?: string; email?: string; phone?: string } | string;
  createdAt?: string;
  timestamp?: string;
}

interface TruckCommentModalProps {
  vehicleId: string;
  vehicleNumber: string;
  onClose: () => void;
}

export function TruckCommentModal({ vehicleId, vehicleNumber, onClose }: TruckCommentModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLogs = () => {
    setLogsLoading(true);
    vehicleApi
      .getNotes(vehicleId)
      .then((res) => setLogs((res.data.data as AuditLog[]) || []))
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const handleAdd = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await vehicleApi.addNote(vehicleId, { text: note.trim() });
      setNote('');
      fetchLogs();
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Truck Comment — {vehicleNumber}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input row */}
        <div className="flex gap-3 px-5 py-4 border-b border-gray-100">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleAdd()}
            placeholder="Please enter comments"
            rows={3}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-xs outline-none focus:border-blue-500 resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !note.trim()}
            className="px-5 py-2 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 border border-gray-300 rounded-md text-xs font-semibold transition-colors h-fit self-start mt-0.5 whitespace-nowrap"
          >
            {saving ? (
              <div className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              'Submit'
            )}
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto max-h-80">
          {logsLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Inbox className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">No comments yet</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-36">
                    Topic
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    Comment
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-36 whitespace-nowrap">
                    Created By
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28 whitespace-nowrap">
                    Created On
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const topic =
                    typeof log.action === 'string'
                      ? log.action
                          .replace(/_/g, ' ')
                          .toLowerCase()
                          .replace(/^\w/, (c) => c.toUpperCase())
                      : 'Note';
                  const comment = log.context?.description || log.message || log.text || '—';
                  const userObj = typeof log.user === 'object' ? log.user : null;
                  const userName = userObj?.name || userObj?.email || (typeof log.user === 'string' ? log.user : '—');
                  const userPhone = userObj?.phone;
                  const createdBy = userPhone ? `${userName} - ${userPhone}` : userName;
                  const date = log.createdAt || log.timestamp;
                  return (
                    <tr key={log._id ?? i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{topic}</td>
                      <td className="px-4 py-2.5 text-gray-700">{comment}</td>
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{createdBy}</td>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                        {date ? format(new Date(date), 'dd-MMM-yy') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
