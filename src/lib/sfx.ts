export type Sfx = {
  shot: () => void;
  hit: () => void;
  goal: () => void;
  toggle: () => void;
};

export function createSfx(enabled: () => boolean): Sfx {
  let ctx: AudioContext | null = null;

  const ensure = () => {
    if (!enabled()) return null;
    const AnyWindow = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    if (!ctx) ctx = new (AnyWindow.AudioContext || AnyWindow.webkitAudioContext!)();
    return ctx;
  };

  const blip = (freq: number, dur: number, type: OscillatorType, gain = 0.12) => {
    const c = ensure();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(c.destination);

    const t0 = c.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0);
    o.stop(t0 + dur + 0.01);
  };

  return {
    shot: () => blip(880, 0.05, "triangle", 0.10),
    hit: () => blip(220, 0.06, "sawtooth", 0.12),
    goal: () => {
      blip(196, 0.08, "square", 0.12);
      setTimeout(() => blip(392, 0.09, "square", 0.12), 70);
    },
    toggle: () => blip(660, 0.04, "square", 0.08),
  };
}
