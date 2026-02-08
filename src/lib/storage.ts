export const STORAGE_KEY = "neon-invaders:v1";

export type Persisted = {
  highScore: number;
  soundEnabled: boolean;
  reducedMotion: boolean;
};

export const defaultPersisted: Persisted = {
  highScore: 0,
  soundEnabled: true,
  reducedMotion: false,
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

export function tryBeep(enabled: boolean, freq: number, ms: number, type: OscillatorType = "square") {
  if (!enabled) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    const t = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.stop(t + ms / 1000 + 0.02);
    setTimeout(() => ctx.close(), ms + 120);
  } catch {
    // ignore
  }
}
