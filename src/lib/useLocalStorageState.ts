"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function useDebouncedEffect(effect: () => void, deps: any[], ms = 150) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => effect(), ms);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, deps);
}

export function useClientMemo<T>(fn: () => T, deps: any[]) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return useMemo(() => (ready ? fn() : (null as unknown as T)), [ready, ...deps]);
}
