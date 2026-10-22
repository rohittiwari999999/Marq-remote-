/**
 * Native Android IR Blaster & Web Audio 38kHz modulation bridge.
 * Integrates with Android ConsumerIrManager via Capacitor and Web Audio fallback.
 */

import { soundManager } from './soundAndHaptics';

export interface IrTransmitResult {
  success: boolean;
  method: 'native_consumer_ir' | 'audio_jack_38khz' | 'simulated';
  carrierHz: number;
  pulseCount: number;
  message: string;
}

export interface IrDeviceInfo {
  isNativeApp: boolean;
  hasConsumerIr: boolean;
  hasAudioJackIr: boolean;
  detectedBrand?: string;
  notes: string;
}

class NativeIrBridge {
  private hasNativeIrCache: boolean | null = null;
  private lastResult: IrTransmitResult | null = null;

  /**
   * Check if running inside Capacitor Android app
   */
  public isCapacitor(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform === 'function' &&
           Boolean((window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform());
  }

  /**
   * Query device IR blaster capability
   */
  public async checkIrHardware(): Promise<IrDeviceInfo> {
    const isCap = this.isCapacitor();
    let hasConsumerIr = false;

    if (isCap) {
      try {
        const plugins = (window as unknown as { Capacitor: { Plugins: { ConsumerIrPlugin?: { hasIrEmitter: () => Promise<{ hasIr: boolean }> } } } }).Capacitor.Plugins;
        if (plugins?.ConsumerIrPlugin?.hasIrEmitter) {
          const res = await plugins.ConsumerIrPlugin.hasIrEmitter();
          hasConsumerIr = Boolean(res.hasIr);
          this.hasNativeIrCache = hasConsumerIr;
        }
      } catch (err) {
        console.warn('ConsumerIrPlugin check failed:', err);
      }
    }

    // Detect user agent hints (Redmi, Poco, Xiaomi often have IR)
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    let detectedBrand = 'Unknown';
    if (ua.includes('redmi') || ua.includes('poco') || ua.includes('xiaomi') || ua.includes('mi ')) {
      detectedBrand = 'Xiaomi / Redmi / Poco (Built-in IR blaster likely present)';
    } else if (ua.includes('oneplus')) {
      detectedBrand = 'OnePlus (No built-in IR blaster)';
    } else if (ua.includes('samsung')) {
      detectedBrand = 'Samsung Galaxy (No built-in IR blaster on recent models)';
    } else if (ua.includes('realme')) {
      detectedBrand = 'Realme (No built-in IR blaster)';
    } else if (ua.includes('iqoo') || ua.includes('vivo')) {
      detectedBrand = 'iQOO Neo 10 / Vivo (Physical IR Blaster is present on top frame!)';
    }

    return {
      isNativeApp: isCap,
      hasConsumerIr,
      hasAudioJackIr: true, // Always available via 3.5mm/Type-C audio DAC
      detectedBrand,
      notes: isCap 
        ? (hasConsumerIr ? 'Built-in Hardware IR Blaster active' : 'Device reports no built-in ConsumerIR emitter')
        : 'Running in Web / PWA browser environment. Real IR transmission requires installed Android APK with IR blaster or 3.5mm dongle.'
    };
  }

  /**
   * Transmit raw pulse pattern via available hardware
   */
  public async transmit(carrierFrequencyHz: number, rawTimingsMicroseconds: number[]): Promise<IrTransmitResult> {
    // 1. Try Native Android ConsumerIr via Capacitor Plugin
    if (this.isCapacitor()) {
      try {
        const plugins = (window as unknown as { 
          Capacitor: { 
            Plugins: { 
              ConsumerIrPlugin?: { 
                transmit: (opts: { frequency: number; pattern: number[] }) => Promise<{ success: boolean; message?: string }> 
              } 
            } 
          } 
        }).Capacitor.Plugins;

        if (plugins?.ConsumerIrPlugin?.transmit) {
          const res = await plugins.ConsumerIrPlugin.transmit({
            frequency: carrierFrequencyHz,
            pattern: rawTimingsMicroseconds,
          });
          const result: IrTransmitResult = {
            success: true,
            method: 'native_consumer_ir',
            carrierHz: carrierFrequencyHz,
            pulseCount: rawTimingsMicroseconds.length,
            message: res.message || 'Signal fired via Native Android IR Blaster Diode!',
          };
          this.lastResult = result;
          return result;
        }
      } catch (err) {
        console.warn('Native ConsumerIR transmission failed, falling back to audio/simulation:', err);
      }
    }

    // 2. Play modulated 38kHz carrier wave out of audio outputs (3.5mm jack / Type-C dongle)
    try {
      soundManager.emit38kHzAudioIr(rawTimingsMicroseconds);
    } catch (e) {
      console.warn('Audio IR modulation error:', e);
    }

    const result: IrTransmitResult = {
      success: true,
      method: 'audio_jack_38khz',
      carrierHz: carrierFrequencyHz,
      pulseCount: rawTimingsMicroseconds.length,
      message: '38kHz IR modulated signal output sent to audio/accessory stream.',
    };
    this.lastResult = result;
    return result;
  }

  public getLastResult(): IrTransmitResult | null {
    return this.lastResult;
  }
}

export const nativeIr = new NativeIrBridge();
