import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { realtimeEvents, type FocusSession } from "@beneath-the-pine/contracts";
import { realtimeUrl } from "../api/api";
export function useSessionRealtime(sessionId: string | undefined, onSnapshot: (value: FocusSession) => void) {
  const [connected, setConnected] = useState(false);
  useEffect(() => { if (!sessionId) return; const socket = io(`${realtimeUrl ?? ""}/realtime`, { withCredentials: true }); const subscribe = () => { setConnected(true); socket.emit(realtimeEvents.subscribe, { sessionId }); }; socket.on("connect", subscribe); socket.on("disconnect", () => setConnected(false)); socket.on(realtimeEvents.snapshot, onSnapshot); socket.on(realtimeEvents.sessionUpdated, onSnapshot); socket.on(realtimeEvents.ended, onSnapshot); const heartbeat = window.setInterval(() => socket.emit(realtimeEvents.heartbeat, { sessionId }), 10000); return () => { clearInterval(heartbeat); socket.disconnect(); }; }, [sessionId, onSnapshot]);
  return connected;
}
