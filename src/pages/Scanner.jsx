import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Camera,
  BadgeCheck,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import QRScanner from "../components/scanner/QRScanner";

/**
 * Assumptions:
 * Ticket entity fields used:
 * - id
 * - ticket_code
 * - status: "used" | "cancelled" | "valid" (adjust if needed)
 * - checked_in_at (ISO string)
 * - event_id
 * - registration_id
 * - guest_name (optional)
 * - category (optional)
 *
 * Registration entity fields used:
 * - first_name
 * - last_name
 * - email
 * - category (optional)
 */

const NOT_USED_STATUSES = new Set(["valid", "issued", "active", "", null, undefined]); // adjust to your system

export default function Scanner() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id"); // may be null

  const inputRef = useRef(null);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [showCamera, setShowCamera] = useState(false);

  const scanningRef = useRef(false);

  // the ticket we found
  const [ticket, setTicket] = useState(null);
  const [registration, setRegistration] = useState(null);

  // UI result overlay
  const [result, setResult] = useState(null); // { type: "success"|"warning"|"error", title, message }

  // keep small history list (optional but useful)
  const [history, setHistory] = useState([]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const statusLabel = useMemo(() => {
    if (!ticket) return null;
    if (ticket.status === "used") return { text: "ENTWERTET", tone: "success" };
    if (ticket.status === "cancelled") return { text: "STORNIERT", tone: "error" };
    return { text: "GÜLTIG", tone: "neutral" };
  }, [ticket]);

  const reset = () => {
    setCode("");
    setTicket(null);
    setRegistration(null);
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const pushHistory = (entry) => {
    setHistory((h) => [entry, ...h].slice(0, 8));
  };

  const safeDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const lookupTicket = async (scanCode) => {
    const trimmed = (scanCode ?? code).trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setTicket(null);
    setRegistration(null);

    try {
      // 1) Find ticket by code
      const tickets = await base44.entities.Ticket.filter({ ticket_code: trimmed });

      if (!tickets?.length) {
        setResult({
          type: "error",
          title: "Nicht gefunden",
          message: "Kein Ticket mit diesem Code gefunden.",
        });
        pushHistory({ at: new Date().toISOString(), code: trimmed, outcome: "not_found" });
        return;
      }

      const t = tickets[0];

      // Optional: validate event match
      if (eventId && String(t.event_id) !== String(eventId)) {
        setTicket(t);
        setResult({
          type: "error",
          title: "Falsches Event",
          message: "Dieses Ticket gehört zu einem anderen Event.",
        });
        pushHistory({ at: new Date().toISOString(), code: trimmed, outcome: "wrong_event" });
        return;
      }

      // 2) Load registration (optional)
      let reg = null;
      if (t.registration_id) {
        const regs = await base44.entities.Registration.filter({ id: t.registration_id });
        reg = regs?.[0] || null;
      }

      setTicket(t);
      setRegistration(reg);

      // 3) Show status overlay (visual feedback right away)
      if (t.status === "used") {
        const d = safeDate(t.checked_in_at);
        setResult({
          type: "warning",
          title: "Schon entwertet",
          message: d ? `Bereits eingecheckt am ${d.toLocaleString("de-DE")}` : "Bereits eingecheckt.",
        });
        pushHistory({ at: new Date().toISOString(), code: trimmed, outcome: "already_used" });
      } else if (t.status === "cancelled") {
        setResult({
          type: "error",
          title: "Storniert",
          message: "Dieses Ticket wurde storniert und ist nicht gültig.",
        });
        pushHistory({ at: new Date().toISOString(), code: trimmed, outcome: "cancelled" });
      } else {
        setResult({
          type: "success",
          title: "Ticket gefunden",
          message: "Ticket ist gültig und kann jetzt entwertet werden.",
        });
        pushHistory({ at: new Date().toISOString(), code: trimmed, outcome: "found_valid" });
      }
    } catch (err) {
      console.error(err);
      setResult({
        type: "error",
        title: "Systemfehler",
        message: "Beim Laden ist etwas schiefgelaufen. Bitte erneut versuchen.",
      });
      pushHistory({ at: new Date().toISOString(), code: (scanCode ?? code).trim(), outcome: "error" });
    } finally {
      setLoading(false);
    }
  };

  const voidTicket = async () => {
    if (!ticket?.id) return;

    // Already used / cancelled guard
    if (ticket.status === "used") {
      setResult({ type: "warning", title: "Schon entwertet", message: "Dieses Ticket ist bereits entwertet." });
      return;
    }
    if (ticket.status === "cancelled") {
      setResult({ type: "error", title: "Storniert", message: "Stornierte Tickets können nicht entwertet werden." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const nowIso = new Date().toISOString();

      await base44.entities.Ticket.update(ticket.id, {
        status: "used",
        checked_in_at: nowIso,
      });

      const updated = { ...ticket, status: "used", checked_in_at: nowIso };
      setTicket(updated);

      setResult({
        type: "success",
        title: "Entwertet ✅",
        message: "Check-in erfolgreich. Ticket ist jetzt entwertet.",
      });
      toast.success("Ticket entwertet");
      pushHistory({ at: new Date().toISOString(), code: ticket.ticket_code, outcome: "voided" });
    } catch (err) {
      console.error(err);
      setResult({
        type: "error",
        title: "Fehler",
        message: "Ticket konnte nicht entwertet werden. Bitte erneut versuchen.",
      });
      toast.error("Entwertung fehlgeschlagen");
      pushHistory({ at: new Date().toISOString(), code: ticket.ticket_code, outcome: "void_failed" });
    } finally {
      setLoading(false);
    }
  };

  // Optional: Undo (only if you want it)
  const undoVoid = async () => {
    if (!ticket?.id) return;

    setLoading(true);
    setResult(null);

    try {
      // choose your "not used" status here:
      const backStatus = "valid";

      await base44.entities.Ticket.update(ticket.id, {
        status: backStatus,
        checked_in_at: null,
      });

      const updated = { ...ticket, status: backStatus, checked_in_at: null };
      setTicket(updated);

      setResult({
        type: "success",
        title: "Rückgängig ✅",
        message: "Entwertung wurde zurückgesetzt.",
      });
      toast.success("Entwertung zurückgesetzt");
      pushHistory({ at: new Date().toISOString(), code: ticket.ticket_code, outcome: "undo_ok" });
    } catch (err) {
      console.error(err);
      setResult({
        type: "error",
        title: "Fehler",
        message: "Rückgängig machen ist fehlgeschlagen.",
      });
      toast.error("Undo fehlgeschlagen");
      pushHistory({ at: new Date().toISOString(), code: ticket.ticket_code, outcome: "undo_failed" });
    } finally {
      setLoading(false);
    }
  };

 const onQRScan = async (scannedCode) => {
  if (!scannedCode) return;

  // STOP multiple scans
  if (scanningRef.current) return;
  scanningRef.current = true;

  try {
    let cleanCode = scannedCode.trim();

    // Falls QR eine URL ist
    if (cleanCode.startsWith("http")) {
      try {
        const url = new URL(cleanCode);
        const queryCode = url.searchParams.get("code");
        if (queryCode) {
          cleanCode = queryCode;
        } else {
          const parts = url.pathname.split("/");
          cleanCode = parts[parts.length - 1];
        }
      } catch {}
    }

    setShowCamera(false);
    setCode(cleanCode);

    await lookupTicket(cleanCode);

  } catch (err) {
    console.error("Scan error:", err);
  } finally {
    // unlock after small delay
    setTimeout(() => {
      scanningRef.current = false;
    }, 1000);
  }
};

  const onEnter = (e) => {
    if (e.key === "Enter") lookupTicket();
  };

  const colors = {
    success: { bg: "#0d1a00", border: "#1a2e00", icon: CheckCircle2, iconColor: "#beff00" },
    warning: { bg: "#1a1500", border: "#2a2000", icon: AlertTriangle, iconColor: "#f59e0b" },
    error: { bg: "#1a0505", border: "#2a0808", icon: XCircle, iconColor: "#ef4444" },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#070707" }}>
      {showCamera && <QRScanner onScan={onQRScan} onClose={() => setShowCamera(false)} />}

      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
            style={{ background: "#0d1a00", border: "1px solid #1a2e00" }}
          >
            <ScanLine className="w-8 h-8" style={{ color: "#beff00" }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Ticket Scanner</h1>
          <p className="text-sm mt-1" style={{ color: "#444" }}>
            QR-Code scannen oder Ticket-Code eingeben – Ticket anzeigen & entwerten
          </p>
        </motion.div>

        {/* Input row */}
        <div className="p-5 rounded-2xl" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={onEnter}
              placeholder="ABC-123"
              className="flex-1 h-14 text-lg font-mono tracking-wider text-center rounded-xl outline-none"
              style={{ background: "#111", border: "1px solid #1e1e1e", color: "#beff00" }}
            />

            <button
              onClick={() => setShowCamera(true)}
              className="h-14 px-4 rounded-xl transition-all"
              style={{ background: "#111", border: "1px solid #1e1e1e", color: "#555" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#beff00";
                e.currentTarget.style.borderColor = "#beff00";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#555";
                e.currentTarget.style.borderColor = "#1e1e1e";
              }}
              title="Kamera öffnen"
            >
              <Camera className="w-5 h-5" />
            </button>

            <button
              onClick={() => lookupTicket()}
              disabled={loading || !code.trim()}
              className="h-14 px-6 rounded-xl transition-all disabled:opacity-40"
              style={{ background: "#beff00", color: "#070707" }}
              title="Ticket suchen"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "#444" }}>
            <span>{eventId ? `Event-ID: ${eventId}` : "Kein Event-Filter aktiv"}</span>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Result overlay */}
        <AnimatePresence mode="wait">
          {result && (() => {
            const cfg = colors[result.type] || colors.error;
            const Icon = cfg.icon;

            return (
              <motion.div
                key={`${result.type}-${result.title}`}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="rounded-2xl p-6"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
                    <Icon className="w-7 h-7" style={{ color: cfg.iconColor }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold text-lg">{result.title}</div>
                    <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {result.message}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "rgba(255,255,255,0.85)",
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Neu scannen
                      </button>

                      {ticket && ticket.status !== "cancelled" && ticket.status !== "used" && (
                        <button
                          onClick={voidTicket}
                          disabled={loading}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                          style={{
                            background: "#beff00",
                            color: "#070707",
                          }}
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                          Ticket entwerten
                        </button>
                      )}

                      {ticket && ticket.status === "used" && (
                        <button
                          onClick={undoVoid}
                          disabled={loading}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            color: "rgba(255,255,255,0.85)",
                          }}
                          title="Optional: nur wenn du Undo erlauben willst"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                          Entwertung rückgängig
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Ticket details card */}
        {ticket && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6"
            style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-bold text-xl">
                  {registration
                    ? `${registration.first_name || ""} ${registration.last_name || ""}`.trim() || "Gast"
                    : ticket.guest_name || "Gast"}
                </div>
                <div className="text-sm mt-1" style={{ color: "#666" }}>
                  {registration?.email || "—"}
                </div>
              </div>

              {statusLabel && (
                <div
                  className="px-3 py-1.5 rounded-xl text-xs font-black tracking-widest"
                  style={{
                    background:
                      statusLabel.tone === "success"
                        ? "rgba(190,255,0,0.12)"
                        : statusLabel.tone === "error"
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(255,255,255,0.06)",
                    color:
                      statusLabel.tone === "success"
                        ? "#beff00"
                        : statusLabel.tone === "error"
                        ? "#ef4444"
                        : "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {statusLabel.text}
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoRow label="Ticket-Code" value={ticket.ticket_code || "—"} mono />
              <InfoRow label="Kategorie" value={ticket.category || registration?.category || "Standard"} />
              <InfoRow label="Status" value={ticket.status || "valid"} />
              <InfoRow
                label="Check-in Zeit"
                value={
                  ticket.checked_in_at
                    ? (safeDate(ticket.checked_in_at)?.toLocaleString("de-DE") ?? ticket.checked_in_at)
                    : "—"
                }
                mono
              />
            </div>
          </motion.div>
        )}

        {/* History (optional) */}
        {history.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: "#0b0b0b", border: "1px solid #151515" }}>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#444" }}>
              Letzte Scans
            </div>
            <div className="mt-3 space-y-2">
              {history.map((h, idx) => (
                <div
                  key={`${h.at}-${idx}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-sm text-white font-mono">{h.code}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {new Date(h.at).toLocaleTimeString("de-DE")} · {h.outcome}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
        {label}
      </div>
      <div className={`text-sm font-semibold text-white ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}