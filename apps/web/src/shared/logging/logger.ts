// Client-safe frontend logging utilities.
export type FrontendErrorContext = {
  event: string;
  area: "api" | "auth" | "runtime" | "react";
  method?: string;
  path?: string;
  status?: number;
  code?: string;
};

type SafeRecord = Required<Pick<FrontendErrorContext, "event" | "area">> & Omit<FrontendErrorContext, "event" | "area">;
const configuredLevel = import.meta.env.VITE_LOG_LEVEL ?? (import.meta.env.DEV ? "debug" : "error");

export function safeFrontendErrorRecord(context: FrontendErrorContext): SafeRecord {
  const { event, area, method, path, status, code } = context;
  return { event, area, ...(method ? { method } : {}), ...(path ? { path } : {}), ...(status ? { status } : {}), ...(code ? { code } : {}) };
}

export function logFrontendError(context: FrontendErrorContext): void {
  if (configuredLevel === "off") return;
  const record = safeFrontendErrorRecord(context);
  console.groupCollapsed(`%cBeneath the Pine · ${record.event}`, "color:#963b31;font-weight:700");
  console.error(record);
  console.groupEnd();
}

export function installGlobalErrorLogging(): () => void {
  const onError = () => logFrontendError({ event: "window_error", area: "runtime" });
  const onUnhandledRejection = () => logFrontendError({ event: "unhandled_rejection", area: "runtime" });
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
