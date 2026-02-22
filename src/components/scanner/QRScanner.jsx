import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QRScanner({ onScan, onClose }) {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const containerId = "qr-scanner-container";

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode(containerId);
    scannerRef.current = html5Qrcode;

    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          html5Qrcode.stop().catch(() => {});
        },
        () => {}
      )
      .catch((err) => {
        setError("Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen.");
      });

    return () => {
      html5Qrcode.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">QR-Code scannen</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="text-center py-8 text-red-500 text-sm">{error}</div>
          ) : (
            <div id={containerId} className="w-full rounded-xl overflow-hidden" />
          )}
          <p className="text-xs text-slate-400 text-center mt-3">
            Halten Sie den QR-Code vor die Kamera
          </p>
        </div>
      </div>
    </div>
  );
}