/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { PhysicalRemote } from './components/PhysicalRemote';
import { AcIndoorUnit } from './components/AcIndoorUnit';
import { IrStudioModal } from './components/IrStudioModal';
import { PresetsModal } from './components/PresetsModal';
import { TimerModal } from './components/TimerModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ACState, encodeMarQIr } from './utils/irProtocol';
import { soundManager } from './utils/soundAndHaptics';
import { 
  Tv, Wind, Radio, Sparkles, Sliders, Smartphone, 
  RotateCcw, Info, Volume2, ShieldCheck 
} from 'lucide-react';

const INITIAL_AC_STATE: ACState = {
  power: true,
  mode: 'cool',
  temp: 24,
  tempUnit: 'C',
  fanSpeed: 'med',
  swingV: true,
  swingVPos: 0,
  swingH: false,
  turbo: false,
  eco: false,
  sleep: false,
  displayLight: true,
  cleanHealth: false,
  lock: false,
  timerOn: null,
  timerOff: null,
  backlight: true,
};

export default function App() {
  const [acState, setAcState] = useState<ACState>(() => {
    try {
      const saved = localStorage.getItem('marq_ac_state');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_AC_STATE;
  });

  const [activeView, setActiveView] = useState<'remote' | 'split' | 'ac'>('split');
  const [irTransmitting, setIrTransmitting] = useState<boolean>(false);
  const [presetsOpen, setPresetsOpen] = useState<boolean>(false);
  const [irStudioOpen, setIrStudioOpen] = useState<boolean>(false);
  const [timerOpen, setTimerOpen] = useState<boolean>(false);
  const [timerType, setTimerType] = useState<'on' | 'off'>('off');
  const [lastActionToast, setLastActionToast] = useState<string>('Ready');

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('marq_ac_state', JSON.stringify(acState));
    } catch {}
  }, [acState]);

  // Handle screen resize to default to 'split' on desktop and 'remote' on small screens if untouched
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && activeView === 'split') {
        setActiveView('remote');
      }
    };
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setActiveView('remote');
    }
  }, []);

  // Update AC State with IR transmission simulation
  const handleUpdateState = (updater: (prev: ACState) => ACState, actionName: string) => {
    setAcState((prev) => {
      const next = updater(prev);
      
      // Trigger IR transmission flash
      setIrTransmitting(true);
      setTimeout(() => setIrTransmitting(false), 380);

      // Toast action
      setLastActionToast(actionName);

      return next;
    });
  };

  const handleApplyPreset = (preset: Partial<ACState>, name: string) => {
    handleUpdateState((prev) => ({
      ...prev,
      ...preset,
    }), `Applied: ${name}`);
  };

  const handleSetTimer = (hours: number | null, isTimerOff: boolean) => {
    handleUpdateState((prev) => ({
      ...prev,
      timerOff: isTimerOff ? hours : null,
      timerOn: !isTimerOff ? hours : null,
    }), hours ? `Timer set: ${hours}h` : 'Timer cancelled');
  };

  const handleResetRemote = () => {
    soundManager.playRemoteClick();
    soundManager.playAcBeep();
    soundManager.triggerHaptic('medium');
    setAcState(INITIAL_AC_STATE);
    setLastActionToast('Remote Reset to 24°C Cool');
  };

  const handleOpenTimerModal = (type?: 'on' | 'off') => {
    setTimerType(type || 'off');
    setTimerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans-app selection:bg-blue-600 selection:text-white">
      {/* Android System Status Bar & Header */}
      <AndroidStatusBar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenPresets={() => setPresetsOpen(true)}
        onOpenIrStudio={() => setIrStudioOpen(true)}
      />

      {/* PWA Install Banner (Android Chrome / Home screen prompt) */}
      <PWAInstallBanner />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col">
        
        {/* Quick Context Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 mb-2 text-xs text-slate-400 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold text-slate-200">Upix Remote No. 231M · MarQ 1.5 Ton Fixed Speed AC</span>
            <span className="hidden sm:inline text-slate-500">· Exact Match Replacement</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-purple-400">
              IR: 38kHz NEC / AUX
            </span>
            <button
              onClick={handleResetRemote}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
              title="Reset remote to default 24°C Cool"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* View Layouts */}
        {activeView === 'split' ? (
          /* Desktop / Dual View: Remote on Left, AC on Right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
            <div className="lg:col-span-5 flex justify-center">
              <PhysicalRemote
                state={acState}
                onUpdateState={handleUpdateState}
                onOpenTimerModal={handleOpenTimerModal}
                irTransmitting={irTransmitting}
              />
            </div>
            <div className="lg:col-span-7 flex flex-col justify-start">
              <AcIndoorUnit state={acState} />
            </div>
          </div>
        ) : activeView === 'remote' ? (
          /* Mobile Handheld Remote Focus */
          <div className="flex-1 flex flex-col items-center justify-center py-2">
            <PhysicalRemote
              state={acState}
              onUpdateState={handleUpdateState}
              onOpenTimerModal={handleOpenTimerModal}
              irTransmitting={irTransmitting}
            />
          </div>
        ) : (
          /* Virtual AC Unit Focus */
          <div className="flex-1 flex flex-col items-center justify-start py-2">
            <AcIndoorUnit state={acState} />
          </div>
        )}

      </main>

      {/* Floating Action Banner for Mobile Quick Presets & IR */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around z-30 shadow-lg">
        <button
          onClick={() => {
            setActiveView('remote');
            soundManager.triggerHaptic('light');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
            activeView === 'remote' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Remote</span>
        </button>

        <button
          onClick={() => {
            setActiveView('ac');
            soundManager.triggerHaptic('light');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
            activeView === 'ac' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>AC Unit</span>
        </button>

        <button
          onClick={() => {
            setPresetsOpen(true);
            soundManager.triggerHaptic('light');
          }}
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-emerald-400 hover:text-emerald-300 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Presets</span>
        </button>

        <button
          onClick={() => {
            setIrStudioOpen(true);
            soundManager.triggerHaptic('light');
          }}
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-purple-400 hover:text-purple-300 transition"
        >
          <Radio className="w-4 h-4" />
          <span>IR Codes</span>
        </button>
      </nav>

      {/* Dialog Modals */}
      <PresetsModal
        isOpen={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        onApplyPreset={handleApplyPreset}
      />

      <IrStudioModal
        state={acState}
        isOpen={irStudioOpen}
        onClose={() => setIrStudioOpen(false)}
      />

      <TimerModal
        state={acState}
        isOpen={timerOpen}
        initialMode={timerType}
        onClose={() => setTimerOpen(false)}
        onSetTimer={handleSetTimer}
      />
    </div>
  );
}
