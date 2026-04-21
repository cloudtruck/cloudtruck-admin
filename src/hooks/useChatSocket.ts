'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

interface Message {
  _id: string;
  conversation: string;
  sender?: { _id: string; name?: string; phone?: string; role?: string };
  text: string;
  createdAt: string;
}

interface UseChatSocketOptions {
  conversationId: string | null;
  onMessage: (msg: Message) => void;
  onTyping?: (data: { userId: string; name: string; typing: boolean }) => void;
  onRead?: (data: { conversationId: string; userId: string }) => void;
}

export function useChatSocket({
  conversationId,
  onMessage,
  onTyping,
  onRead,
}: UseChatSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('message:new', onMessage);
    if (onTyping) socket.on('user:typing', onTyping);
    if (onRead) socket.on('conversation:read', onRead);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;

    socket.emit('conversation:join', { conversationId });
  }, [conversationId]);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    socketRef.current?.emit('message:send', { conversationId, text });
  }, []);

  const sendTypingStart = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:start', { conversationId });
  }, []);

  const sendTypingStop = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:stop', { conversationId });
  }, []);

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('message:read', { conversationId });
  }, []);

  return { sendMessage, sendTypingStart, sendTypingStop, markRead };
}
