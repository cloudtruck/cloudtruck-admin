'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from '@/lib/api';
import { useChatSocket } from '@/hooks/useChatSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

interface Conversation {
  _id: string;
  booking?: { bookingId?: string };
  driver?: { name?: string; phone?: string } | string;
  lastMessage?: { text: string; sentAt?: string };
  unreadCounts?: Record<string, number>;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversation: string;
  sender?: { _id: string; name?: string; phone?: string; role?: string };
  text: string;
  createdAt: string;
}

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIncomingMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
    // Update lastMessage in conversation list
    setConversations((prev) =>
      prev.map((c) =>
        c._id === msg.conversation
          ? {
              ...c,
              lastMessage: { text: msg.text, sentAt: msg.createdAt },
              updatedAt: msg.createdAt,
            }
          : c
      )
    );
  }, []);

  const handleTyping = useCallback((data: { userId: string; name: string; typing: boolean }) => {
    if (data.typing) {
      setTypingUser(data.name || 'Someone');
    } else {
      setTypingUser(null);
    }
  }, []);

  const {
    sendMessage: socketSend,
    sendTypingStart,
    sendTypingStop,
    markRead,
  } = useChatSocket({
    conversationId: selected?._id ?? null,
    onMessage: handleIncomingMessage,
    onTyping: handleTyping,
  });

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selected) {
      markRead(selected._id);
    }
  }, [selected, markRead]);

  const fetchConversations = async () => {
    try {
      setLoadingConvs(true);
      const res = await chatApi.getConversations();
      const raw = res.data.data;
      setConversations(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConvs(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setSelected(conv);
    setMessages([]);
    setTypingUser(null);
    setLoadingMsgs(true);
    try {
      const res = await chatApi.getMessages(conv._id);
      const raw = res.data.data;
      const msgs = Array.isArray(raw) ? raw : [];
      setMessages([...msgs].reverse());
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = () => {
    if (!selected || !messageText.trim()) return;
    socketSend(selected._id, messageText.trim());
    setMessageText('');
    sendTypingStop(selected._id);
  };

  const handleTypingInput = (val: string) => {
    setMessageText(val);
    if (!selected) return;
    sendTypingStart(selected._id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTypingStop(selected._id), 2000);
  };

  const getDriverLabel = (conv: Conversation) => {
    if (!conv.driver) return '—';
    if (typeof conv.driver === 'string') return conv.driver;
    return conv.driver.name || conv.driver.phone || '—';
  };

  const isOwnMessage = (msg: Message) => msg.sender?._id === (user as { _id?: string } | null)?._id;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col shrink-0">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Chats</h1>
            <p className="text-xs text-gray-500 mt-0.5">Booking-linked conversations</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400" title="Live" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No conversations yet</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${
                  selected?._id === conv._id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {getDriverLabel(conv)}
                  </p>
                  <p className="text-xs text-gray-400 shrink-0 ml-2">
                    {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString('en-IN') : ''}
                  </p>
                </div>
                {conv.booking?.bookingId && (
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{conv.booking.bookingId}</p>
                )}
                {conv.lastMessage?.text && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{conv.lastMessage.text}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
          {/* Header */}
          <div className="bg-white border-b px-5 py-3">
            <p className="font-semibold text-gray-900">{getDriverLabel(selected)}</p>
            {selected.booking?.bookingId && (
              <p className="text-xs text-gray-400 font-mono">{selected.booking.bookingId}</p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMsgs ? (
              <div className="text-center text-gray-400 text-sm py-8">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">No messages yet</div>
            ) : (
              messages.map((msg) => {
                const own = isOwnMessage(msg);
                const isStaff = ['staff', 'internal', 'super-admin'].includes(
                  msg.sender?.role ?? ''
                );
                const alignRight = own || isStaff;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${alignRight ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-sm rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        alignRight
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 border rounded-bl-none'
                      }`}
                    >
                      {!alignRight && (
                        <p className="text-xs font-medium text-gray-400 mb-1">
                          {msg.sender?.name || msg.sender?.phone || 'Driver'}
                        </p>
                      )}
                      <p className="break-words">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${alignRight ? 'text-blue-200' : 'text-gray-400'}`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {typingUser && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-2 text-xs text-gray-400 shadow-sm">
                  {typingUser} is typing...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t px-4 py-3 flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => handleTypingInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!messageText.trim()}>
              Send
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm bg-gray-50">
          Select a conversation to start chatting
        </div>
      )}
    </div>
  );
}
