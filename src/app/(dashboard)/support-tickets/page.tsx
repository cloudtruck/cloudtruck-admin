'use client';

import { useEffect, useState } from 'react';
import { supportTicketApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Ticket {
  _id: string;
  ticketNumber?: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  createdBy?: { name?: string; email?: string };
  replies?: { message: string; createdBy?: { name?: string }; createdAt?: string }[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await supportTicketApi.getAll(params);
      const ticketData = res.data.data as { tickets?: Ticket[]; items?: Ticket[] };
      setTickets(ticketData?.tickets ?? ticketData?.items ?? []);
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openDetail = async (ticket: Ticket) => {
    try {
      const res = await supportTicketApi.getById(ticket._id);
      setSelected(res.data.data ?? ticket);
    } catch {
      setSelected(ticket);
    }
  };

  const submitReply = async () => {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    try {
      await supportTicketApi.reply(selected._id, { message: replyText });
      toast.success('Reply sent');
      setReplyText('');
      const res = await supportTicketApi.getById(selected._id);
      setSelected(res.data.data ?? selected);
      fetchTickets();
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const filtered = tickets.filter(
    (t) =>
      !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer support requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search by subject or ticket #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
          className="w-64"
        />
        {(['', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === '' ? 'All' : s.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Ticket #</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Raised By</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ticket) => (
                <TableRow
                  key={ticket._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => openDetail(ticket)}
                >
                  <TableCell className="font-mono text-sm text-gray-600">
                    {ticket.ticketNumber || ticket._id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 max-w-xs truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {ticket.createdBy?.name || ticket.createdBy?.email || '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_COLORS[ticket.priority] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {ticket.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(ticket);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.subject}
              {selected && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[selected.status] ?? ''}`}
                >
                  {selected.status.replace('_', ' ')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {selected.description}
              </p>

              {/* Replies */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Replies ({selected.replies?.length ?? 0})
                </h3>
                {selected.replies?.map((reply, i) => (
                  <div key={i} className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-blue-800">{reply.createdBy?.name ?? 'Staff'}</p>
                    <p className="text-gray-700 mt-1">{reply.message}</p>
                    {reply.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(reply.createdAt).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                ))}
                {(!selected.replies || selected.replies.length === 0) && (
                  <p className="text-sm text-gray-400">No replies yet</p>
                )}
              </div>

              {/* Reply Box */}
              {selected.status !== 'closed' && (
                <div className="space-y-2 pt-2 border-t">
                  <h3 className="text-sm font-semibold text-gray-700">Add Reply</h3>
                  <textarea
                    className="w-full border rounded-lg p-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button size="sm" onClick={submitReply} disabled={replying || !replyText.trim()}>
                    {replying ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
