import React, { useState } from 'react';
import { X, Clock, Check, Trash2 } from 'lucide-react';
import { ACState } from '../utils/irProtocol';
import { soundManager } from '../utils/soundAndHaptics';

interface TimerModalProps {
  state: ACState;
  isOpen: boolean;
  initialMode?: 'on' | 'off';
  onClose: () => void;
  onSetTimer: (timerHours: number | null, isTimerOff: boolean) => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({
  state,
  isOpen,
  initialMode = 'off',
  onClose,
  onSetTimer,
}) => {
  const [selectedHours, setSelectedHours] = useState<number>(state.timerOff || 2);
  const [isOffTimer, setIsOffTimer] = useState<boolean>(initialMode === 'off');

  if (!isOpen) return null;

  const quickHours = [0.5, 1.0, 2.0, 4.0, 6.0, 8.0, 12.0];

  const handleApply = () => {
    soundManager.playRemoteClick();
    soundManager.playAcBeep();
    soundManager.triggerHaptic('medium');
    onSetTimer(selectedHours, isOffTimer);
    onClose();
  };

  const handleClear = () => {
    soundManager.playRemoteClick();
    soundManager.playAcBeep();
    soundManager.triggerHaptic('light');
    onSetTimer(null, isOffTimer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Schedule Timer</h3>
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

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Timer Type Toggle: Turn OFF vs Turn ON */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => {
                setIsOffTimer(true);
                soundManager.triggerHaptic('light');
              }}
              className={`py-2 rounded-lg transition ${
                isOffTimer ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Turn OFF After
            </button>
            <button
              onClick={() => {
                setIsOffTimer(false);
                soundManager.triggerHaptic('light');
              }}
              className={`py-2 rounded-lg transition ${
                !isOffTimer ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Turn ON In
            </button>
          </div>

          {/* Time Display */}
          <div className="text-center py-2">
            <div className="text-4xl font-black font-lcd text-sky-400 tabular-nums">
              {selectedHours} <span className="text-xl font-normal text-slate-400">hours</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              AC will automatically {isOffTimer ? 'turn off' : 'power on'} in {selectedHours} hrs
            </p>
          </div>

          {/* Slider */}
          <div className="px-2">
            <input
              type="range"
              min="0.5"
              max="24"
              step="0.5"
              value={selectedHours}
              onChange={(e) => setSelectedHours(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0.5h</span>
              <span>6h</span>
              <span>12h</span>
              <span>18h</span>
              <span>24h</span>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Quick Select
            </div>
            <div className="grid grid-cols-4 gap-2">
              {quickHours.map((h) => (
                <button
                  key={h}
                  onClick={() => {
                    setSelectedHours(h);
                    soundManager.triggerHaptic('light');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    selectedHours === h
                      ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-medium transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cancel Timer</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-sky-900/30"
            >
              <Check className="w-4 h-4" />
              <span>Set Timer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
