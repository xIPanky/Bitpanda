import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, Mail, User2, Loader2, Pencil, RefreshCw, Download } from "lucide-react";
import EditRegistrationDialog from "./EditRegistrationDialog";
import { format } from "date-fns";

const statusConfig = {
  pending:  { label: "Ausstehend",  bg: "#1a1500", text: "#f59e0b", border: "#2a2000", icon: Clock },
  approved: { label: "Freigegeben", bg: "#0d1a00", text: "#beff00", border: "#1a2e00", icon: CheckCircle2 },
  rejected: { label: "Abgelehnt",   bg: "#1a0505", text: "#ef4444", border: "#2a0808", icon: XCircle },
};

const categoryColors = {
  VIP:      { bg: "#1a1200", text: "#f59e0b", border: "#2a1e00" },
  Business: { bg: "#0a0f1a", text: "#60a5fa", border: "#0f1a2e" },
  Presse:   { bg: "#120a1a", text: "#a78bfa", border: "#1e0f2e" },
  Standard: { bg: "#111111", text: "#888888", border: "#1e1e1e" },
  Speaker:  { bg: "#0a1a0d", text: "#34d399", border: "#0f2e14" },
  Sponsor:  { bg: "#1a0a12", text: "#f472b6", border: "#2e0f1e" },
};

export default function RegistrationTable({
  registrations, tickets = [], onApprove, onReject, onResend, onCategoryChange, onEdit,
  processingId, filterStatus, filterCategory, onFilterStatusChange, onFilterCategoryChange,
}) {
  const [editTarget, setEditTarget] = React.useState(null);

  const handleSave = async (form) => {
    await onEdit(form);
    setEditTarget(null);
  };

  return (
    <div className="relative">
      {editTarget && (
        <EditRegistrationDialog
          registration={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
        {/* Header + Filters */}
        <div className="px-6 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom: "1px solid #1a1a1a" }}>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mr-auto">Registrierungen</h3>

          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="w-40 h-8 text-xs border-0" style={{ background: "#161616", color: "#888", borderRadius: "8px" }}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent style={{ background: "#111", border: "1px solid #222" }}>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="pending">Ausstehend</SelectItem>
              <SelectItem value="approved">Freigegeben</SelectItem>
              <SelectItem value="rejected">Abgelehnt</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
            <SelectTrigger className="w-40 h-8 text-xs border-0" style={{ background: "#161616", color: "#888", borderRadius: "8px" }}>
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent style={{ background: "#111", border: "1px solid #222" }}>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {Object.keys(categoryColors).map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                {["Gast", "Kontakt", "Unternehmen", "Quelle", "Status", "Ticket", "Datum", "Aktionen"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "#3a3a3a" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <User2 className="w-8 h-8 mx-auto mb-3" style={{ color: "#2a2a2a" }} />
                      <p className="text-sm" style={{ color: "#3a3a3a" }}>Keine Registrierungen gefunden</p>
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg) => {
                    const status = statusConfig[reg.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const isProcessing = processingId === reg.id;
                    const catStyle = categoryColors[reg.category || "Standard"] || categoryColors.Standard;
                    const regTicket = tickets.find(t => t.registration_id === reg.id);

                    return (
                      <motion.tr
                        key={reg.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group transition-colors"
                        style={{ borderBottom: "1px solid #141414" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#111111"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-sm text-white">{reg.first_name} {reg.last_name}</p>
                          {reg.plus_one && <p className="text-xs mt-0.5" style={{ color: "#beff00" }}>+1 {reg.plus_one_name || ""}</p>}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#555" }}>
                            <Mail className="w-3 h-3" style={{ color: "#333" }} />
                            {reg.email}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <Select value={reg.category || "Standard"} onValueChange={(val) => onCategoryChange(reg.id, val)}>
                            <SelectTrigger className="w-auto h-6 border-0 p-0 bg-transparent shadow-none focus:ring-0">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}` }}>
                                {reg.category || "Standard"}
                              </span>
                            </SelectTrigger>
                            <SelectContent style={{ background: "#111", border: "1px solid #222" }}>
                              {Object.keys(categoryColors).map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          {reg.status === "approved" && reg.approved_by && (
                            <p className="text-[10px] mt-1" style={{ color: "#333" }}>von {reg.approved_by}</p>
                          )}
                        </td>

                        {/* Ticket column */}
                        <td className="px-6 py-4">
                          {regTicket?.generation_status === 'creating' && (
                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg" style={{ background: "#1a1200", color: "#f59e0b", border: "1px solid #2a2000" }}>
                              <Loader2 className="w-3 h-3 animate-spin" /> Generiert…
                            </span>
                          )}
                          {regTicket?.generation_status === 'failed' && (
                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg" title={regTicket.last_generation_error || ''} style={{ background: "#1a0505", color: "#ef4444", border: "1px solid #2a0808" }}>
                              <XCircle className="w-3 h-3" /> Fehler
                            </span>
                          )}
                          {regTicket?.generation_status === 'ready' && regTicket?.pdf_url && (
                            <a
                              href={regTicket.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: "#0d1a00", color: "#beff00", border: "1px solid rgba(190,255,0,0.2)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(190,255,0,0.5)"; e.currentTarget.style.boxShadow = "0 0 10px rgba(190,255,0,0.15)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(190,255,0,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                              title="Ticket-PDF herunterladen"
                            >
                              <Download className="w-3 h-3" /> PDF
                            </a>
                          )}
                          {!regTicket && (
                            <span style={{ color: "#2a2a2a", fontSize: "12px" }}>–</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs" style={{ color: "#444" }}>
                          {reg.created_date ? format(new Date(reg.created_date), "dd.MM.yyyy") : "–"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditTarget(reg)}
                              className="p-1.5 rounded-lg transition-all"
                              style={{ color: "#444" }}
                              title="Bearbeiten"
                              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "#1a1a1a"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; e.currentTarget.style.background = "transparent"; }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {(reg.status === "pending" || reg.status === "rejected") && (
                              <button
                                disabled={isProcessing}
                                onClick={() => onApprove(reg)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                style={{ background: "#beff00", color: "#070707" }}
                                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 16px rgba(190,255,0,0.4)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                {reg.status === "rejected" ? "Doch freigeben" : "Freigeben"}
                              </button>
                            )}

                            {reg.status === "pending" && (
                              <button
                                disabled={isProcessing}
                                onClick={() => onReject(reg.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                style={{ background: "#1a0505", color: "#ef4444", border: "1px solid #2a0808" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#220808"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#1a0505"; }}
                              >
                                <XCircle className="w-3 h-3" />
                                Ablehnen
                              </button>
                            )}

                            {reg.status === "approved" && onResend && regTicket?.generation_status === 'ready' && (
                              <button
                                disabled={isProcessing}
                                onClick={() => onResend(reg)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                style={{ background: "#111", color: "#555", border: "1px solid #1e1e1e" }}
                                title="Ticket-E-Mail erneut senden"
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#beff00"; e.currentTarget.style.borderColor = "rgba(190,255,0,0.3)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#1e1e1e"; }}
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              </button>
                            )}
                            {reg.status === "approved" && onApprove && !regTicket && (
                              <button
                                disabled={isProcessing}
                                onClick={() => onApprove(reg)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                style={{ background: "#0d1a00", color: "#beff00", border: "1px solid rgba(190,255,0,0.2)" }}
                                title="Ticket generieren & E-Mail senden"
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(190,255,0,0.5)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(190,255,0,0.2)"; }}
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                Ticket
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}