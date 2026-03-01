import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QRScanner({ onScan, onClose }) {
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);
  const containerId = "qr-scanner-container";

  const startScanner = async (mode) => {
    try {
      hasScannedRef.current = false;

      const html5Qrcode = new Html5Qrcode(containerId);
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: mode },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

          try {
            await html5Qrcode.stop();
            await html5Qrcode.clear();
          } catch {}

          onScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error(err);
      setError("Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen.");
    }
  };

  useEffect(() => {
    startScanner(facingMode);

    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [facingMode]);

  const switchCamera = async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch {}
    }
    setFacingMode((prev) =>
      prev === "environment" ? "user" : "environment"
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">QR-Code scannen</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              title="Kamera wechseln"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          {error ? (
            <div className="text-center py-8 text-red-500 text-sm">
              {error}
            </div>
          ) : (
            <div
              id={containerId}
              className="w-full rounded-xl overflow-hidden"
            />
          )}
          <p className="text-xs text-slate-400 text-center mt-3">
            {facingMode === "environment"
              ? "Rückkamera aktiv"
              : "Frontkamera aktiv"}
          </p>
        </div>
      </div>
    </div>
  );
}