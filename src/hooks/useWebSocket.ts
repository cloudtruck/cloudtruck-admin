'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { WS_BASE_URL } from '@/lib/constants';

export function useWebSocket(namespace: string = '') {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const url = `${WS_BASE_URL}${namespace}`;
    
    socketRef.current = io(url, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log(`WebSocket connected to ${namespace || '/'}`);
    });

    socketRef.current.on('disconnect', () => {
      console.log(`WebSocket disconnected from ${namespace || '/'}`);
    });

    socketRef.current.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [namespace, accessToken, isAuthenticated]);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (data: unknown) => void) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  const off = useCallback((event: string, callback?: (data: unknown) => void) => {
    if (callback) {
      socketRef.current?.off(event, callback);
    } else {
      socketRef.current?.off(event);
    }
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);
  const isConnected = useCallback(() => socketRef.current?.connected || false, []);

  return { emit, on, off, getSocket, isConnected };
}

export function useTrackingWebSocket() {
  const { on, emit } = useWebSocket('/tracking');

  const subscribeToBooking = useCallback(
    (bookingId: string) => {
      emit('subscribe-booking', { bookingId });
    },
    [emit]
  );

  const unsubscribeFromBooking = useCallback(
    (bookingId: string) => {
      emit('unsubscribe-booking', { bookingId });
    },
    [emit]
  );

  const onLocationUpdate = useCallback(
    (callback: (data: unknown) => void) => {
      return on('location-update', callback);
    },
    [on]
  );

  const onStatusUpdate = useCallback(
    (callback: (data: unknown) => void) => {
      return on('status-update', callback);
    },
    [on]
  );

  return {
    subscribeToBooking,
    unsubscribeFromBooking,
    onLocationUpdate,
    onStatusUpdate,
  };
}
