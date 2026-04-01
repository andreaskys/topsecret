"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "@/contexts/AuthContext";
import { Notification } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";

export function useWebSocket(onNotification?: (notification: Notification) => void) {
  const { user } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const callbackRef = useRef(onNotification);

  useEffect(() => {
    callbackRef.current = onNotification;
  }, [onNotification]);

  const connect = useCallback(() => {
    if (!user || clientRef.current?.active) return;

    const userEmail = user.email;
    if (!userEmail) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/notifications/${userEmail}`, (message) => {
          try {
            const notification = JSON.parse(message.body) as Notification;
            setUnreadCount((prev) => prev + 1);
            callbackRef.current?.(notification);
          } catch {
            // ignore parse errors
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: () => {
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [user]);

  const disconnect = useCallback(() => {
    if (clientRef.current?.active) {
      clientRef.current.deactivate();
      clientRef.current = null;
      setConnected(false);
    }
  }, []);

  const resetUnreadCount = useCallback((count?: number) => {
    setUnreadCount(count ?? 0);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { connected, unreadCount, resetUnreadCount, disconnect };
}
