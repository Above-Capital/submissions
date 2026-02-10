"use client";

import { useEffect } from "react";

export type Hotkey = {
  combo: string; // e.g. "mod+k", "shift+mod+p"
  handler: (e: KeyboardEvent) => void;
};

function normalizeKey(k: string) {
  return k.toLowerCase();
}

function eventToCombo(e: KeyboardEvent) {
  const parts: string[] = [];
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const mod = isMac ? e.metaKey : e.ctrlKey;

  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");
  if (mod) parts.push("mod");

  const key = normalizeKey(e.key);
  // ignore modifier-only presses
  if (["shift", "control", "meta", "alt"].includes(key)) return parts.join("+");
  parts.push(key);
  return parts.join("+");
}

export function useHotkeys(hotkeys: Hotkey[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const combo = eventToCombo(e);
      for (const hk of hotkeys) {
        if (hk.combo === combo) {
          e.preventDefault();
          hk.handler(e);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkeys, enabled]);
}
