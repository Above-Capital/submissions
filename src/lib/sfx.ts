export type Sfx = {
  ping: () => void;
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

  const tone = (freq: number, dur = 0.06, type: OscillatorType = "sine") => {
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
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0);
    o.stop(t0 + dur + 0.01);
  };

  return {
    ping: () => tone(880, 0.05, "triangle"),
    goal: () => {
      tone(196, 0.08, "sawtooth");
      setTimeout(() => tone(392, 0.08, "sawtooth"), 55);
    },
    toggle: () => tone(660, 0.04, "square"),
  };
}
