import React, { useEffect, useState } from 'react';
import { 
  Zap, Thermometer, Droplets, Wind, Power, 
  RotateCw, ShieldCheck, Activity, Gauge, Camera, Image as ImageIcon, X
} from 'lucide-react';
import { ACState } from '../utils/irProtocol';

interface AcIndoorUnitProps {
  state: ACState;
}

export const AcIndoorUnit: React.FC<AcIndoorUnitProps> = ({ state }) => {
  // Real Wall AC photo toggle
  const [showRealPhoto, setShowRealPhoto] = useState<boolean>(false);

  // Room physics simulation
  const [roomTemp, setRoomTemp] = useState<number>(31.5);
  const [roomHumidity, setRoomHumidity] = useState<number>(68);
  const [compressorOn, setCompressorOn] = useState<boolean>(false);
  const [watts, setWatts] = useState<number>(4);
  const [energyKWh, setEnergyKWh] = useState<number>(0.042);
  const [louverAngle, setLouverAngle] = useState<number>(0);

  // Compressor & Louver physics loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.power) {
        // Standby state
        setCompressorOn(false);
        setWatts(4); // 4 Watts standby
        setLouverAngle(0); // closed
        
        // Room slowly warms up to ambient 32°C
        setRoomTemp((prev) => Math.min(32.5, +(prev + 0.04).toFixed(2)));
        setRoomHumidity((prev) => Math.min(72, +(prev + 0.08).toFixed(1)));
        return;
      }

      // Louver positioning
      if (state.swingV) {
        // Louver oscillates between 20° and 75°
        setLouverAngle((prev) => {
          const time = Date.now() / 800;
          return 45 + Math.sin(time) * 30;
        });
      } else {
        setLouverAngle(45); // Standard cooling discharge angle
      }

      // Fixed speed compressor logic:
      // Fixed speed 1.5 Ton compressor is strictly ON (100% capacity ~1,450 Watts) or OFF (thermostat cut)
      if (state.mode === 'fan') {
        setCompressorOn(false);
        const fanWatts = state.fanSpeed === 'high' ? 58 : state.fanSpeed === 'med' ? 44 : 32;
        setWatts(fanWatts);
        setRoomTemp((prev) => +(prev + 0.01).toFixed(2));
      } else if (state.mode === 'cool' || state.mode === 'auto' || state.mode === 'dry') {
        const target = state.temp;
        
        if (roomTemp > target) {
          // Compressor running at full 1.5 Ton fixed speed capacity
          setCompressorOn(true);
          const baseWatts = state.turbo ? 1620 : 1460;
          setWatts(baseWatts);

          // Cool room down
          const coolingRate = state.turbo ? 0.12 : state.fanSpeed === 'high' ? 0.08 : 0.05;
          setRoomTemp((prev) => Math.max(target, +(prev - coolingRate).toFixed(2)));

          // Dehumidify
          const humidityDrop = state.mode === 'dry' ? 0.25 : 0.08;
          setRoomHumidity((prev) => Math.max(42, +(prev - humidityDrop).toFixed(1)));

          // Accumulate energy
          setEnergyKWh((prev) => +(prev + (baseWatts / 3600000) * 2).toFixed(4));
        } else {
          // Thermostat cut-off: Room reached target temp! Fixed speed compressor shuts off
          setCompressorOn(false);
          setWatts(42); // Only indoor blower fan running
          setRoomTemp((prev) => +(prev + 0.02).toFixed(2));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, roomTemp]);

  const displayTemp = state.tempUnit === 'F' ? Math.round((state.temp * 9) / 5 + 32) : state.temp;
  const displayRoomTemp = state.tempUnit === 'F' ? Math.round((roomTemp * 9) / 5 + 32) : roomTemp.toFixed(1);

  // Indian Rupee estimate at ₹7.50 per kWh
  const estimatedCost = (energyKWh * 7.50).toFixed(2);

  return (
    <div className="w-full flex flex-col items-center gap-6 p-2 sm:p-4">
      {/* ---------------- WALL-MOUNTED MARQ SPLIT AC INDOOR UNIT ---------------- */}
      <div className="w-full max-w-xl bg-slate-900/90 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Wall Background Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

        <div className="flex items-center justify-between mb-4 z-10 relative">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Indoor Wall Unit
            </span>
            <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800/40">
              1.5 Ton Fixed Speed
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowRealPhoto(!showRealPhoto)}
              className="text-[11px] font-semibold text-cyan-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showRealPhoto ? 'Hide Photo' : 'Real AC Photo'}</span>
            </button>
            <span className={`w-2 h-2 rounded-full ${state.power ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="font-medium text-slate-400 hidden sm:inline">
              {state.power ? (compressorOn ? 'Compressor Active (100% Load)' : 'Thermostat Idle') : 'Standby'}
            </span>
          </div>
        </div>

        {/* Real AC Photo View */}
        {showRealPhoto && (
          <div className="mb-4 bg-slate-950 border border-cyan-500/40 rounded-2xl p-2.5 shadow-xl animate-fade-in relative z-20">
            <div className="flex items-center justify-between text-xs text-cyan-300 font-bold px-1 mb-1.5">
              <span>Your MarQ 1.5 Ton Split AC Indoor Unit</span>
              <button
                onClick={() => setShowRealPhoto(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black flex justify-center max-h-64">
              <img
                src="/public/assets/aistudio/IMG_20261022_190956_8fa59da9.jpg"
                alt="MarQ Split AC on Wall"
                className="object-contain max-h-64 rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-[11px] text-slate-400 text-center mt-1.5">
              Notice the receiver window behind the white plastic panel on the right. Point your phone directly at this area.
            </div>
          </div>
        )}

        {/* 3D Chassis of Split AC */}
        <div className="w-full bg-gradient-to-b from-white via-slate-50 to-slate-200 rounded-2xl shadow-xl border border-slate-300 p-4 pt-5 pb-7 relative flex flex-col justify-between">
          
          {/* Top Air Intake Grill */}
          <div className="w-full h-3 flex items-center justify-center gap-1.5 opacity-30 mb-3">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="h-full w-1 bg-slate-500 rounded-full" />
            ))}
          </div>

          {/* Center Section: MarQ Branding & Hidden LED Glow Display */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-2 relative">
            {/* Left MarQ Logo */}
            <div className="flex flex-col">
              <span className="text-slate-700 font-black text-lg tracking-[0.2em] leading-tight">
                MARQ
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                BY FLIPKART
              </span>
            </div>

            {/* Hidden LED Digital Display (Shining through the plastic fascia) */}
            <div className="w-20 h-14 bg-slate-100/40 rounded-xl flex items-center justify-center relative overflow-hidden border border-slate-200/60 shadow-inner">
              {state.power && state.displayLight ? (
                <div className="flex items-baseline text-sky-500 font-digital font-black ac-hidden-led tracking-tight">
                  <span className="text-4xl leading-none">
                    {state.cleanHealth ? 'CL' : state.turbo ? 'Po' : displayTemp}
                  </span>
                  {!state.cleanHealth && !state.turbo && (
                    <span className="text-sm font-lcd font-bold ml-0.5">
                      °{state.tempUnit}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-slate-300 font-mono">
                  {state.power ? 'LED OFF' : ''}
                </div>
              )}
            </div>

            {/* Right Status Indicator LED cluster */}
            <div className="flex flex-col gap-1 items-end text-[9px] font-bold text-slate-500 font-mono">
              <div className="flex items-center gap-1.5">
                <span>PWR</span>
                <span className={`w-2 h-2 rounded-full ${state.power ? 'bg-red-500 shadow-sm shadow-red-500' : 'bg-red-950'}`} />
              </div>
              <div className="flex items-center gap-1.5">
                <span>RUN</span>
                <span className={`w-2 h-2 rounded-full ${state.power && compressorOn ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-emerald-950'}`} />
              </div>
              <div className="flex items-center gap-1.5">
                <span>ECO</span>
                <span className={`w-2 h-2 rounded-full ${state.power && state.eco ? 'bg-teal-400 shadow-sm shadow-teal-400' : 'bg-teal-950'}`} />
              </div>
              <div className="flex items-center gap-1.5">
                <span>TIMER</span>
                <span className={`w-2 h-2 rounded-full ${state.timerOff || state.timerOn ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-amber-950'}`} />
              </div>
            </div>
          </div>

          {/* Motorized Bottom Air Discharge Louver (Vane) */}
          <div className="w-full mt-3 relative">
            <div className="w-full h-5 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 rounded-lg shadow-inner overflow-hidden flex items-center justify-center border border-slate-300">
              {/* Louver flap with real dynamic angle transform */}
              <div 
                className="w-[98%] h-2.5 bg-gradient-to-b from-slate-400 to-slate-200 rounded-md shadow-md transition-transform duration-500 ease-out flex items-center justify-center"
                style={{
                  transform: `rotateX(${state.power ? louverAngle : 0}deg) translateY(${state.power ? 2 : 0}px)`,
                }}
              >
                <div className="w-1/3 h-0.5 bg-slate-400/60 rounded-full" />
              </div>
            </div>

            {/* Cold air breeze flow particles when running */}
            {state.power && (
              <div className="absolute top-5 inset-x-4 h-12 pointer-events-none flex justify-around overflow-hidden">
                <div className={`w-1 h-8 rounded-full bg-gradient-to-b from-sky-400/60 to-transparent animate-pulse duration-700`} />
                <div className={`w-1.5 h-10 rounded-full bg-gradient-to-b from-teal-300/70 to-transparent animate-bounce duration-1000 delay-100`} />
                <div className={`w-1 h-7 rounded-full bg-gradient-to-b from-sky-300/50 to-transparent animate-pulse duration-500 delay-200`} />
                <div className={`w-2 h-11 rounded-full bg-gradient-to-b from-blue-300/60 to-transparent animate-bounce duration-900 delay-300`} />
                <div className={`w-1 h-9 rounded-full bg-gradient-to-b from-teal-400/60 to-transparent animate-pulse duration-800`} />
              </div>
            )}
          </div>
        </div>

        {/* ---------------- LIVE ROOM TELEMETRY & FIXED SPEED SPECS ---------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-slate-200">
          
          {/* Room Temp Card */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Room Temp</span>
              <Thermometer className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 font-bold text-2xl font-lcd tabular-nums text-white">
              {displayRoomTemp}°{state.tempUnit}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Target: <span className="font-semibold text-sky-400">{displayTemp}°{state.tempUnit}</span>
            </div>
          </div>

          {/* Humidity Card */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Humidity</span>
              <Droplets className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 font-bold text-2xl font-lcd tabular-nums text-white">
              {roomHumidity}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Comfort: 40% - 60%
            </div>
          </div>

          {/* Power Draw Card (Fixed Speed 1.5T Compressor) */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Power</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="mt-2 font-bold text-2xl font-lcd tabular-nums text-white">
              {watts} <span className="text-xs font-normal text-slate-400">Watts</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {compressorOn ? 'Fixed Speed 1.5T' : 'Blower Idle'}
            </div>
          </div>

          {/* Electricity Consumption */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Cost Est.</span>
              <Gauge className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 font-bold text-2xl font-lcd tabular-nums text-white">
              ₹{estimatedCost}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {energyKWh} kWh units
            </div>
          </div>
        </div>

        {/* Technical Explainer for Fixed Speed 1.5 Ton AC */}
        <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">Fixed-Speed 1.5 Ton Architecture: </span>
            The rotary compressor operates at full 100% capacity (1,460W) to rapidly cool your room down to the set temperature. Once reached, the compressor cycles off to maintain efficiency while the blower fan circulates filtered air.
          </div>
        </div>
      </div>
    </div>
  );
};
