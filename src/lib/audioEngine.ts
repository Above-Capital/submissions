import { TrackId } from "./types";

export type EngineParams = {
  master: number;
  trackGain: Record<TrackId, number>;
};

export class DrumEngine {
  ctx: AudioContext;
  master: GainNode;
  limiter: DynamicsCompressorNode;
  bus: GainNode;
  track: Record<TrackId, GainNode>;
  noiseBuf: AudioBuffer;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;

    // gentle limiter
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -10;
    this.limiter.knee.value = 18;
    this.limiter.ratio.value = 6;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.12;

    this.bus = this.ctx.createGain();
    this.bus.gain.value = 1;

    const mk = () => {
      const g = this.ctx.createGain();
      g.gain.value = 1;
      g.connect(this.bus);
      return g;
    };

    this.track = {
      kick: mk(),
      snare: mk(),
      hat: mk(),
      clap: mk(),
      tom: mk(),
      rim: mk(),
      perc: mk(),
      crash: mk(),
    };

    this.bus.connect(this.limiter);
    this.limiter.connect(this.master);
    this.master.connect(this.ctx.destination);

    this.noiseBuf = this.makeNoiseBuffer(1.5);
  }

  async ensureRunning() {
    if (this.ctx.state !== "running") await this.ctx.resume();
  }

  setMaster(v: number) {
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }

  setTrackGain(id: TrackId, v: number) {
    this.track[id].gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }

  now() {
    return this.ctx.currentTime;
  }

  // --- voices ---

  trigger(id: TrackId, t: number, vel = 0.9) {
    switch (id) {
      case "kick":
        return this.kick(t, vel);
      case "snare":
        return this.snare(t, vel);
      case "hat":
        return this.hat(t, vel);
      case "clap":
        return this.clap(t, vel);
      case "tom":
        return this.tom(t, vel);
      case "rim":
        return this.rim(t, vel);
      case "perc":
        return this.perc(t, vel);
      case "crash":
        return this.crash(t, vel);
    }
  }

  private makeNoiseBuffer(seconds: number) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * 0.9;
    return buf;
  }

  private noise(t: number, dur: number) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(g);
    src.start(t);
    src.stop(t + dur + 0.02);
    return { src, out: g };
  }

  private kick(t: number, vel: number) {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    const g = this.ctx.createGain();

    const f0 = 140;
    const f1 = 44;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + 0.12);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.95 * vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(g);
    g.connect(this.track.kick);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  private snare(t: number, vel: number) {
    const body = this.ctx.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(220, t);
    body.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    const bodyG = this.ctx.createGain();
    bodyG.gain.setValueAtTime(0.0001, t);
    bodyG.gain.exponentialRampToValueAtTime(0.35 * vel, t + 0.004);
    bodyG.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    const { src, out: noiseG } = this.noise(t, 0.16);
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1800, t);
    bp.Q.value = 0.6;

    const nG = this.ctx.createGain();
    nG.gain.setValueAtTime(0.0001, t);
    nG.gain.exponentialRampToValueAtTime(0.75 * vel, t + 0.003);
    nG.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    body.connect(bodyG);
    bodyG.connect(this.track.snare);

    src.connect(noiseG);
    noiseG.connect(bp);
    bp.connect(nG);
    nG.connect(this.track.snare);

    body.start(t);
    body.stop(t + 0.18);
  }

  private hat(t: number, vel: number) {
    const { src, out } = this.noise(t, 0.06);
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(7000, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.65 * vel, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    src.connect(out);
    out.connect(hp);
    hp.connect(g);
    g.connect(this.track.hat);
  }

  private clap(t: number, vel: number) {
    // multi-burst noise
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(1200, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.85 * vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    hp.connect(g);
    g.connect(this.track.clap);

    const bursts = [0, 0.015, 0.03, 0.045];
    for (const off of bursts) {
      const { src, out } = this.noise(t + off, 0.08);
      src.connect(out);
      out.connect(hp);
    }
  }

  private tom(t: number, vel: number) {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55 * vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(g);
    g.connect(this.track.tom);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  private rim(t: number, vel: number) {
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(950, t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35 * vel, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(g);
    g.connect(this.track.rim);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  private perc(t: number, vel: number) {
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.12);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.45 * vel, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g);
    g.connect(this.track.perc);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  private crash(t: number, vel: number) {
    const { src, out } = this.noise(t, 0.8);
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(3500, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.8 * vel, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);

    src.connect(out);
    out.connect(hp);
    hp.connect(g);
    g.connect(this.track.crash);
  }
}
