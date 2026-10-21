import React, { useState } from 'react';
import { 
  X, Radio, Copy, Check, Download, Volume2, 
  Code, Info, ExternalLink, Cpu, Sparkles 
} from 'lucide-react';
import { ACState, encodeMarQIr } from '../utils/irProtocol';
import { soundManager } from '../utils/soundAndHaptics';

interface IrStudioModalProps {
  state: ACState;
  isOpen: boolean;
  onClose: () => void;
}

export const IrStudioModal: React.FC<IrStudioModalProps> = ({
  state,
  isOpen,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [transmittingAudio, setTransmittingAudio] = useState<boolean>(false);

  if (!isOpen) return null;

  const irPacket = encodeMarQIr(state);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    soundManager.playRemoteClick();
    soundManager.triggerHaptic('light');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTransmitAudioIr = () => {
    setTransmittingAudio(true);
    soundManager.triggerHaptic('medium');
    soundManager.emit38kHzAudioIr(irPacket.rawTimingsMicroseconds);
    setTimeout(() => setTransmittingAudio(false), 800);
  };

  const handleDownloadFlipper = () => {
    const blob = new Blob([irPacket.flipperZeroIrContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MarQ_${state.mode}_${state.temp}C.ir`;
    link.click();
    URL.revokeObjectURL(url);
    soundManager.playRemoteClick();
    soundManager.triggerHaptic('medium');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                IR Signal Studio & Hardware Blaster
              </h3>
              <p className="text-xs text-slate-400">
                NEC / AUX 38 kHz Air Conditioner Protocol Frame
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playRemoteClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          
          {/* Signal summary banner */}
          <div className="bg-purple-950/40 border border-purple-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Current Command Packet
              </div>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {irPacket.hexString}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Carrier: <span className="text-purple-300 font-semibold">38.0 kHz</span> · Pulses: <span className="text-purple-300 font-semibold">{irPacket.rawTimingsMicroseconds.length}</span> · State: {state.power ? 'ON' : 'OFF'} ({state.mode.toUpperCase()}, {state.temp}°C, Fan {state.fanSpeed.toUpperCase()})
              </div>
            </div>

            {/* Hardware Audio Emitter Button */}
            <button
              onClick={handleTransmitAudioIr}
              disabled={transmittingAudio}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition shrink-0 ${
                transmittingAudio
                  ? 'bg-purple-500 text-white animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{transmittingAudio ? 'Blasting 38kHz...' : 'Blast via Audio IR'}</span>
            </button>
          </div>

          {/* Pulse Train Visualizer (Oscilloscope preview) */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">Infrared Pulse Train Waveform</span>
              <span>Lead: 9000µs / 4500µs</span>
            </div>
            <div className="w-full h-12 bg-slate-900/90 rounded-lg p-2 border border-slate-800 flex items-end gap-0.5 overflow-x-auto">
              {irPacket.rawTimingsMicroseconds.slice(0, 48).map((timing, idx) => {
                const isMark = idx % 2 === 0;
                const heightPct = isMark ? 85 : 15;
                const widthPx = Math.max(2, Math.min(24, Math.round(timing / 250)));
                return (
                  <div
                    key={idx}
                    title={`${isMark ? 'Mark' : 'Space'}: ${timing}µs`}
                    style={{
                      height: `${heightPct}%`,
                      width: `${widthPx}px`,
                    }}
                    className={`rounded-xs transition-colors shrink-0 ${
                      isMark ? 'bg-purple-400' : 'bg-slate-700/60'
                    }`}
                  />
                );
              })}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
              <span>9ms Header Burst</span>
              <span>Payload Data Bits (LSB First)</span>
              <span>End Pulse</span>
            </div>
          </div>

          {/* Export formats grid */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Integration & Export Formats
            </div>

            {/* Flipper Zero .ir */}
            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/70 flex items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-white text-xs">Flipper Zero IR File (.ir)</div>
                <div className="text-[11px] text-slate-400">Drop into SD card /infrared folder on Flipper Zero</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(irPacket.flipperZeroIrContent, 'flipper')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1 transition"
                >
                  {copiedKey === 'flipper' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'flipper' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadFlipper}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Broadlink Hex */}
            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/70 flex items-center justify-between gap-2">
              <div className="truncate mr-2">
                <div className="font-semibold text-white text-xs">Broadlink / Home Assistant Hex</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">{irPacket.broadlinkHex.slice(0, 36)}...</div>
              </div>
              <button
                onClick={() => handleCopy(irPacket.broadlinkHex, 'broadlink')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1 transition shrink-0"
              >
                {copiedKey === 'broadlink' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'broadlink' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Arduino IRremote C++ */}
            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/70 flex items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-white text-xs">Arduino / ESP32 IRremote Code</div>
                <div className="text-[11px] text-slate-400">For DIY smart home & ESPHome microcontrollers</div>
              </div>
              <button
                onClick={() => handleCopy(irPacket.arduinoCode, 'arduino')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1 transition"
              >
                {copiedKey === 'arduino' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'arduino' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Android IR Hardware Compatibility Guide */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-bold text-white">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>How To Control Real Physical MarQ ACs From Android:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
              <li>
                <span className="text-slate-200 font-medium">3.5mm / USB-C Audio IR Blaster: </span>
                Plug an inexpensive IR emitter into the phone headphone or USB-C adapter. Turn volume to 100%, then tap the purple "Blast via Audio IR" button!
              </li>
              <li>
                <span className="text-slate-200 font-medium">Built-in IR Blaster (Xiaomi / Poco / Huawei): </span>
                Supported natively on Android devices with ConsumerIR hardware transmitters.
              </li>
              <li>
                <span className="text-slate-200 font-medium">Smart IR Hubs (Tuya / Broadlink / ESP32): </span>
                Copy the Broadlink Hex above into your smart hub or Home Assistant integration to control your AC over Wi-Fi.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={() => {
              soundManager.playRemoteClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
