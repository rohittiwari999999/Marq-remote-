import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundManager } from '../utils/soundAndHaptics';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // If already installed or dismissed, hide
  if (isInstalled || dismissed) return null;

  const handleInstallClick = async () => {
    soundManager.playRemoteClick();
    soundManager.triggerHaptic('medium');
    const success = await install();
    if (!success && !isInstallable) {
      setShowGuide(true);
    }
  };

  return (
    <>
      <div className="w-full bg-gradient-to-r from-blue-900/90 via-slate-900 to-indigo-900/90 border-b border-blue-500/30 px-3 py-2 text-xs text-white flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-blue-300" />
          </div>
          <div className="truncate">
            <span className="font-bold text-white">Install MarQ AC Remote App</span>
            <span className="hidden sm:inline text-blue-200 ml-1.5">
              · Instant home screen launch with offline support
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white transition"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide modal if browser didn't automatically trigger prompt */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-400" />
              <span>Install to Android Phone</span>
            </h3>
            
            <div className="mt-3 text-xs text-slate-300 space-y-2">
              <p>To add this MarQ remote to your Android home screen:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                <li>Tap the browser menu (<strong>⋮ 3 dots</strong> in top right of Chrome).</li>
                <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                <li>Tap <strong>Install</strong> to enjoy a full native fullscreen remote app!</li>
              </ol>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-white transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
