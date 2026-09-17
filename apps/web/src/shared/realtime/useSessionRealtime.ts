import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { realtimeEvents, type FocusSession } from "@beneath-the-pine/contracts";
import { ApiRequestError, getSession, realtimeUrl } from "../api/api";

export function useSessionRealtime(sessionId: string | undefined, onSnapshot: (value: FocusSession) => void, enabled = true) {
  const [connection, setConnection] = useState<"connecting" | "live" | "reconnecting" | "offline">("connecting");
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    if (!sessionId || !enabled) return;
    let active = true; let synced = false; let polling = false; let terminal = false;
    // Same-origin polling GETs may omit Origin; WebSocket supplies the header
    // required by the gateway. HTTP refresh remains the unavailable-WS fallback.
    const socket = io(`${realtimeUrl ?? ""}/realtime`, { withCredentials: true, transports: ["websocket"] });
    socketRef.current = socket;
    const accept = (value: FocusSession) => {
      if (!active || value.id !== sessionId) return;
      onSnapshot(value);
      if (value.status !== "active") { terminal = true; socket.disconnect(); }
    };
    const refresh = async () => {
      if (polling || terminal || !active) return;
      polling = true;
      try { const { session } = await getSession(sessionId); if (active) accept(session); }
      catch (failure) {
        if (active) { setError((failure as Error).message); setConnection("offline"); }
        if (failure instanceof ApiRequestError && [401,403,404].includes(failure.status ?? 0)) { terminal = true; socket.disconnect(); }
      } finally { polling = false; }
    };
    socket.on("connect", () => { synced = false; setConnection("connecting"); socket.emit(realtimeEvents.subscribe, { sessionId }); });
    const snapshot = (value: FocusSession) => { if (value.id !== sessionId) return; synced = true; setConnection("live"); setError(""); accept(value); };
    socket.on(realtimeEvents.snapshot, snapshot);
    socket.on(realtimeEvents.sessionUpdated, snapshot);
    socket.on(realtimeEvents.ended, snapshot);
    socket.on(realtimeEvents.presenceUpdated, (value: { sessionId: string }) => { if (value.sessionId === sessionId) void refresh(); });
    socket.on(realtimeEvents.error, () => { synced = false; setConnection("reconnecting"); setError("Chưa đồng bộ được phiên. Đang kiểm tra lại."); void refresh(); });
    socket.on("disconnect", () => { synced = false; if (active && !terminal) setConnection("reconnecting"); });
    socket.on("connect_error", () => { synced = false; if (active) setConnection("offline"); });
    const interval = window.setInterval(() => {
      if (terminal) return;
      if (socket.connected && synced) socket.emit(realtimeEvents.heartbeat, { sessionId });
      if (!synced) void refresh();
    }, 10000);
    const visible = () => { if (document.visibilityState === "visible") { void refresh(); if (socket.connected) socket.emit(realtimeEvents.subscribe, { sessionId }); } };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", visible);
    return () => { active = false; clearInterval(interval); socket.removeAllListeners(); socket.disconnect(); socketRef.current = null; document.removeEventListener("visibilitychange", visible); window.removeEventListener("online", visible); };
  }, [sessionId, onSnapshot, enabled]);
  const setPresence = (presence: "active" | "break") => {
    if (connection !== "live") return;
    socketRef.current?.emit(realtimeEvents.setPresence, { sessionId, presence });
  };
  return { connection, error, setPresence };
}
