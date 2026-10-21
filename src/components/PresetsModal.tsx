import React from 'react';
import { X, Zap, Moon, Leaf, CloudRain, Wind, Sparkles } from 'lucide-react';
import { ACState } from '../utils/irProtocol';
import { soundManager } from '../utils/soundAndHaptics';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: Partial<ACState>, name: string) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
}) => {
  if (!isOpen) return null;

  const presets = [
    {
      id: 'super-chill',
      title: 'Quick Super Chill',
      subtitle: 'Instant relief from scorching summer heat',
      icon: Zap,
      color: 'from-amber-500/20 to-amber-700/10 text-amber-400 border-amber-600/30',
      badgeColor: 'bg-amber-500/20 text-amber-300',
      settings: {
        power: true,
        mode: 'cool' as const,
        temp: 16,
        fanSpeed: 'high' as const,
        turbo: true,
        eco: false,
        sleep: false,
        swingV: true,
        displayLight: true,
      },
    },
    {
      id: 'night-comfort',
      title: 'Comfortable Night Sleep',
      subtitle: 'Gentle temperature curve, whisper-quiet low fan & dim display',
      icon: Moon,
      color: 'from-indigo-500/20 to-indigo-700/10 text-indigo-400 border-indigo-600/30',
      badgeColor: 'bg-indigo-500/20 text-indigo-300',
      settings: {
        power: true,
        mode: 'cool' as const,
        temp: 26,
        fanSpeed: 'low' as const,
        turbo: false,
        eco: false,
        sleep: true,
        swingV: false,
        displayLight: false,
      },
    },
    {
      id: 'eco-saver',
      title: 'Green Eco Saver',
      subtitle: 'Optimal fixed-speed cooling at 24°C with minimum power bill',
      icon: Leaf,
      color: 'from-emerald-500/20 to-emerald-700/10 text-emerald-400 border-emerald-600/30',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      settings: {
        power: true,
        mode: 'cool' as const,
        temp: 24,
        fanSpeed: 'auto' as const,
        turbo: false,
        eco: true,
        sleep: false,
        swingV: true,
        displayLight: true,
      },
    },
    {
      id: 'monsoon-dry',
      title: 'Monsoon Dehumidify',
      subtitle: 'Extracts sticky humidity while preventing overcooling',
      icon: CloudRain,
      color: 'from-cyan-500/20 to-cyan-700/10 text-cyan-400 border-cyan-600/30',
      badgeColor: 'bg-cyan-500/20 text-cyan-300',
      settings: {
        power: true,
        mode: 'dry' as const,
        temp: 23,
        fanSpeed: 'med' as const,
        turbo: false,
        eco: false,
        sleep: false,
        swingV: true,
        displayLight: true,
      },
    },
    {
      id: 'air-circulate',
      title: 'Breeze Circulation',
      subtitle: 'Fan only mode with multi-directional louver swing',
      icon: Wind,
      color: 'from-blue-500/20 to-blue-700/10 text-blue-400 border-blue-600/30',
      badgeColor: 'bg-blue-500/20 text-blue-300',
      settings: {
        power: true,
        mode: 'fan' as const,
        fanSpeed: 'high' as const,
        turbo: false,
        eco: false,
        sleep: false,
        swingV: true,
        swingH: true,
        displayLight: true,
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">One-Tap Comfort Presets</h3>
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

        {/* Preset Cards List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {presets.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => {
                  soundManager.playRemoteClick();
                  soundManager.playAcBeep();
                  soundManager.triggerHaptic('medium');
                  onApplyPreset(p.settings, p.title);
                  onClose();
                }}
                className={`w-full p-4 rounded-2xl bg-gradient-to-r ${p.color} border text-left hover:scale-[1.01] transition-all flex items-start gap-3.5 group`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900/60 flex items-center justify-center shrink-0 border border-slate-700 shadow-sm mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">
                      {p.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                      {p.settings.mode.toUpperCase()} · {p.settings.temp ? `${p.settings.temp}°C` : 'FAN'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {p.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={() => {
              soundManager.playRemoteClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
