/**
 * Audio synthesis, Haptic feedback, and 38kHz IR Audio modulation for MarQ AC Remote
 */

class SoundAndHapticsManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;
  private volume: number = 0.8;

  constructor() {
    // Check localStorage preferences
    try {
      const savedSound = localStorage.getItem('marq_remote_sound');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';

      const savedHaptics = localStorage.getItem('marq_remote_haptics');
      if (savedHaptics !== null) this.hapticsEnabled = savedHaptics === 'true';

      const savedVol = localStorage.getItem('marq_remote_volume');
      if (savedVol !== null) this.volume = parseFloat(savedVol) || 0.8;
    } catch {
      // Ignore if localStorage unavailable
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('marq_remote_sound', String(enabled));
    } catch {}
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
    try {
      localStorage.setItem('marq_remote_haptics', String(enabled));
    } catch {}
  }

  public isHapticsEnabled(): boolean {
    return this.hapticsEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('marq_remote_volume', String(this.volume));
    } catch {}
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Classic Split AC indoor unit acknowledgment high-pitch beep
   * 2,400 Hz sine wave for ~75ms with sharp attack and fast decay
   */
  public playAcBeep() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2450, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Double beep for power toggle / special mode acknowledgment
   */
  public playDoubleBeep() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Beep 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2450, now);
      gain1.gain.setValueAtTime(0.35 * this.volume, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.075);

      // Beep 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2600, now + 0.09);
      gain2.gain.setValueAtTime(0.35 * this.volume, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.18);
    } catch (e) {
      console.warn('Double beep error:', e);
    }
  }

  /**
   * Subtle tactile rubber button click sound
   */
  public playRemoteClick() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.03);

      gain.gain.setValueAtTime(0.15 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {
      console.warn('Click audio error:', e);
    }
  }

  /**
   * Haptic vibration feedback using Android Vibration API
   */
  public triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'double' = 'light') {
    if (!this.hapticsEnabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) {
      return;
    }

    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(30);
          break;
        case 'heavy':
          navigator.vibrate(60);
          break;
        case 'double':
          navigator.vibrate([20, 40, 20]);
          break;
      }
    } catch (e) {
      console.warn('Haptics failed:', e);
    }
  }

  /**
   * Emit real 38 kHz modulated carrier wave on audio jack / USB-C output
   * Allows 3.5mm IR Blaster LEDs (cheap plug-in accessories on Amazon/Flipkart) to emit physical IR!
   */
  public emit38kHzAudioIr(timingsMicroseconds: number[]) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      // Generate audio buffer containing 38kHz square/sine bursts
      const sampleRate = ctx.sampleRate;
      const totalDurationSec = timingsMicroseconds.reduce((a, b) => a + b, 0) / 1_000_000;
      
      // Safety limit total audio burst length to 1.5 seconds max
      if (totalDurationSec <= 0 || totalDurationSec > 1.5) return;

      const totalSamples = Math.floor(sampleRate * totalDurationSec);
      const audioBuffer = ctx.createBuffer(2, totalSamples, sampleRate);
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.getChannelData(1);

      let currentSampleIndex = 0;
      const carrierFreq = 38000;

      for (let i = 0; i < timingsMicroseconds.length; i++) {
        const durationSec = timingsMicroseconds[i] / 1_000_000;
        const pulseSamples = Math.floor(sampleRate * durationSec);
        const isMark = i % 2 === 0; // Even indices are Mark (carrier ON), odd are Space (silence)

        for (let s = 0; s < pulseSamples && currentSampleIndex < totalSamples; s++, currentSampleIndex++) {
          if (isMark) {
            // Full volume 38kHz square pulse for maximum IR LED output
            const phase = (2 * Math.PI * carrierFreq * s) / sampleRate;
            const val = Math.sin(phase) > 0 ? 1.0 : -1.0;
            leftChannel[currentSampleIndex] = val;
            rightChannel[currentSampleIndex] = -val; // Out of phase for differential LED drive across L/R
          } else {
            leftChannel[currentSampleIndex] = 0;
            rightChannel[currentSampleIndex] = 0;
          }
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn('38kHz IR audio modulation error:', e);
    }
  }
}

export const soundManager = new SoundAndHapticsManager();
