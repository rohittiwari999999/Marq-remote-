import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, Cpu, Radio, ShieldCheck, 
  HelpCircle, Smartphone, CheckCircle2, ChevronRight,
  Flame, RefreshCw, Zap, Volume2, Info, Copy, Check
} from 'lucide-react';
import { ACState, MarQProtocolType, PROTOCOL_PROFILES, encodeMarQIr } from '../utils/irProtocol';
import { nativeIr, IrDeviceInfo, IrTransmitResult } from '../utils/nativeIr';
import { soundManager } from '../utils/soundAndHaptics';

interface AcDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  acState: ACState;
  onSelectProtocol: (protocol: MarQProtocolType) => void;
  onTriggerTestPulse: (protocol: MarQProtocolType) => void;
}

export const AcDiagnosticModal: React.FC<AcDiagnosticModalProps> = ({
  isOpen,
  onClose,
  acState,
  onSelectProtocol,
  onTriggerTestPulse,
}) => {
  const [deviceInfo, setDeviceInfo] = useState<IrDeviceInfo | null>(null);
  const [testingProtocol, setTestingProtocol] = useState<MarQProtocolType | null>(null);
  const [testResult, setTestResult] = useState<IrTransmitResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'hardware' | 'protocols' | 'solutions'>('hardware');

  useEffect(() => {
    if (isOpen) {
      nativeIr.checkIrHardware().then(setDeviceInfo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentProtocol = acState.activeProtocol || 'aux_upix231';

  const handleTestPulse = async (proto: MarQProtocolType) => {
    setTestingProtocol(proto);
    soundManager.playRemoteClick();
    soundManager.triggerHaptic('heavy');
    
    // Generate test packet
    const packet = encodeMarQIr({
      ...acState,
      power: true,
      activeProtocol: proto,
    });

    const res = await nativeIr.transmit(packet.carrierFrequencyHz, packet.rawTimingsMicroseconds);
    setTestResult(res);
    onTriggerTestPulse(proto);

    setTimeout(() => {
      setTestingProtocol(null);
    }, 1200);
  };

  const handleCopyBroadlink = () => {
    const packet = encodeMarQIr(acState);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(packet.broadlinkHex).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AC Not Responding? Hardware Diagnosis
              </h2>
              <p className="text-xs text-amber-300/80">
                Fixing connection issues between your phone and MarQ 1.5T AC
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('hardware')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'hardware'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            1. Why Phone Doesn't Control AC
          </button>
          <button
            onClick={() => setActiveTab('protocols')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'protocols'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            2. Match AC Protocol
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'solutions'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            3. Working Solutions
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          
          {/* TAB 1: HARDWARE DIAGNOSIS */}
          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-200 space-y-2">
                <div className="font-semibold text-amber-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  The Main Reason: Physical Infrared (IR) Hardware Requirement
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Your physical MarQ AC receiver only responds to <strong>Invisible Infrared (IR) Light Pulses</strong> (940nm light waves emitted at 38,000 flashes per second).
                </p>
                <p className="text-xs leading-relaxed text-slate-300">
                  A mobile phone screen, Bluetooth, Wi-Fi, and regular camera flash <strong>cannot emit infrared light</strong>. The phone MUST have a dedicated tiny black IR glass bead on its top frame.
                </p>
              </div>

              {/* Device Status Card */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">Current Device Environment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">Environment</span>
                    <span className="font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
                      {deviceInfo?.isNativeApp ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Native Android APK (Capacitor)
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Web Browser / PWA Mode
                        </>
                      )}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">IR Blaster Diode</span>
                    <span className="font-mono font-semibold flex items-center gap-1.5 text-slate-200">
                      {deviceInfo?.hasConsumerIr ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Hardware IR Diode Detected
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> No Built-in IR Emitter
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-300 font-medium">Device Brand Check: </span>
                  {deviceInfo?.detectedBrand || 'Scanning...'}
                </div>
              </div>

              {/* Supported Phone Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Which phones have a real IR Blaster?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-slate-300">
                    <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Works with Built-in IR:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      <li><strong className="text-emerald-300">iQOO Neo 10 / Neo 9 / Neo 7 Pro</strong></li>
                      <li>Xiaomi / Redmi Note 8/9/10/11/12/13/14</li>
                      <li>Poco X2/X3/X4/X5/X6/F3/F4/F5/M series</li>
                      <li>Vivo X100/X90/X80 series</li>
                      <li>Mi 10/11/12/13/14 series</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-slate-300">
                    <div className="font-semibold text-red-400 flex items-center gap-1.5 mb-1">
                      <X className="w-3.5 h-3.5" /> NO Built-in IR Hardware:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      <li>OnePlus (Nord, 9, 10, 11, 12 - no IR blaster)</li>
                      <li>Samsung Galaxy (S, A, M, F series)</li>
                      <li>Apple iPhones (All models)</li>
                      <li>Realme, Oppo, Moto, Google Pixel</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Special Guide for iQOO Neo 10 */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/40 text-slate-200 space-y-2.5 shadow-lg">
                <div className="font-bold text-cyan-300 flex items-center gap-2 text-sm">
                  <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                  iQOO Neo 10 User? Aapka AC 100% Chalega!
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Achi khabar:</strong> Aapke <strong>iQOO Neo 10</strong> ke top frame par physical <strong>IR Blaster port</strong> already laga hua hai!
                </p>
                <div className="text-xs bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="font-semibold text-amber-300">Browser me kyu nahi chala?</div>
                  <p className="text-slate-400">
                    Google Chrome browser security ke kaaran phone ke hardware IR diode ko direct trigger nahi kar sakta.
                  </p>
                  <div className="font-semibold text-emerald-400 pt-1">
                    Turant chalane ke 2 Tareeqe:
                  </div>
                  <div className="space-y-1.5 text-slate-300">
                    <div>
                      <strong className="text-white">Option A (Sabse Tez - Bina kisi wait ke):</strong>
                      <div className="text-slate-400 ml-2">
                        1. iQOO Neo 10 me pre-installed <strong>"Smart Remote"</strong> app kholen (Tools folder me).<br />
                        2. <strong>"+" (Add Remote) &gt; AC</strong> select karein.<br />
                        3. Brand me search karein: <strong className="text-cyan-300">AUX</strong> (Kyunki MarQ 1.5T AC ka OEM manufacturer <strong>AUX</strong> hai).<br />
                        4. Power button dabayein — aapka MarQ AC turant "Beep" karke on ho jayega!
                      </div>
                    </div>
                    <div className="pt-1">
                      <strong className="text-white">Option B (Is Custom MarQ Remote APK se):</strong>
                      <div className="text-slate-400 ml-2">
                        GitHub Actions se generated <strong>APK</strong> ko apne iQOO Neo 10 par install karein. APK me humne native <code>ConsumerIrManager</code> enable kar diya hai, jisse ye custom 231M remote aapke phone ke top IR port se signal blast karega!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instant Camera Test */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Instant Camera Test (Check if your phone is sending IR)
                </div>
                <p className="text-xs text-slate-300">
                  Human eyes cannot see 940nm infrared light, but <strong>phone front cameras (selfie cameras)</strong> can!
                </p>
                <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1">
                  <li>Take another smartphone and open its <strong>Front (Selfie) Camera</strong>.</li>
                  <li>Aim the top edge of your remote phone directly into the camera lens.</li>
                  <li>Tap the yellow <strong>START/STOP</strong> button on this app.</li>
                  <li>If your phone has an IR diode, you will see a <strong>bright purple/white flashing light</strong> on the camera screen!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: PROTOCOLS */}
          {activeTab === 'protocols' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300">
                Flipkart manufactured MarQ 1.5T ACs across multiple OEM partners. If your AC does not beep with Profile 1, try Profile 2 or 3 below:
              </div>

              <div className="space-y-2.5">
                {PROTOCOL_PROFILES.map((profile) => {
                  const isSelected = currentProtocol === profile.id;
                  const isTesting = testingProtocol === profile.id;

                  return (
                    <div 
                      key={profile.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30' 
                          : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">{profile.name}</span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300">{profile.description}</p>
                          <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-2">
                            <span>OEM: {profile.oem}</span>
                            <span>•</span>
                            <span>Carrier: 38 kHz</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => onSelectProtocol(profile.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 cursor-default'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Use This'}
                          </button>

                          <button
                            onClick={() => handleTestPulse(profile.id)}
                            disabled={isTesting}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            {isTesting ? 'Blasting...' : 'Test Beep'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {testResult && (
                <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs font-mono text-cyan-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-white">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    Last Transmission Event:
                  </div>
                  <div>Method: {testResult.method}</div>
                  <div>Frequency: {testResult.carrierHz} Hz ({testResult.pulseCount} timing transitions)</div>
                  <div className="text-slate-300">{testResult.message}</div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WORKING SOLUTIONS */}
          {activeTab === 'solutions' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300">
                If your phone does not have a built-in IR blaster (e.g. OnePlus, Samsung, iPhone), choose one of these 3 reliable options:
              </div>

              {/* Solution 1: 3.5mm / Type-C Dongle */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">1</span>
                    Plug-in IR Blaster Dongle (₹99 - ₹199)
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Plug & Play
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  A tiny 3.5mm audio jack or USB-C IR blaster dongle (available on Flipkart / Amazon India under <em>"Smartphone IR Blaster Dongle"</em>).
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900/90 text-xs text-slate-300 border border-slate-800">
                  <strong className="text-cyan-300">How this app supports it:</strong> Turn your phone volume to <strong>100% (Maximum)</strong>. This app transmits differential 38kHz modulated waveforms through the audio output pins to power the infrared LED directly!
                </div>
              </div>

              {/* Solution 2: Wi-Fi Smart IR Hub */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">2</span>
                    Smart Wi-Fi IR Hub (Broadlink / Tuya / Oakter / Smart Life)
                  </div>
                  <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    Voice & Alexa Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  A ₹600 - ₹800 Wi-Fi IR blaster placed in your room. Controls your MarQ AC from anywhere via phone and Google Assistant / Alexa.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopyBroadlink}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1.5 transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copied Broadlink Hex!' : 'Copy MarQ IR Hex Code'}
                  </button>
                  <span className="text-[11px] text-slate-400">Directly imports into Broadlink / Tuya app</span>
                </div>
              </div>

              {/* Solution 3: Universal AC Remote */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">3</span>
                    Replacement Upix 231M or Universal AC Remote
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    100% Guaranteed
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  You can get the exact physical <strong>Upix AC Remote No. 231M</strong> on Amazon/Flipkart for ₹200. Or use a 1000-in-1 Universal AC remote with code <strong>0231</strong>, <strong>0180</strong>, or <strong>0043</strong> (AUX/MarQ).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Selected Protocol: <strong className="text-white">{currentProtocol.replace('_', ' ').toUpperCase()}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
