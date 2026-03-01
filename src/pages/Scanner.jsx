import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  ScanLine,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import QRScanner from "../components/scanner/QRScanner";

export default function Scanner() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const inputRef = useRef(null);

 const handleScan = async (scanCode) => {
  const trimmed = (scanCode || code).trim();
  if (!trimmed) return;

  setLoading(true);
  setResult(null);

  try {
    const tickets = await base44.entities.Ticket.filter({
      ticket_code: trimmed,
    });

    if (!tickets || tickets.length === 0) {
      setResult({
        type: "error",
        message: "Ticket nicht gefunden",
      });
      return;
    }

    const ticket = tickets[0];

    // FIX 1: Event Vergleich als String
    if (eventId && String(ticket.event_id) !== String(eventId)) {
      setResult({
        type: "error",
        message: "Ticket gehört zu anderem Event",
        ticket,
      });
      return;
    }

    if (ticket.status === "used") {
      setResult({
        type: "warning",
        message: `Bereits eingecheckt am ${ticket.checked_in_at
          ? new Date(ticket.checked_in_at).toLocaleString("de-DE")
          : "Unbekannt"}`,
        ticket,
      });
      return;
    }

    if (ticket.status === "cancelled") {
      setResult({
        type: "error",
        message: "Ticket wurde storniert",
        ticket,
      });
      return;
    }

    // CHECK IN
    await base44.entities.Ticket.update(ticket.id, {
      status: "used",
      checked_in_at: new Date().toISOString(),
    });

    let registration = null;

    if (ticket.registration_id) {
      const regs = await base44.entities.Registration.filter({
        id: ticket.registration_id,
      });
      registration = regs?.[0] || null;
    }

    setResult({
      type: "success",
      message: "Check-in erfolgreich!",
      ticket: { ...ticket, status: "used" },
      registration: registration || null,
    });

    toast.success("Gast eingecheckt!");
  } catch (err) {
    console.error("SCAN ERROR:", err);

    setResult({
      type: "error",
      message: "Systemfehler – bitte erneut versuchen",
    });
  } finally {
    setLoading(false);
  }
};

  const reset = () => {
    setResult(null);
    setCode("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  const handleQRScan = (scannedCode) => {
    setShowCamera(false);
    setCode(scannedCode);
    handleScan(scannedCode);
  };

  const config = {
    success: {
      bg: "#0d1a00",
      border: "#1a2e00",
      iconColor: "#beff00",
      icon: CheckCircle2,
    },
    warning: {
      bg: "#1a1500",
      border: "#2a2000",
      iconColor: "#f59e0b",
      icon: AlertTriangle,
    },
    error: {
      bg: "#1a0505",
      border: "#2a0808",
      iconColor: "#ef4444",
      icon: XCircle,
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#070707]">
      {showCamera && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="w-full max-w-lg">
        {!result && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-[#0d1a00] border border-[#1a2e00]">
                <ScanLine className="w-8 h-8 text-[#beff00]" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Ticket Scanner
              </h1>
              <p className="text-sm mt-1 text-gray-500">
                QR-Code scannen oder Ticket-Code eingeben
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-[#1a1a1a]">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.toUpperCase())
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="ABC-123"
                  autoFocus
                  className="flex-1 h-14 text-lg font-mono text-center rounded-xl bg-[#111] border border-[#1e1e1e] text-[#beff00]"
                />

                <button
                  onClick={() => setShowCamera(true)}
                  className="h-14 px-4 rounded-xl bg-[#111] border border-[#1e1e1e] text-gray-500 hover:text-[#beff00] hover:border-[#beff00]"
                >
                  <Camera />
                </button>

                <button
                  onClick={() => handleScan()}
                  disabled={loading || !code.trim()}
                  className="h-14 px-6 rounded-xl bg-[#beff00] text-black font-bold disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Search />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 rounded-2xl p-8 text-center"
              style={{
                background: config[result.type].bg,
                border: `1px solid ${config[result.type].border}`,
              }}
            >
              {React.createElement(config[result.type].icon, {
                className: "w-12 h-12 mx-auto mb-4",
                style: { color: config[result.type].iconColor },
              })}

              <h2 className="text-xl font-bold text-white mb-4">
                {result.message}
              </h2>

{result?.registration?.first_name && (
  <p className="text-white text-lg mb-4">
    {result.registration.first_name} {result.registration.last_name}
  </p>
)}

              <button
                onClick={reset}
                className="mt-4 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20"
              >
                <RotateCcw className="inline w-4 h-4 mr-2" />
                Neu scannen
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}