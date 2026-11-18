import { useEffect, useRef } from "react";

/** Refresh lightweight server state while the page is visible. */
export function useVisiblePolling(
  refresh: () => Promise<void> | void,
  intervalMs = 15_000,
) {
  const refreshRef = useRef(refresh);
  const runningRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const run = async () => {
      if (document.visibilityState === "hidden" || runningRef.current) return;
      runningRef.current = true;
      try {
        await refreshRef.current();
      } finally {
        runningRef.current = false;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void run();
    };

    const timer = window.setInterval(() => void run(), intervalMs);
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs]);
}
