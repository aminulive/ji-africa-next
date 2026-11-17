"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Share } from "lucide-react";

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const dismissedAt = Number(localStorage.getItem("ji_pwa_dismissed") || 0);
    if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) return;

    const iosDevice = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    if (iosDevice) {
      setIsIos(true);
      setShowBanner(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsIos(false);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowBanner(false);
      setDeferredPrompt(null);
      return;
    }

    if (isIos) {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: "ji.africa",
            text: "Install ji.africa — scroll down and tap 'Add to Home Screen'",
            url: "https://www.ji.africa",
          });
          return;
        } catch {}
      }
      setIosHint(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("ji_pwa_dismissed", String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-gray-900 text-white rounded-2xl p-3.5 shadow-2xl border border-gray-700">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center font-black text-lg shrink-0">
            ji
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-orange-400" /> Install ji.africa App
            </p>
            <p className="text-[11px] text-gray-300 truncate">
              {isIos
                ? "Tap here → choose 'Add to Home Screen'"
                : "Faster browsing & 1-tap WhatsApp flyers"}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-brand-orange hover:bg-orange-700 text-white rounded-lg text-xs font-black flex items-center gap-1 transition cursor-pointer"
          >
            {isIos ? <Share className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="p-1.5 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {iosHint && (
        <p className="mt-2 pt-2 border-t border-gray-800 text-[11px] text-orange-200 leading-snug">
          Tap the <strong>Share icon (↑)</strong> at the top-left of your browser bar, scroll down, and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
        </p>
      )}
    </div>
  );
}
