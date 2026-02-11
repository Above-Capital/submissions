import { ResumeState } from "./types";
import { safeParse } from "./utils";

const KEY = "resume:state:v1";

export function loadState(): ResumeState | null {
  if (typeof window === "undefined") return null;
  return safeParse<ResumeState>(window.localStorage.getItem(KEY));
}

export function saveState(st: ResumeState) {
  window.localStorage.setItem(KEY, JSON.stringify(st));
}
