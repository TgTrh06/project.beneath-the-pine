import { useCallback, useEffect, useRef, useState } from "react";
import { focusSessionSchema, realtimeEvents, type FocusSession } from "@pyneath/contracts";
import { io, type Socket } from "socket.io-client";
import { ApiRequestError, getSession, realtimeUrl } from "../api/api";

type Connection = "connecting" | "live" | "reconnecting" | "offline";

export function useSessionRealtime(sessionId: string | undefined, onSnapshot: (value: FocusSession) => void, enabled = true) {
  const [connection, setConnection] = useState<Connection>("connecting");
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const retryRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!sessionId || !enabled) return;
    let active = true;
    let synced = false;
    let polling = false;
    let terminal = false;
    let retryTimer: number | undefined;
    let latest: FocusSession | null = null;
    setConnection("connecting");
    setError("");
    setAuthorized(true);
    setLastSyncedAt(null);

    // Same-origin polling GETs may omit Origin; WebSocket supplies the header
    // required by the gateway. HTTP refresh remains the unavailable-WS fallback.
    const socket = io(`${realtimeUrl ?? ""}/realtime`, { withCredentials: true, transports: ["websocket"] });
    socketRef.current = socket;

    const accept = (value: FocusSession) => {
      if (!active || value.id !== sessionId) return false;
      const previous = latest;
      const terminalStatus = value.status !== "active";
      if (previous) {
        if (previous.status !== "active" && !terminalStatus) return false;
        if (Date.parse(value.serverNow) < Date.parse(previous.serverNow)) return false;
      }
      latest = value;
      onSnapshot(value);
      setLastSyncedAt(Date.now());
      setError("");
      if (terminalStatus) {
        terminal = true;
        synced = true;
        setConnection("live");
        socket.disconnect();
      }
      return true;
    };

    const refresh = async () => {
      if (polling || terminal || !active) return;
      polling = true;
      try {
        const { session } = await getSession(sessionId);
        if (active) {
          accept(session);
          if (socket.connected && !synced && !terminal) socket.emit(realtimeEvents.subscribe, { sessionId });
        }
      } catch (failure) {
        if (!active) return;
        setError((failure as Error).message);
        setConnection("offline");
        if (failure instanceof ApiRequestError && [401, 403, 404].includes(failure.status ?? 0)) {
          terminal = true;
          setAuthorized(false);
          socket.disconnect();
        }
      } finally {
        polling = false;
      }
    };

    const syncNow = () => {
      if (!active || terminal) return;
      if (socket.connected) {
        synced = false;
        setConnection("reconnecting");
        socket.emit(realtimeEvents.subscribe, { sessionId });
      }
      void refresh();
    };
    retryRef.current = syncNow;

    socket.on("connect", () => {
      synced = false;
      setConnection("connecting");
      socket.emit(realtimeEvents.subscribe, { sessionId });
      void refresh();
    });
    const snapshot = (raw: unknown) => {
      const parsed = focusSessionSchema.safeParse(raw);
      if (!parsed.success || parsed.data.id !== sessionId) return;
      if (!accept(parsed.data)) return;
      synced = true;
      setConnection("live");
      setAuthorized(true);
    };
    socket.on(realtimeEvents.snapshot, snapshot);
    socket.on(realtimeEvents.sessionUpdated, snapshot);
    socket.on(realtimeEvents.ended, snapshot);
    socket.on(realtimeEvents.presenceUpdated, (value: { sessionId: string }) => {
      if (value.sessionId === sessionId) void refresh();
    });
    socket.on(realtimeEvents.error, () => {
      synced = false;
      setConnection("reconnecting");
      setError("Chưa đồng bộ được phiên. Đang tải lại trạng thái từ máy chủ.");
      void refresh();
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      if (socket.connected) retryTimer = window.setTimeout(() => {
        if (active && !terminal && socket.connected && !synced) socket.emit(realtimeEvents.subscribe, { sessionId });
      }, 1000);
    });
    socket.on("disconnect", () => {
      synced = false;
      if (active && !terminal) setConnection("reconnecting");
    });
    socket.on("connect_error", () => {
      synced = false;
      if (active && !terminal) setConnection("offline");
    });

    const interval = window.setInterval(() => {
      if (terminal) return;
      if (socket.connected && synced) socket.emit(realtimeEvents.heartbeat, { sessionId });
      if (!synced) {
        void refresh();
        if (socket.connected) socket.emit(realtimeEvents.subscribe, { sessionId });
      }
    }, 10000);
    const visible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
        if (socket.connected) socket.emit(realtimeEvents.subscribe, { sessionId });
      }
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", syncNow);
    return () => {
      active = false;
      clearInterval(interval);
      if (retryTimer !== undefined) clearTimeout(retryTimer);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      retryRef.current = () => undefined;
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", syncNow);
    };
  }, [sessionId, onSnapshot, enabled]);

  const setPresence = (presence: "active" | "break") => {
    if (connection !== "live" || !authorized) return;
    socketRef.current?.emit(realtimeEvents.setPresence, { sessionId, presence });
  };

  const retrySync = useCallback(() => retryRef.current(), []);
  return { connection, error, authorized, lastSyncedAt, retrySync, setPresence };
}
