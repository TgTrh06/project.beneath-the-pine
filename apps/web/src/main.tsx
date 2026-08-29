import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { ErrorBoundary } from "./shared/errors/ErrorBoundary";
import { installGlobalErrorLogging } from "./shared/logging/logger";
import "./shared/styles/global.css";

installGlobalErrorLogging();
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </StrictMode>
);
