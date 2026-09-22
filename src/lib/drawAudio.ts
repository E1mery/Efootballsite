// Web Audio API Sound Synthesizer for EFRL Continental Draws Event
// Zero external audio asset dependencies for 100% offline & mobile reliability

class DrawAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("efrl_draw_sound_muted");
        this.muted = saved === "true";
      } catch (e) {}
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("efrl_draw_sound_muted", String(muted));
      }
    } catch (e) {}
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Fast mechanical roulette ratchet tick / lottery ball sphere click
   * Triggered repeatedly while player names are cycling at high speed
   */
  public playSpinTick(pitchVariation: number = 1.0) {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sharp lottery drum click sound with rapid frequency decay
      osc.type = "triangle";
      const baseFreq = 540 + Math.random() * 80;
      osc.frequency.setValueAtTime(baseFreq * pitchVariation, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.035);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {}
  }

  /**
   * Capsule pop & athlete card reveal chime
   * Resonant warm major chord when the spinning settles on the chosen athlete
   */
  public playAthleteReveal() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const t = ctx.currentTime;
      // Majestic chord: C5, E5, G5, C6 (523Hz, 659Hz, 784Hz, 1046Hz)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);

        const vol = 0.15 / (idx + 1);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 1.15);
      });
    } catch (e) {}
  }

  /**
   * Group placement lock-in sound
   * Cybernetic slide-and-lock thump when athlete drops into their group slot
   */
  public playGroupLock() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(920, t + 0.14);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {}
  }

  /**
   * Grand continental tournament fanfare
   * Celebratory triumphant melody when all 16 slots are drawn
   */
  public playFanfare() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const t = ctx.currentTime;
      const notes = [
        { f: 523.25, offset: 0.0, dur: 0.22 },   // C5
        { f: 659.25, offset: 0.22, dur: 0.22 },  // E5
        { f: 783.99, offset: 0.44, dur: 0.32 },  // G5
        { f: 1046.5, offset: 0.8, dur: 1.2 },    // C6 (sustain)
      ];

      notes.forEach(({ f, offset, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, t + offset);

        gain.gain.setValueAtTime(0.22, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t + offset);
        osc.stop(t + offset + dur + 0.05);
      });
    } catch (e) {}
  }
}

export const drawAudio = new DrawAudioEngine();
