'use client';

import { useEffect, useState } from 'react';
import { supportTicketApi } from '@/lib/api';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Reply {
  user?: { name?: string; email?: string; role?: string };
  message: string;
  timestamp?: string;
}

interface Ticket {
  _id: string;
  ticketId?: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  userRole?: string;
  user?: { name?: string; phone?: string; email?: string; role?: string };
  booking?: { bookingId?: string; status?: string };
  replies?: Reply[];
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await supportTicketApi.getAll(params);
      const raw = res.data.data as { tickets?: Ticket[]; items?: Ticket[] } | Ticket[];
      const list = Array.isArray(raw)
        ? raw
        : (raw as { tickets?: Ticket[]; items?: Ticket[] })?.tickets ??
          (raw as { items?: Ticket[] })?.items ??
          [];
      setTickets(list);
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  const openDetail = async (ticket: Ticket) => {
    setReplyText('');
    setResolutionNotes('');
    try {
      const res = await supportTicketApi.getById(ticket._id);
      const t = res.data.data ?? ticket;
      setSelected(t);
      setResolutionNotes(t.resolutionNotes ?? '');
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

  const updateTicket = async (field: { status?: string; priority?: string; resolutionNotes?: string }) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const res = await supportTicketApi.update(selected._id, field);
      const updated = res.data.data ?? selected;
      setSelected(updated);
      setTickets((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      toast.success('Ticket updated');
    } catch {
      toast.error('Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = tickets.filter(
    (t) =>
      !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer and driver complaints</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search by subject or ticket ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
          className="w-64"
        />
        <div className="flex gap-2">
          {(['', ...STATUSES] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === '' ? 'All' : s.replace('-', ' ')}
            </Button>
          ))}
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p} className="capitalize">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Ticket ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Raised By</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
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
                  <TableCell className="font-mono text-xs text-gray-500">
                    {ticket.ticketId || ticket._id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 max-w-xs truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {ticket.user?.name || ticket.user?.phone || '—'}
                    {ticket.userRole && (
                      <span className="ml-1 text-xs text-gray-400 capitalize">({ticket.userRole})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 capitalize">
                    {ticket.category?.replace(/-/g, ' ') || '—'}
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
                      {ticket.status.replace('-', ' ')}
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
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <span>{selected?.ticketId || selected?._id.slice(-6).toUpperCase()}</span>
              <span className="text-gray-400">—</span>
              <span>{selected?.subject}</span>
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Raised by</p>
                  <p className="font-medium">{selected.user?.name || selected.user?.phone || '—'}</p>
                  <p className="text-gray-500 text-xs capitalize">{selected.userRole}</p>
                </div>
                {selected.booking && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Booking</p>
                    <p className="font-mono text-xs">{selected.booking.bookingId}</p>
                    <p className="text-gray-500 text-xs capitalize">{selected.booking.status}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400 text-xs mb-1">Category</p>
                  <p className="capitalize">{selected.category?.replace(/-/g, ' ') || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Created</p>
                  <p>{new Date(selected.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                {selected.description}
              </div>

              {/* Status & Priority Controls */}
              <div className="flex gap-3 flex-wrap border-t pt-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Status</p>
                  <Select
                    value={selected.status}
                    onValueChange={(val) => updateTicket({ status: val })}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-36 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize text-sm">
                          {s.replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Priority</p>
                  <Select
                    value={selected.priority}
                    onValueChange={(val) => updateTicket({ priority: val })}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-32 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize text-sm">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resolution Notes */}
              {(selected.status === 'resolved' || selected.status === 'closed') && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs text-gray-500 font-medium">Resolution Notes</p>
                  <textarea
                    className="w-full border rounded-lg p-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Add resolution notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateTicket({ resolutionNotes })}
                    disabled={updating}
                  >
                    Save Notes
                  </Button>
                </div>
              )}

              {/* Replies */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Replies ({selected.replies?.length ?? 0})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selected.replies && selected.replies.length > 0 ? (
                    selected.replies.map((reply, i) => {
                      const isStaff = ['staff', 'internal', 'super-admin'].includes(reply.user?.role ?? '');
                      return (
                        <div
                          key={i}
                          className={`rounded-lg p-3 text-sm ${isStaff ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'}`}
                        >
                          <p className={`font-medium text-xs mb-1 ${isStaff ? 'text-blue-700' : 'text-gray-600'}`}>
                            {reply.user?.name || reply.user?.email || (isStaff ? 'Staff' : 'Customer')}
                            <span className="ml-1 opacity-60 capitalize">({reply.user?.role})</span>
                          </p>
                          <p className="text-gray-700">{reply.message}</p>
                          {reply.timestamp && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(reply.timestamp).toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-400">No replies yet</p>
                  )}
                </div>
              </div>

              {/* Reply Box */}
              {selected.status !== 'closed' && (
                <div className="space-y-2 border-t pt-4">
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
