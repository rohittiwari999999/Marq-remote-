import React, { useState, useEffect } from 'react';
import { Wifi, Signal, BatteryCharging, Battery, Volume2, VolumeX, Vibrate, Sparkles, Sliders, Radio, AlertTriangle } from 'lucide-react';
import { soundManager } from '../utils/soundAndHaptics';

interface AndroidStatusBarProps {
  onOpenPresets: () => void;
  onOpenIrStudio: () => void;
  onOpenDiagnostic: () => void;
  onToggleTheme?: () => void;
  activeView: 'remote' | 'split' | 'ac';
  setActiveView: (view: 'remote' | 'split' | 'ac') => void;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({
  onOpenPresets,
  onOpenIrStudio,
  onOpenDiagnostic,
  activeView,
  setActiveView,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [soundOn, setSoundOn] = useState<boolean>(soundManager.isSoundEnabled());
  const [hapticsOn, setHapticsOn] = useState<boolean>(soundManager.isHapticsEnabled());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    soundManager.setSoundEnabled(next);
    setSoundOn(next);
    if (next) soundManager.playRemoteClick();
    soundManager.triggerHaptic('light');
  };

  const handleToggleHaptics = () => {
    const next = !hapticsOn;
    soundManager.setHapticsEnabled(next);
    setHapticsOn(next);
    if (next) soundManager.triggerHaptic('medium');
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 text-slate-200 sticky top-0 z-30 select-none shadow-md">
      {/* Android System Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 text-xs font-medium text-slate-400 border-b border-slate-800/60 bg-slate-950/60">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <span>{currentTime || '12:45'}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-tight text-emerald-400 bg-emerald-950/70 px-1 rounded border border-emerald-800/50">
            5G
          </span>
          <Signal className="w-3.5 h-3.5 text-slate-300" />
          <Wifi className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <span>94%</span>
            <Battery className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>
      </div>

      {/* App Navigation & Action Bar */}
      <div className="flex items-center justify-between px-3 py-2.5 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-inner shadow-amber-300/40 text-slate-950 font-black text-xs tracking-tight">
            231M
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 leading-none">
              MarQ AC Remote
            </div>
            <div className="text-[10px] text-amber-400 font-medium">
              Upix 231M · 1.5 Ton Fixed Speed
            </div>
          </div>
        </div>

        {/* View Switcher: Remote vs Split vs AC */}
        <div className="hidden sm:flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => {
              setActiveView('remote');
              soundManager.triggerHaptic('light');
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeView === 'remote'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Remote
          </button>
          <button
            onClick={() => {
              setActiveView('split');
              soundManager.triggerHaptic('light');
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeView === 'split'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dual View
          </button>
          <button
            onClick={() => {
              setActiveView('ac');
              soundManager.triggerHaptic('light');
            }}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeView === 'ac'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AC Unit
          </button>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Mute AC Beeps & Click Sounds' : 'Unmute Sounds'}
            className={`p-2 rounded-lg border transition-colors ${
              soundOn
                ? 'border-slate-700 text-blue-400 hover:bg-slate-800'
                : 'border-slate-800 text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleHaptics}
            title={hapticsOn ? 'Haptic Vibration ON' : 'Haptics OFF'}
            className={`p-2 rounded-lg border transition-colors ${
              hapticsOn
                ? 'border-slate-700 text-amber-400 hover:bg-slate-800'
                : 'border-slate-800 text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <Vibrate className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenDiagnostic}
            title="Diagnose why AC is not responding to phone"
            className="px-2 py-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold transition-colors flex items-center gap-1.5 text-xs animate-pulse hover:animate-none"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">AC Not Working?</span>
            <span className="sm:hidden">Fix AC</span>
          </button>

          <button
            onClick={onOpenPresets}
            title="Comfort Presets"
            className="p-2 rounded-lg border border-slate-700 text-emerald-400 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline font-medium text-xs">Presets</span>
          </button>

          <button
            onClick={onOpenIrStudio}
            title="IR Code Inspector & Audio Blaster"
            className="p-2 rounded-lg border border-slate-700 text-purple-400 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
          >
            <Radio className="w-4 h-4" />
            <span className="hidden md:inline font-medium text-xs">IR Signals</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab bar for view switching */}
      <div className="flex sm:hidden border-t border-slate-800 grid grid-cols-3 text-center text-xs">
        <button
          onClick={() => {
            setActiveView('remote');
            soundManager.triggerHaptic('light');
          }}
          className={`py-1.5 font-medium transition-colors border-b-2 ${
            activeView === 'remote'
              ? 'border-blue-500 text-blue-400 bg-slate-800/40'
              : 'border-transparent text-slate-400'
          }`}
        >
          Remote
        </button>
        <button
          onClick={() => {
            setActiveView('split');
            soundManager.triggerHaptic('light');
          }}
          className={`py-1.5 font-medium transition-colors border-b-2 ${
            activeView === 'split'
              ? 'border-blue-500 text-blue-400 bg-slate-800/40'
              : 'border-transparent text-slate-400'
          }`}
        >
          Dual View
        </button>
        <button
          onClick={() => {
            setActiveView('ac');
            soundManager.triggerHaptic('light');
          }}
          className={`py-1.5 font-medium transition-colors border-b-2 ${
            activeView === 'ac'
              ? 'border-blue-500 text-blue-400 bg-slate-800/40'
              : 'border-transparent text-slate-400'
          }`}
        >
          AC Room
        </button>
      </div>
    </header>
  );
};
