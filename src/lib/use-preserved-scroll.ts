"use client";

import { useCallback, useRef } from "react";

export function usePreservedScroll() {
  const scrollPositionRef = useRef<number | null>(null);

  const captureScrollPosition = useCallback(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    const position = window.scrollY;
    scrollPositionRef.current = position;
    return position;
  }, []);

  const restoreScrollPosition = useCallback((position = scrollPositionRef.current) => {
    if (typeof window === "undefined" || position == null) {
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: position });
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: position });
      });
    });
  }, []);

  return {
    captureScrollPosition,
    restoreScrollPosition,
  };
}
