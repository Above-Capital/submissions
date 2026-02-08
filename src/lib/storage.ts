export const STORAGE_KEY = "neon-serpent:v1";

export type Persisted = {
  bestScore: number;
  soundEnabled: boolean;
};

export const defaultPersisted: Persisted = {
  bestScore: 0,
  soundEnabled: true,
};

export function loadPersisted(): Persisted {
  if (typeof window === "undefined") return defaultPersisted;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPersisted;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return { ...defaultPersisted, ...parsed };
  } catch {
    return defaultPersisted;
  }
}

export function savePersisted(p: Persisted) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}
