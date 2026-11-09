import { KeystrokeSoundId } from '../types';

export class AudioService {
  private static ctx: AudioContext | null = null;
  private static keystrokeGain: GainNode | null = null;
  private static masterGain: GainNode | null = null;

  // Ensure AudioContext is initialized after user gesture
  private static initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.keystrokeGain = this.ctx.createGain();
      this.keystrokeGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.keystrokeGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public static setKeystrokeVolume(vol: number): void {
    const ctx = this.initContext();
    if (this.keystrokeGain) {
      this.keystrokeGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), ctx.currentTime, 0.05);
    }
  }

  // =========================================================================
  // Tactile Mechanical Keyboard Audio Engine
  // =========================================================================

  public static playKeystroke(soundId: KeystrokeSoundId, key: string = ''): void {
    if (soundId === 'none') return;
    const ctx = this.initContext();

    switch (soundId) {
      case 'typewriter':
        this.playTypewriterSound(ctx, key);
        break;
      case 'clicky':
        this.playClickySound(ctx);
        break;
      case 'thock':
        this.playThockSound(ctx);
        break;
      case 'bubble':
        this.playBubbleSound(ctx);
        break;
    }
  }

  // 1. Vintage Typewriter with Enter carriage bell
  private static playTypewriterSound(ctx: AudioContext, key: string): void {
    const isEnter = key === 'Enter';

    if (isEnter) {
      // Brass Bell Ding!
      const bellOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(2400, ctx.currentTime);
      bellOsc.frequency.exponentialRampToValueAtTime(2380, ctx.currentTime + 0.4);

      bellGain.gain.setValueAtTime(0.18, ctx.currentTime);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      bellOsc.connect(bellGain);
      bellGain.connect(this.keystrokeGain!);
      bellOsc.start();
      bellOsc.stop(ctx.currentTime + 0.5);
    }

    // Metallic striker clack
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const freq = 1200 + Math.random() * 300;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.03);

    oscGain.gain.setValueAtTime(0.16, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

    osc.connect(oscGain);
    oscGain.connect(this.keystrokeGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  // 2. Cherry MX Blue Clicky
  private static playClickySound(ctx: AudioContext): void {
    // Sharp click
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(3600 + Math.random() * 400, ctx.currentTime);

    clickGain.gain.setValueAtTime(0.14, ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.012);

    clickOsc.connect(clickGain);
    clickGain.connect(this.keystrokeGain!);
    clickOsc.start();
    clickOsc.stop(ctx.currentTime + 0.015);

    // Bottom out thud
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(220, ctx.currentTime);
    thudOsc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.03);

    thudGain.gain.setValueAtTime(0.08, ctx.currentTime);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    thudOsc.connect(thudGain);
    thudGain.connect(this.keystrokeGain!);
    thudOsc.start();
    thudOsc.stop(ctx.currentTime + 0.035);
  }

  // 3. Deep Thock (Lubed Linear Switch)
  private static playThockSound(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const baseFreq = 160 + Math.random() * 25;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(this.keystrokeGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // 4. Soft Bubble Pop
  private static playBubbleSound(ctx: AudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startFreq = 420 + Math.random() * 120;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.2, ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.keystrokeGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  }
}
