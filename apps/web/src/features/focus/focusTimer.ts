import { useEffect, useState } from "react";

export type FocusTimerStatus = "idle" | "running" | "paused" | "finished";

export function formatFocusTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

export function useFocusTimer() {
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<FocusTimerStatus>("idle");

  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setStatus("finished");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  return {
    seconds,
    status,
    start: (durationSeconds: number) => { setSeconds(Math.max(0, durationSeconds)); setStatus("running"); },
    pause: () => setStatus((current) => current === "running" ? "paused" : current),
    resume: () => setStatus((current) => current === "paused" || current === "finished" ? "running" : current),
    reset: () => { setSeconds(0); setStatus("idle"); },
  };
}
