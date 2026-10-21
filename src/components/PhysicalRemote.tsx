import React, { useState, useEffect } from 'react';
import { 
  ChevronUp, ChevronDown, Image as ImageIcon, 
  Eye, EyeOff, Radio, Clock, Sparkles 
} from 'lucide-react';
import { ACState } from '../utils/irProtocol';
import { soundManager } from '../utils/soundAndHaptics';

interface PhysicalRemoteProps {
  state: ACState;
  onUpdateState: (updater: (prev: ACState) => ACState, actionName: string) => void;
  onOpenTimerModal: (type?: 'on' | 'off') => void;
  irTransmitting: boolean;
}

export const PhysicalRemote: React.FC<PhysicalRemoteProps> = ({
  state,
  onUpdateState,
  onOpenTimerModal,
  irTransmitting,
}) => {
  const [showOriginalRef, setShowOriginalRef] = useState<boolean>(false);
  const [clockString, setClockString] = useState<string>('12:00');
  const [clockAmPm, setClockAmPm] = useState<'AM' | 'PM'>('PM');
  const [lastAction, setLastAction] = useState<string>('');

  // Keep a realistic live clock on the LCD
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 hour is 12
      const mins = now.getMinutes().toString().padStart(2, '0');
      setClockString(`${hours}:${mins}`);
      setClockAmPm(ampm);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const executeAction = (actionName: string, updater: (prev: ACState) => ACState, playAcBeep = true) => {
    soundManager.playRemoteClick();
    if (playAcBeep) {
      soundManager.playAcBeep();
    }
    soundManager.triggerHaptic('medium');
    setLastAction(actionName);
    onUpdateState(updater, actionName);
  };

  // Button Action Handlers matching Upix 231M / MarQ AC Remote
  const handleStartStop = () => {
    executeAction(state.power ? 'AC POWER OFF' : 'AC POWER ON', (prev) => ({
      ...prev,
      power: !prev.power,
      turbo: false,
    }));
  };

  const handleMode = () => {
    if (!state.power) {
      handleStartStop();
      return;
    }
    const modes: ACState['mode'][] = ['auto', 'cool', 'dry', 'fan', 'heat'];
    executeAction('CYCLE MODE', (prev) => {
      const idx = modes.indexOf(prev.mode);
      const nextMode = modes[(idx + 1) % modes.length];
      return { ...prev, mode: nextMode, turbo: false };
    });
  };

  const handleFan = () => {
    if (!state.power) return;
    const speeds: ACState['fanSpeed'][] = ['auto', 'low', 'med', 'high'];
    executeAction('FAN SPEED', (prev) => {
      const idx = speeds.indexOf(prev.fanSpeed);
      const nextSpeed = speeds[(idx + 1) % speeds.length];
      return { ...prev, fanSpeed: nextSpeed, turbo: false };
    });
  };

  const handleSwing = () => {
    if (!state.power) return;
    executeAction('SWING LOUVER', (prev) => ({
      ...prev,
      swingV: !prev.swingV,
    }));
  };

  const handleTurboCool = () => {
    if (!state.power) return;
    executeAction('TURBO COOL 16°C', (prev) => {
      const nextTurbo = !prev.turbo;
      return {
        ...prev,
        turbo: nextTurbo,
        mode: nextTurbo ? 'cool' : prev.mode,
        temp: nextTurbo ? 16 : prev.temp,
        fanSpeed: nextTurbo ? 'high' : prev.fanSpeed,
        eco: false,
        sleep: false,
      };
    });
  };

  const handleESaver = () => {
    if (!state.power) return;
    executeAction('E.SAVER (ECO)', (prev) => {
      const nextEco = !prev.eco;
      return {
        ...prev,
        eco: nextEco,
        temp: nextEco ? Math.max(24, prev.temp) : prev.temp,
        turbo: false,
      };
    });
  };

  const handleSleep = () => {
    if (!state.power) return;
    executeAction('SLEEP COMFORT', (prev) => ({
      ...prev,
      sleep: !prev.sleep,
      turbo: false,
      fanSpeed: !prev.sleep ? 'low' : prev.fanSpeed,
    }));
  };

  const handleTempUp = () => {
    if (!state.power) {
      handleStartStop();
      return;
    }
    executeAction('TEMP UP ▲', (prev) => {
      const nextTemp = Math.min(31, prev.temp + 1);
      return { ...prev, temp: nextTemp, turbo: false };
    });
  };

  const handleTempDown = () => {
    if (!state.power) {
      handleStartStop();
      return;
    }
    executeAction('TEMP DOWN ▼', (prev) => {
      const nextTemp = Math.max(16, prev.temp - 1);
      return { ...prev, temp: nextTemp, turbo: false };
    });
  };

  const handleDisplay = () => {
    executeAction('DISPLAY TOGGLE', (prev) => ({
      ...prev,
      displayLight: !prev.displayLight,
    }));
  };

  const handleClock = () => {
    soundManager.playRemoteClick();
    soundManager.triggerHaptic('light');
    setLastAction('CLOCK SYNC');
  };

  const handleCancel = () => {
    executeAction('CANCEL / RESET TIMERS', (prev) => ({
      ...prev,
      timerOff: null,
      timerOn: null,
      turbo: false,
      cleanHealth: false,
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center p-1 sm:p-2 select-none relative">
      
      {/* Reference Toggle Header */}
      <div className="mb-2 flex items-center justify-between w-full max-w-[320px] px-2 text-xs">
        <span className="text-[11px] font-bold text-slate-400">
          Model: Upix No. 231M / MarQ
        </span>
        <button
          onClick={() => setShowOriginalRef(!showOriginalRef)}
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 transition ${
            showOriginalRef
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
          }`}
        >
          <ImageIcon className="w-3 h-3" />
          <span>{showOriginalRef ? 'Hide Photo' : 'Compare Real Remote'}</span>
        </button>
      </div>

      {/* Side-by-side or popup reference photo if enabled */}
      {showOriginalRef && (
        <div className="mb-3 w-full max-w-[320px] bg-slate-900 border border-amber-500/50 rounded-2xl p-2 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold px-1 mb-1">
            <span>Uploaded Original Remote Photo</span>
            <button
              onClick={() => setShowOriginalRef(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="rounded-xl overflow-hidden bg-black flex justify-center max-h-56">
            <img
              src="/public/assets/aistudio/Screenshot_20261021_152701_f4a1d33a.jpg"
              alt="Original MarQ Upix 231M Remote"
              className="object-contain max-h-56"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-[10px] text-slate-400 text-center mt-1">
            Exact match: Yellow START/STOP, SET TEMP rocker, E.SAVER, CLOCK, CANCEL
          </div>
        </div>
      )}

      {/* ================= EXACT REPLICA: UPIX NO. 231M MARQ REMOTE ================= */}
      <div className="w-[305px] sm:w-[325px] upix-remote-body rounded-t-[34px] rounded-b-[48px] p-3.5 pt-3 pb-8 relative flex flex-col items-center border border-slate-300">
        
        {/* Top IR Emitter Transmitter Window */}
        <div className="w-full flex items-center justify-center mb-2 relative">
          <div 
            className={`w-6 h-2 rounded-full bg-slate-800 border border-slate-400/80 transition-all duration-200 relative ${
              irTransmitting ? 'ir-blaster-active bg-fuchsia-500 border-fuchsia-300' : ''
            }`}
          >
            {irTransmitting && (
              <div className="absolute -inset-1 rounded-full bg-fuchsia-400/50 animate-ping" />
            )}
          </div>
        </div>

        {/* ---------------- AUTHENTIC 231M MONOCHROME LCD SCREEN ---------------- */}
        <div className="w-full h-[174px] rounded-xl p-2.5 upix-lcd-screen relative flex flex-col justify-between overflow-hidden shadow-inner">
          
          {/* Subtle liquid crystal grid overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:6px_6px]" />

          {/* Top Row: Mode selection indicators */}
          <div className="flex items-center justify-between text-[10px] font-lcd font-extrabold lcd-ink border-b border-black/20 pb-0.5 z-10 px-0.5">
            <div className="flex flex-col items-center">
              <span className={`transition-opacity ${state.mode === 'auto' ? 'opacity-100 font-black' : 'opacity-25'}`}>AUTO</span>
              {state.mode === 'auto' && <span className="text-[8px] leading-none">▼</span>}
            </div>
            <div className="flex flex-col items-center">
              <span className={`transition-opacity ${state.mode === 'cool' ? 'opacity-100 font-black' : 'opacity-25'}`}>COOL</span>
              {state.mode === 'cool' && <span className="text-[8px] leading-none">▼</span>}
            </div>
            <div className="flex flex-col items-center">
              <span className={`transition-opacity ${state.mode === 'dry' ? 'opacity-100 font-black' : 'opacity-25'}`}>DRY</span>
              {state.mode === 'dry' && <span className="text-[8px] leading-none">▼</span>}
            </div>
            <div className="flex flex-col items-center">
              <span className={`transition-opacity ${state.mode === 'fan' ? 'opacity-100 font-black' : 'opacity-25'}`}>FAN</span>
              {state.mode === 'fan' && <span className="text-[8px] leading-none">▼</span>}
            </div>
            <div className="flex flex-col items-center">
              <span className={`transition-opacity ${state.mode === 'heat' ? 'opacity-100 font-black' : 'opacity-25'}`}>HEAT</span>
              {state.mode === 'heat' && <span className="text-[8px] leading-none">▼</span>}
            </div>
          </div>

          {/* Middle Row: Temperature Digits & Fan Speed Vertical Meter */}
          <div className="flex items-center justify-between my-auto px-1 z-10">
            {/* Left: Swing Vane indicator */}
            <div className="flex flex-col items-start w-10">
              <span className={`text-[9px] font-lcd font-bold lcd-ink transition-opacity ${state.swingV ? 'opacity-100' : 'opacity-20'}`}>
                SWING
              </span>
              <div className={`mt-0.5 text-xs font-mono lcd-ink transition-opacity ${state.swingV ? 'opacity-100 animate-pulse' : 'opacity-20'}`}>
                ⫽⫽⫽
              </div>
            </div>

            {/* Center: Big 7-Segment Temperature Value */}
            <div className="flex items-baseline justify-center flex-1">
              {state.power ? (
                <>
                  <div className="font-digital text-[72px] leading-none font-black lcd-ink tracking-tight select-none">
                    {state.temp}
                  </div>
                  <span className="font-lcd text-2xl font-black lcd-ink ml-1 -mt-5">
                    °C
                  </span>
                </>
              ) : (
                <div className="font-lcd text-3xl font-black lcd-ink/30 tracking-widest py-4">
                  --
                </div>
              )}
            </div>

            {/* Right: Fan Speed Vertical Bar Ladder */}
            <div className="flex flex-col items-end w-10">
              <span className="text-[8px] font-lcd font-bold lcd-ink mb-1">
                FAN
              </span>
              <div className="flex flex-col-reverse gap-0.5 h-10 w-3 bg-black/10 p-0.5 rounded-xs border border-black/20">
                <div 
                  className={`w-full rounded-xs transition-colors ${
                    state.fanSpeed === 'auto' || state.fanSpeed === 'low' || state.fanSpeed === 'med' || state.fanSpeed === 'high' || state.turbo
                      ? 'bg-slate-900 h-2'
                      : 'bg-black/15 h-2'
                  }`} 
                />
                <div 
                  className={`w-full rounded-xs transition-colors ${
                    state.fanSpeed === 'med' || state.fanSpeed === 'high' || state.turbo
                      ? 'bg-slate-900 h-2'
                      : 'bg-black/15 h-2'
                  }`} 
                />
                <div 
                  className={`w-full rounded-xs transition-colors ${
                    state.fanSpeed === 'high' || state.turbo
                      ? 'bg-slate-900 h-2.5'
                      : 'bg-black/15 h-2.5'
                  }`} 
                />
              </div>
              <span className="text-[8px] font-lcd font-extrabold lcd-ink uppercase mt-0.5">
                {state.turbo ? 'TURBO' : state.fanSpeed}
              </span>
            </div>
          </div>

          {/* Bottom Row: CLOCK / TIMER Box */}
          <div className="border-t border-black/20 pt-1 flex items-center justify-between text-xs font-lcd z-10 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold lcd-ink uppercase px-1 border border-black/30 rounded-xs">
                CLOCK
              </span>
              <span className="text-[10px] font-bold lcd-ink">
                {clockAmPm}
              </span>
              <span className="font-digital text-xl font-bold lcd-ink tracking-widest leading-none">
                {clockString}
              </span>
            </div>

            {/* Active Mode Tag */}
            <div className="flex items-center gap-1 text-[9px] font-bold lcd-ink">
              {state.eco && <span className="bg-black/20 px-1 rounded-xs">E.SAVER</span>}
              {state.sleep && <span className="bg-black/20 px-1 rounded-xs">SLEEP</span>}
              {state.turbo && <span className="bg-black/20 px-1 rounded-xs">TURBO</span>}
              {state.timerOff && <span className="bg-black/20 px-1 rounded-xs">OFF {state.timerOff}h</span>}
              {state.timerOn && <span className="bg-black/20 px-1 rounded-xs">ON {state.timerOn}h</span>}
            </div>
          </div>
        </div>

        {/* Feedback ticker */}
        <div className="w-full text-center mt-1.5 h-4 text-[11px] font-bold text-slate-600 truncate px-2">
          {irTransmitting ? 'Transmitting 38kHz IR...' : lastAction || 'Upix 231M Ready'}
        </div>

        {/* ---------------- EXACT BUTTON GRID (FROM PHOTO) ---------------- */}
        <div className="w-full mt-2.5 space-y-2.5">
          
          {/* ROW 1: MODE | START/STOP | FAN */}
          <div className="grid grid-cols-3 gap-2.5 items-end">
            {/* MODE */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-slate-800 tracking-wider mb-1">
                MODE
              </span>
              <button
                onClick={handleMode}
                className="w-full h-11 rounded-lg button-rubber-grey"
              />
            </div>

            {/* START / STOP (Yellow Button) */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleStartStop}
                className="w-full h-14 rounded-lg button-start-stop flex flex-col items-center justify-center text-slate-950 font-black leading-tight shadow-md"
              >
                <span className="text-[11px] tracking-wider">START</span>
                <span className="text-[11px] tracking-wider">STOP</span>
              </button>
            </div>

            {/* FAN */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-slate-800 tracking-wider mb-1">
                FAN
              </span>
              <button
                onClick={handleFan}
                className="w-full h-11 rounded-lg button-rubber-grey"
              />
            </div>
          </div>

          {/* ROW 2 & 3 & 4: (SWING, E.SAVER, TIMER ON) | [TALL CENTRAL SET TEMP ROCKER] | (TURBO COOL, SLEEP, TIMER OFF) */}
          <div className="grid grid-cols-3 gap-2.5">
            
            {/* LEFT COLUMN: SWING, E.SAVER, TIMER ON */}
            <div className="flex flex-col justify-between gap-2.5">
              {/* SWING */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-extrabold text-slate-800 tracking-wider mb-1">
                  SWING
                </span>
                <button
                  onClick={handleSwing}
                  className="w-full h-9 rounded-lg button-rubber-grey"
                />
              </div>

              {/* E.SAVER */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-extrabold text-slate-800 tracking-wider mb-1">
                  E.SAVER
                </span>
                <button
                  onClick={handleESaver}
                  className="w-full h-9 rounded-lg button-rubber-grey"
                />
              </div>

              {/* TIMER ON */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-extrabold text-slate-800 tracking-wider mb-1">
                  TIMER ON
                </span>
                <button
                  onClick={() => onOpenTimerModal('on')}
                  className="w-full h-9 rounded-lg button-rubber-grey"
                />
              </div>
            </div>

            {/* CENTER COLUMN: TALL SET TEMP ROCKER PANEL */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-full h-full button-set-temp-panel rounded-xl p-1.5 flex flex-col items-center justify-between shadow-inner">
                {/* ▲ UP ARROW */}
                <button
                  onClick={handleTempUp}
                  title="Temperature Up"
                  className="w-full h-12 rounded-lg bg-slate-100 hover:bg-white active:scale-95 shadow-sm border border-slate-300 flex items-center justify-center transition"
                >
                  <ChevronUp className="w-6 h-6 text-slate-800 stroke-[3.5]" />
                </button>

                {/* MIDDLE LABEL: SET TEMP. */}
                <div className="my-2 flex flex-col items-center leading-none">
                  <span className="text-[11px] font-black text-slate-800 tracking-wider">
                    SET
                  </span>
                  <span className="text-[11px] font-black text-slate-800 tracking-wider">
                    TEMP.
                  </span>
                </div>

                {/* ▼ DOWN ARROW */}
                <button
                  onClick={handleTempDown}
                  title="Temperature Down"
                  className="w-full h-12 rounded-lg bg-slate-100 hover:bg-white active:scale-95 shadow-sm border border-slate-300 flex items-center justify-center transition"
                >
                  <ChevronDown className="w-6 h-6 text-slate-800 stroke-[3.5]" />
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: TURBO COOL, SLEEP, TIMER OFF */}
            <div className="flex flex-col justify-between gap-2.5">
              {/* TURBO COOL */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-extrabold text-slate-800 tracking-tight mb-1 text-center leading-tight">
                  TURBO<br />COOL
                </span>
                <button
                  onClick={handleTurboCool}
                  className="w-full h-9 rounded-lg button-rubber-grey"
                />
              </div>

              {/* SLEEP */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-extrabold text-slate-800 tracking-wider mb-1">
                  SLEEP
                </span>
                <button
                  onClick={handleSleep}
                  className="w-full h-9 rounded-lg button-rubber-grey"
                />
              </div>

              {/* TIMER OFF */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-extrabold text-slate-800 tracking-wider mb-1">
                  TIMER OFF
                </span>
                <button
                  onClick={() => onOpenTimerModal('off')}
                  className="w-full h-9 rounded-lg button-rubber-grey"
                />
              </div>
            </div>
          </div>

          {/* ROW 5: DISPLAY | CLOCK | CANCEL */}
          <div className="grid grid-cols-3 gap-2.5 items-start pt-1">
            {/* DISPLAY (Label below) */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleDisplay}
                className="w-full h-9 rounded-lg button-rubber-grey"
              />
              <span className="text-[9px] font-extrabold text-slate-800 tracking-wider mt-1">
                DISPLAY
              </span>
            </div>

            {/* CLOCK (Label above) */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-extrabold text-slate-800 tracking-wider mb-1">
                CLOCK
              </span>
              <button
                onClick={handleClock}
                className="w-full h-7 rounded-lg button-rubber-grey"
              />
            </div>

            {/* CANCEL (Label below) */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleCancel}
                className="w-full h-9 rounded-lg button-rubber-grey"
              />
              <span className="text-[9px] font-extrabold text-slate-800 tracking-wider mt-1">
                CANCEL
              </span>
            </div>
          </div>
        </div>

        {/* Lower body smooth tapered grip */}
        <div className="w-full mt-6 h-6 flex justify-center items-center">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>
      </div>
    </div>
  );
};
