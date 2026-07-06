type NisrErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type NisrEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: NisrErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __nisrEvents?: NisrEvents;
  }
}

export function reportNisrError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__nisrEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
}