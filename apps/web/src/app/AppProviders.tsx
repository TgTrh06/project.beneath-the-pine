import { useEffect, type ReactNode } from "react";
import { ErrorBoundary } from "../shared/errors/ErrorBoundary";
import { installGlobalErrorLogging } from "../shared/logging/logger";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => installGlobalErrorLogging(), []);
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
