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
import { AcDiagnosticModal } from './components/AcDiagnosticModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ACState, encodeMarQIr, MarQProtocolType, PROTOCOL_PROFILES } from './utils/irProtocol';
import { soundManager } from './utils/soundAndHaptics';
import { nativeIr, IrTransmitResult } from './utils/nativeIr';
import { 
  Tv, Wind, Radio, Sparkles, Sliders, Smartphone, 
  RotateCcw, Info, Volume2, ShieldCheck, AlertTriangle,
  Zap, Wrench, CheckCircle2
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
  activeProtocol: 'aux_upix231',
};

export default function App() {
  const [acState, setAcState] = useState<ACState>(() => {
    try {
      const saved = localStorage.getItem('marq_ac_state');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_AC_STATE;
  });

  const [activeProtocol, setActiveProtocol] = useState<MarQProtocolType>(() => {
    try {
      return (localStorage.getItem('marq_ac_protocol') as MarQProtocolType) || 'aux_upix231';
    } catch {
      return 'aux_upix231';
    }
  });

  const [activeView, setActiveView] = useState<'remote' | 'split' | 'ac'>('split');
  const [irTransmitting, setIrTransmitting] = useState<boolean>(false);
  const [presetsOpen, setPresetsOpen] = useState<boolean>(false);
  const [irStudioOpen, setIrStudioOpen] = useState<boolean>(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState<boolean>(false);
  const [timerOpen, setTimerOpen] = useState<boolean>(false);
  const [timerType, setTimerType] = useState<'on' | 'off'>('off');
  const [lastActionToast, setLastActionToast] = useState<string>('Ready');
  const [lastTransmitMethod, setLastTransmitMethod] = useState<string>('Ready');

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('marq_ac_state', JSON.stringify({ ...acState, activeProtocol }));
      localStorage.setItem('marq_ac_protocol', activeProtocol);
    } catch {}
  }, [acState, activeProtocol]);

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

  // Update AC State with IR transmission
  const handleUpdateState = (updater: (prev: ACState) => ACState, actionName: string) => {
    setAcState((prev) => {
      const next = updater({ ...prev, activeProtocol });
      
      // Trigger IR transmission flash
      setIrTransmitting(true);
      setTimeout(() => setIrTransmitting(false), 380);

      // Encode packet for active protocol
      const packet = encodeMarQIr(next, activeProtocol);

      // Transmit via native ConsumerIR or Web Audio 38kHz modulation
      nativeIr.transmit(packet.carrierFrequencyHz, packet.rawTimingsMicroseconds).then((res) => {
        if (res.method === 'native_consumer_ir') {
          setLastTransmitMethod('Android IR Blaster (38kHz)');
        } else {
          setLastTransmitMethod('38kHz Audio Modulation');
        }
      });

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
    setAcState({ ...INITIAL_AC_STATE, activeProtocol });
    setLastActionToast('Remote Reset to 24°C Cool');
  };

  const handleOpenTimerModal = (type?: 'on' | 'off') => {
    setTimerType(type || 'off');
    setTimerOpen(true);
  };

  const handleSelectProtocol = (proto: MarQProtocolType) => {
    setActiveProtocol(proto);
    soundManager.playAcBeep();
    setLastActionToast(`Switched to: ${proto.toUpperCase()}`);
  };

  const handleTriggerTestPulse = (proto: MarQProtocolType) => {
    setActiveProtocol(proto);
    setIrTransmitting(true);
    setTimeout(() => setIrTransmitting(false), 500);
    setLastActionToast(`Fired ${proto.toUpperCase()} Test Pulse`);
  };

  const currentProfile = PROTOCOL_PROFILES.find(p => p.id === activeProtocol) || PROTOCOL_PROFILES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans-app selection:bg-blue-600 selection:text-white">
      {/* Android System Status Bar & Header */}
      <AndroidStatusBar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenPresets={() => setPresetsOpen(true)}
        onOpenIrStudio={() => setIrStudioOpen(true)}
        onOpenDiagnostic={() => setDiagnosticOpen(true)}
      />

      {/* PWA Install Banner (Android Chrome / Home screen prompt) */}
      <PWAInstallBanner />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col">
        
        {/* Quick Context & Troubleshooting Banner */}
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5 sm:px-4 sm:py-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-300">MarQ 1.5T AC (Upix 231M)</span>
              <span className="text-slate-300 ml-1.5 hidden md:inline">
                · Active Profile: <strong className="text-white">{currentProfile.oem}</strong> (38kHz)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDiagnosticOpen(true)}
              className="text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>AC Not Responding? Fix Here</span>
            </button>

            <button
              onClick={handleResetRemote}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 transition"
              title="Reset remote to default 24°C Cool"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* View Layouts */}
        {activeView === 'split' ? (
          /* Desktop / Dual View: Remote on Left, AC on Right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
            <div className="lg:col-span-5 flex justify-center">
              <PhysicalRemote
                state={{ ...acState, activeProtocol }}
                onUpdateState={handleUpdateState}
                onOpenTimerModal={handleOpenTimerModal}
                irTransmitting={irTransmitting}
              />
            </div>
            <div className="lg:col-span-7 flex flex-col justify-start">
              <AcIndoorUnit state={{ ...acState, activeProtocol }} />
            </div>
          </div>
        ) : activeView === 'remote' ? (
          /* Mobile Handheld Remote Focus */
          <div className="flex-1 flex flex-col items-center justify-center py-2">
            <PhysicalRemote
              state={{ ...acState, activeProtocol }}
              onUpdateState={handleUpdateState}
              onOpenTimerModal={handleOpenTimerModal}
              irTransmitting={irTransmitting}
            />
          </div>
        ) : (
          /* Virtual AC Unit Focus */
          <div className="flex-1 flex flex-col items-center justify-start py-2">
            <AcIndoorUnit state={{ ...acState, activeProtocol }} />
          </div>
        )}

      </main>

      {/* Floating Action Banner for Mobile Quick Presets & Diagnostic */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around z-30 shadow-lg">
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
            setDiagnosticOpen(true);
            soundManager.triggerHaptic('light');
          }}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition"
        >
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>Fix AC</span>
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
      <AcDiagnosticModal
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
        acState={{ ...acState, activeProtocol }}
        onSelectProtocol={handleSelectProtocol}
        onTriggerTestPulse={handleTriggerTestPulse}
      />

      <PresetsModal
        isOpen={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        onApplyPreset={handleApplyPreset}
      />

      <IrStudioModal
        state={{ ...acState, activeProtocol }}
        isOpen={irStudioOpen}
        onClose={() => setIrStudioOpen(false)}
      />

      <TimerModal
        state={{ ...acState, activeProtocol }}
        isOpen={timerOpen}
        initialMode={timerType}
        onClose={() => setTimerOpen(false)}
        onSetTimer={handleSetTimer}
      />
    </div>
  );
}
