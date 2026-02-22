import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Search, CheckCircle2, XCircle, AlertTriangle, Loader2, RotateCcw, Camera } from "lucide-react";
import { toast } from "sonner";
import QRScanner from "../components/scanner/QRScanner";

export default function Scanner() {
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

    const tickets = await base44.entities.Ticket.filter({ ticket_code: trimmed });

    if (!tickets || tickets.length === 0) {
      setResult({ type: "error", message: "Ticket nicht gefunden", ticket: null });
      setLoading(false);
      return;
    }

    const ticket = tickets[0];

    if (ticket.status === "used") {
      setResult({
        type: "warning",
        message: `Bereits eingecheckt am ${new Date(ticket.checked_in_at).toLocaleString("de-DE")}`,
        ticket,
      });
      setLoading(false);
      return;
    }

    if (ticket.status === "cancelled") {
      setResult({ type: "error", message: "Ticket wurde storniert", ticket });
      setLoading(false);
      return;
    }

    // Valid ticket – check in
    await base44.entities.Ticket.update(ticket.id, {
      status: "used",
      checked_in_at: new Date().toISOString(),
    });

    setResult({
      type: "success",
      message: "Check-in erfolgreich!",
      ticket: { ...ticket, status: "used" },
    });
    toast.success("Gast eingecheckt!");
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  const handleQRScan = (scannedCode) => {
    setShowCamera(false);
    setCode(scannedCode.trim());
    handleScan(scannedCode.trim());
  };

  const reset = () => {
    setResult(null);
    setCode("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const resultConfig = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-100",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-100",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: XCircle,
      iconColor: "text-red-500",
      iconBg: "bg-red-100",
    },
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
      {showCamera && <QRScanner onScan={handleQRScan} onClose={() => setShowCamera(false)} />}
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 mb-4">
            <ScanLine className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ticket Scanner</h1>
          <p className="text-sm text-slate-500 mt-1">
            Scannen Sie den QR-Code oder geben Sie den Ticket-Code ein
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/30 p-6 mb-6"
        >
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="TKT-XXXXXXXX"
              className="h-14 text-lg font-mono tracking-wider text-center border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
              autoFocus
            />
            <Button
              onClick={() => handleScan()}
              disabled={loading || !code.trim()}
              className="h-14 px-6 bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.type}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`rounded-2xl border ${resultConfig[result.type].border} ${resultConfig[result.type].bg} p-8`}
            >
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${resultConfig[result.type].iconBg} mb-4`}>
                  {React.createElement(resultConfig[result.type].icon, {
                    className: `w-8 h-8 ${resultConfig[result.type].iconColor}`,
                  })}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{result.message}</h2>

                {result.ticket && (
                  <div className="mt-6 bg-white/70 rounded-xl p-5 text-left space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Gast</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {result.ticket.guest_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Kategorie</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {result.ticket.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Code</span>
                      <span className="text-sm font-mono text-slate-900">
                        {result.ticket.ticket_code}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={reset}
                  variant="outline"
                  className="mt-6 h-12 px-8 rounded-xl"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Nächsten Gast scannen
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}