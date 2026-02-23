import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, Ticket, Search, Users, Trash2, Ban, Download, Link2, Copy, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

const statusConfig = {
  pending:   { label: "Ausstehend",  bg: "#1a1500", text: "#f59e0b", border: "#2a2000" },
  approved:  { label: "Genehmigt",   bg: "#0d1a00", text: "#beff00", border: "#1a2e00" },
  rejected:  { label: "Abgelehnt",   bg: "#1a0505", text: "#ef4444", border: "#2a0808" },
  valid:     { label: "Gültig",      bg: "#0a0f1a", text: "#60a5fa", border: "#0f1a2e" },
  used:      { label: "Eingecheckt", bg: "#0d1a00", text: "#beff00", border: "#1a2e00" },
  cancelled: { label: "Storniert",   bg: "#1a0505", text: "#ef4444", border: "#2a0808" },
};

const Btn = ({ children, onClick, style, disabled, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${className}`}
    style={style}
  >
    {children}
  </button>
);

export default function GuestList() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("registrations");
  const [filterDropdownQuestion, setFilterDropdownQuestion] = useState("");
  const [filterDropdownAnswer, setFilterDropdownAnswer] = useState("");
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }).then(res => res[0]),
    enabled: !!eventId,
  });

  const { data: registrations } = useQuery({
    queryKey: ["registrations", eventId],
    queryFn: () => eventId
      ? base44.entities.Registration.filter({ event_id: eventId }, "-created_date")
      : base44.entities.Registration.list("-created_date"),
    initialData: [],
  });

  const { data: tickets } = useQuery({
    queryKey: ["tickets", eventId],
    queryFn: () => eventId
      ? base44.entities.Ticket.filter({ event_id: eventId }, "-created_date")
      : base44.entities.Ticket.list("-created_date"),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Ticket.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tickets", eventId] }); toast.success("Ticket gelöscht"); setDeleteTarget(null); },
  });

  const cancelMutation = useMutation({
    mutationFn: async (ticket) => {
      await base44.entities.Ticket.update(ticket.id, { status: "cancelled" });
      if (ticket.registration_id) await base44.entities.Registration.update(ticket.registration_id, { status: "rejected" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", eventId] });
      queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
      toast.success("Ticket storniert");
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.Registration.update(id, { status: "approved" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["registrations", eventId] }); toast.success("Registrierung genehmigt"); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => base44.entities.Registration.update(id, { status: "rejected" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["registrations", eventId] }); toast.success("Registrierung abgelehnt"); },
  });

  const deleteRegistrationMutation = useMutation({
    mutationFn: async (registrationId) => {
      const regTickets = tickets.filter(t => t.registration_id === registrationId);
      for (const t of regTickets) await base44.entities.Ticket.delete(t.id);
      await base44.entities.Registration.delete(registrationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
      queryClient.invalidateQueries({ queryKey: ["tickets", eventId] });
      toast.success("Gast und Tickets gelöscht");
      setDeleteTarget(null);
    },
  });

  const filteredRegistrations = registrations.filter((r) => {
    const term = search.toLowerCase();
    return r.first_name?.toLowerCase().includes(term) || r.last_name?.toLowerCase().includes(term) || r.email?.toLowerCase().includes(term);
  });

  const filteredTickets = tickets.filter((t) => {
    const term = search.toLowerCase();
    const matchesSearch = t.guest_name?.toLowerCase().includes(term) || t.guest_email?.toLowerCase().includes(term) || t.ticket_code?.toLowerCase().includes(term);
    const matchesFilter = !filterDropdownQuestion || !filterDropdownAnswer || (t.custom_answers && t.custom_answers[parseInt(filterDropdownQuestion)] === filterDropdownAnswer);
    return matchesSearch && matchesFilter;
  });

  const dropdownQuestions = event?.custom_questions?.map((q, idx) => {
    const parts = q.split("||");
    return { index: idx, text: parts[0], type: parts[1] || "text", options: parts[2]?.split("~") || [] };
  }).filter(q => q.type === "dropdown") || [];

  const thStyle = { color: "#2a2a2a", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "12px 20px", borderBottom: "1px solid #141414", textAlign: "left" };
  const tdStyle = { padding: "14px 20px", borderBottom: "1px solid #101010", fontSize: "13px" };

  return (
    <div className="min-h-screen p-5 md:p-8 space-y-5" style={{ background: "#070707" }}>
      {/* Registration Link */}
      {eventId && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
          <Link2 className="w-4 h-4 flex-shrink-0" style={{ color: "#333" }} />
          <div className="flex-1 font-mono text-xs truncate" style={{ color: "#555" }}>
            {`${window.location.origin}${createPageUrl(`EventTicketing?event_id=${eventId}`)}`}
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${createPageUrl(`EventTicketing?event_id=${eventId}`)}`); toast.success("Link kopiert!"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0"
            style={{ background: "#161616", color: "#beff00", border: "1px solid #1e1e1e" }}
          >
            <Copy className="w-3 h-3" /> Kopieren
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gästeliste</h1>
          <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: "#444" }}>
            {activeTab === "registrations"
              ? `${registrations.length} Registrierungen · ${registrations.filter(r => r.status === "approved").length} genehmigt`
              : `${tickets.length} Tickets · ${tickets.filter(t => t.status === "used").length} eingecheckt`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#333" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche..."
              className="h-9 pl-9 pr-4 rounded-xl text-sm text-white placeholder-[#333] outline-none transition-all"
              style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", width: "200px" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#beff00"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(190,255,0,0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          {activeTab === "tickets" && dropdownQuestions.length > 0 && (
            <>
              <select value={filterDropdownQuestion} onChange={(e) => { setFilterDropdownQuestion(e.target.value); setFilterDropdownAnswer(""); }}
                className="h-9 px-3 rounded-xl text-sm text-white outline-none" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
                <option value="">Alle Fragen</option>
                {dropdownQuestions.map((q) => <option key={q.index} value={q.index}>{q.text}</option>)}
              </select>
              {filterDropdownQuestion && (
                <select value={filterDropdownAnswer} onChange={(e) => setFilterDropdownAnswer(e.target.value)}
                  className="h-9 px-3 rounded-xl text-sm text-white outline-none" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
                  <option value="">Alle Antworten</option>
                  {dropdownQuestions[parseInt(filterDropdownQuestion)]?.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
        {[{ id: "registrations", label: `Registrierungen (${registrations.length})` }, { id: "tickets", label: `Tickets (${tickets.length})` }].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
            style={activeTab === tab.id ? { background: "#beff00", color: "#070707" } : { color: "#444" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {activeTab === "registrations"
                  ? ["Name", "E-Mail", "Status", "Aktionen"].map(h => <th key={h} style={thStyle}>{h}</th>)
                  : ["Gast", "E-Mail", "Code", "Status", "Aktionen"].map(h => <th key={h} style={thStyle}>{h}</th>)
                }
              </tr>
            </thead>
            <tbody>
              {activeTab === "registrations" ? (
                filteredRegistrations.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-16">
                    <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "#1a1a1a" }} />
                    <p className="text-xs uppercase tracking-widest" style={{ color: "#2a2a2a" }}>Keine Registrierungen</p>
                  </td></tr>
                ) : filteredRegistrations.map((reg) => {
                  const s = statusConfig[reg.status] || statusConfig.pending;
                  return (
                    <tr key={reg.id} className="group transition-colors" onMouseEnter={(e) => e.currentTarget.style.background = "#111"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={tdStyle}>
                        <p className="font-semibold text-white">{reg.first_name} {reg.last_name}</p>
                      </td>
                      <td style={tdStyle}><span style={{ color: "#555" }}>{reg.email}</span></td>
                      <td style={tdStyle}>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div className="flex items-center gap-1.5">
                          {reg.status === "pending" && (
                            <>
                              <Btn onClick={() => approveMutation.mutate(reg.id)} style={{ background: "#beff00", color: "#070707" }}>
                                <CheckCircle2 className="w-3 h-3" /> Genehmigen
                              </Btn>
                              <Btn onClick={() => rejectMutation.mutate(reg.id)} style={{ background: "#1a0505", color: "#ef4444", border: "1px solid #2a0808" }}>
                                <XCircle className="w-3 h-3" /> Ablehnen
                              </Btn>
                            </>
                          )}
                          <Btn onClick={() => setDeleteTarget(reg)} style={{ background: "#111", color: "#333", border: "1px solid #1a1a1a" }}>
                            <Trash2 className="w-3 h-3" />
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                filteredTickets.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16">
                    <Ticket className="w-8 h-8 mx-auto mb-3" style={{ color: "#1a1a1a" }} />
                    <p className="text-xs uppercase tracking-widest" style={{ color: "#2a2a2a" }}>Keine Tickets</p>
                  </td></tr>
                ) : filteredTickets.map((ticket) => {
                  const s = statusConfig[ticket.status] || statusConfig.valid;
                  return (
                    <tr key={ticket.id} className="group transition-colors" onMouseEnter={(e) => e.currentTarget.style.background = "#111"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={tdStyle}><p className="font-semibold text-white">{ticket.guest_name}</p></td>
                      <td style={tdStyle}><span style={{ color: "#555" }}>{ticket.guest_email}</span></td>
                      <td style={tdStyle}>
                        <code className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: "#111", color: "#beff00", border: "1px solid #1a2e00" }}>
                          {ticket.ticket_code}
                        </code>
                      </td>
                      <td style={tdStyle}>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div className="flex items-center gap-1.5">
                          {ticket.status !== "cancelled" && (
                            <Btn onClick={() => cancelMutation.mutate(ticket)} style={{ background: "#1a1200", color: "#f59e0b", border: "1px solid #2a1e00" }}>
                              <Ban className="w-3 h-3" /> Stornieren
                            </Btn>
                          )}
                          <Btn onClick={() => setDeleteTarget(ticket)} style={{ background: "#111", color: "#333", border: "1px solid #1a1a1a" }}>
                            <Trash2 className="w-3 h-3" />
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", color: "#fff" }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{deleteTarget?.ticket_code ? "Ticket" : "Gast"} löschen?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#555" }}>
              {deleteTarget?.ticket_code
                ? <>Das Ticket von <strong className="text-white">{deleteTarget?.guest_name}</strong> wird dauerhaft gelöscht.</>
                : <>Der Gast <strong className="text-white">{deleteTarget?.first_name} {deleteTarget?.last_name}</strong> und alle Tickets werden dauerhaft gelöscht.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: "#111", color: "#888", border: "1px solid #1a1a1a" }}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              style={{ background: "#ef4444", color: "#fff" }}
              disabled={deleteRegistrationMutation.isPending || deleteMutation.isPending}
              onClick={() => deleteTarget?.ticket_code ? deleteMutation.mutate(deleteTarget.id) : deleteRegistrationMutation.mutate(deleteTarget.id)}
            >
              {(deleteRegistrationMutation.isPending || deleteMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}