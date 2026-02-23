import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Building2, Phone, Mail, Tag, MessageSquare, UserPlus, Edit2, Download } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EditGuestDialog } from "../components/guest/EditGuestDialog";
import jsPDF from "jspdf";
import { toast } from "sonner";

const categoryColors = {
  VIP: "bg-amber-50 text-amber-700 border-amber-200",
  Business: "bg-blue-50 text-blue-700 border-blue-200",
  Presse: "bg-purple-50 text-purple-700 border-purple-200",
  Standard: "bg-slate-50 text-slate-600 border-slate-200",
  Speaker: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Sponsor: "bg-pink-50 text-pink-700 border-pink-200",
};

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};
const statusLabels = { pending: "Ausstehend", approved: "Freigegeben", rejected: "Abgelehnt" };

export default function GuestData() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editGuest, setEditGuest] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const { data: registrations } = useQuery({
    queryKey: ["registrations", eventId],
    queryFn: () => eventId
      ? base44.entities.Registration.filter({ event_id: eventId }, "-created_date")
      : base44.entities.Registration.list("-created_date"),
    initialData: [],
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: () => base44.entities.Event.list(),
    initialData: [],
  });

  const { data: tickets } = useQuery({
    queryKey: ["tickets", eventId],
    queryFn: () => eventId
      ? base44.entities.Ticket.filter({ event_id: eventId })
      : base44.entities.Ticket.list(),
    initialData: [],
  });

  const eventMap = Object.fromEntries(events.map((e) => [e.id, e.name]));
  const ticketMap = Object.fromEntries(tickets.map((t) => [t.registration_id, t]));

  const filtered = registrations.filter((r) => {
    const term = search.toLowerCase();
    const matchSearch =
      r.first_name?.toLowerCase().includes(term) ||
      r.last_name?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.phone?.toLowerCase().includes(term);
    const matchCat = filterCategory === "all" || r.category === filterCategory;
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const handleDownloadTicket = async (registration) => {
    try {
      const ticket = ticketMap[registration.id];
      if (!ticket) {
        toast.error("Ticket nicht gefunden");
        return;
      }

      const event = events.find(e => e.id === registration.event_id);
      const eventName = event?.name || "SYNERGY";
      const eventDate = event?.date ? new Date(event.date) : null;
      const eventLocation = event?.location || "";
      const eventTime = event?.time || "";

      // A5 portrait = 148 x 210 mm
      const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "portrait" });
      const W = 148;
      const H = 210;

      // ── BACKGROUND: deep charcoal ──────────────────────────────────────
      doc.setFillColor(7, 7, 7);
      doc.rect(0, 0, W, H, "F");

      // subtle dark gradient bands
      doc.setFillColor(14, 14, 14);
      doc.rect(0, 0, W, 70, "F");

      // ── NEON LIME accent line (top) ────────────────────────────────────
      doc.setFillColor(190, 255, 0);
      doc.rect(0, 0, W, 1.2, "F");

      // ── TOP LABELS ─────────────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(190, 255, 0);
      doc.text("GUESTLIST ACCESS", 10, 10);

      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      const category = (registration.category || ticket.category || "STANDARD").toUpperCase();
      doc.text(category, W - 10, 10, { align: "right" });

      // ── EVENT NAME (HERO) ───────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(38);
      doc.setTextColor(255, 255, 255);
      doc.text(eventName.toUpperCase(), W / 2, 36, { align: "center" });

      // neon underline accent under event name
      const nameWidth = Math.min(doc.getTextWidth(eventName.toUpperCase()), 110);
      doc.setFillColor(190, 255, 0);
      doc.rect((W - nameWidth) / 2, 39, nameWidth, 0.8, "F");

      // ── SUBTITLE ───────────────────────────────────────────────────────
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text("INVITE ONLY · EXCLUSIVE ACCESS · VIP GUESTLIST", W / 2, 47, { align: "center" });

      // ── DIVIDER ────────────────────────────────────────────────────────
      doc.setDrawColor(35, 35, 35);
      doc.setLineWidth(0.4);
      doc.line(10, 55, W - 10, 55);

      // ── EVENT INFO ROW ─────────────────────────────────────────────────
      const infoY = 66;
      // Date block (left)
      if (eventDate) {
        const day = eventDate.toLocaleDateString("de-DE", { day: "2-digit" });
        const month = eventDate.toLocaleDateString("de-DE", { month: "short" }).toUpperCase();
        const year = eventDate.getFullYear();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text(day, 28, infoY, { align: "center" });
        doc.setFontSize(8);
        doc.setTextColor(190, 255, 0);
        doc.text(month, 28, infoY + 6, { align: "center" });
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(String(year), 28, infoY + 12, { align: "center" });
      }

      // vertical separator
      doc.setDrawColor(35, 35, 35);
      doc.setLineWidth(0.4);
      doc.line(W / 2, 57, W / 2, 80);

      // Time + Location (right)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text("DOORS OPEN", W * 0.75, infoY - 6, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(eventTime || "22:00", W * 0.75, infoY + 2, { align: "center" });
      if (eventLocation) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        const locLines = doc.splitTextToSize(eventLocation, 50);
        doc.text(locLines, W * 0.75, infoY + 9, { align: "center" });
      }

      // ── DIVIDER ────────────────────────────────────────────────────────
      doc.setDrawColor(35, 35, 35);
      doc.setLineWidth(0.4);
      doc.line(10, 83, W - 10, 83);

      // ── GUEST INFO CARD ────────────────────────────────────────────────
      const cardY = 88;
      const cardH = 40;
      doc.setFillColor(16, 16, 16);
      doc.roundedRect(10, cardY, W - 20, cardH, 3, 3, "F");

      // neon left accent bar
      doc.setFillColor(190, 255, 0);
      doc.roundedRect(10, cardY, 2.5, cardH, 1, 1, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text("GUEST NAME", 18, cardY + 8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      const guestName = `${registration.first_name} ${registration.last_name}`.toUpperCase();
      doc.text(guestName, 18, cardY + 18);

      // ticket id row
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text("TICKET ID", 18, cardY + 27);

      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(190, 255, 0);
      doc.text(ticket.ticket_code, 18, cardY + 33);

      // entry type top-right of card
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(190, 255, 0);
      doc.text("ENTRY TYPE", W - 18, cardY + 8, { align: "right" });
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(category, W - 18, cardY + 16, { align: "right" });

      // ── QR CODE ────────────────────────────────────────────────────────
      const qrY = cardY + cardH + 8;
      const qrSize = 42;
      const qrX = (W - qrSize) / 2;

      // QR background frame (slightly lighter dark)
      doc.setFillColor(20, 20, 20);
      doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8 + 10, 3, 3, "F");
      doc.setDrawColor(35, 35, 35);
      doc.setLineWidth(0.4);
      doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8 + 10, 3, 3, "S");

      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=BEFF00&bgcolor=141414&data=${encodeURIComponent(ticket.ticket_code)}`;
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error("QR load failed"));
          image.src = qrUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        doc.addImage(canvas.toDataURL("image/png"), "PNG", qrX, qrY, qrSize, qrSize);
      } catch (qrErr) {
        // fallback: just show code if QR fails
        doc.setFont("courier", "bold");
        doc.setFontSize(8);
        doc.setTextColor(190, 255, 0);
        doc.text(ticket.ticket_code, W / 2, qrY + qrSize / 2, { align: "center" });
      }

      // SCAN label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(130, 130, 130);
      doc.text("SCAN FOR ENTRY", W / 2, qrY + qrSize + 8, { align: "center" });

      // ── DIVIDER ────────────────────────────────────────────────────────
      const footerDivY = qrY + qrSize + 16;
      doc.setDrawColor(35, 35, 35);
      doc.setLineWidth(0.4);
      doc.line(10, footerDivY, W - 10, footerDivY);

      // ── FOOTER ─────────────────────────────────────────────────────────
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(70, 70, 70);
      doc.text("Valid only for approved guestlist entry. Non-transferable.", W / 2, footerDivY + 6, { align: "center" });
      doc.text(eventName.toUpperCase() + " · " + (eventDate ? eventDate.getFullYear() : ""), W / 2, footerDivY + 11, { align: "center" });

      // ── BOTTOM NEON LINE ───────────────────────────────────────────────
      doc.setFillColor(190, 255, 0);
      doc.rect(0, H - 1.2, W, 1.2, "F");

      doc.save(`SYNERGY-Ticket-${ticket.ticket_code}.pdf`);
      toast.success("Ticket heruntergeladen");
    } catch (err) {
      console.error("Error downloading ticket:", err);
      toast.error("Fehler beim Download");
    }
  };

  const thStyle = { color: "#2a2a2a", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "12px 20px", borderBottom: "1px solid #141414", textAlign: "left" };
  const tdStyle = { padding: "12px 20px", borderBottom: "1px solid #101010", fontSize: "13px" };

  const statusStyleMap = {
    pending:  { bg: "#1a1500", text: "#f59e0b", border: "#2a2000" },
    approved: { bg: "#0d1a00", text: "#beff00", border: "#1a2e00" },
    rejected: { bg: "#1a0505", text: "#ef4444", border: "#2a0808" },
  };

  return (
    <div className="min-h-screen p-5 md:p-8 space-y-6" style={{ background: "#070707" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Gästedaten</h1>
            <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: "#444" }}>{registrations.length} Registrierungen insgesamt</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#333" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suche nach Name, E-Mail..."
                className="w-full h-9 pl-9 pr-4 rounded-xl text-sm text-white outline-none transition-all"
                style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", color: "#fff" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#beff00"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(190,255,0,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 px-3 rounded-xl text-sm text-white outline-none w-44"
              style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
              <option value="all" style={{ background: "#111" }}>Alle Kategorien</option>
              {["VIP", "Business", "Presse", "Standard", "Speaker", "Sponsor"].map((c) => (
                <option key={c} value={c} style={{ background: "#111" }}>{c}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-xl text-sm text-white outline-none w-44"
              style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
              <option value="all" style={{ background: "#111" }}>Alle Status</option>
              <option value="approved" style={{ background: "#111" }}>Freigegeben</option>
              <option value="pending" style={{ background: "#111" }}>Ausstehend</option>
              <option value="rejected" style={{ background: "#111" }}>Abgelehnt</option>
            </select>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {!eventId && <th style={thStyle}>Event</th>}
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>E-Mail</th>
                    <th style={thStyle}>Telefon</th>
                    <th style={thStyle}>Ticket</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Eingeladen von</th>
                    <th style={thStyle}>Anmerkungen</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16">
                        <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "#1a1a1a" }} />
                        <p className="text-xs uppercase tracking-widest" style={{ color: "#2a2a2a" }}>Keine Gäste gefunden</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((reg) => {
                      const ss = statusStyleMap[reg.status] || statusStyleMap.pending;
                      return (
                        <tr key={reg.id} className="group transition-colors" onMouseEnter={(e) => e.currentTarget.style.background = "#111"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          {!eventId && <td style={tdStyle}><span style={{ color: "#555" }}>{eventMap[reg.event_id] || "—"}</span></td>}
                          <td style={tdStyle}>
                            <p className="font-semibold text-white whitespace-nowrap">{reg.first_name} {reg.last_name}</p>
                            {reg.plus_one && <p className="text-xs mt-0.5" style={{ color: "#beff00" }}>+1 {reg.plus_one_name || ""}</p>}
                          </td>
                          <td style={tdStyle}><span style={{ color: "#555" }}>{reg.email}</span></td>
                          <td style={tdStyle}><span style={{ color: "#555" }}>{reg.phone || "—"}</span></td>
                          <td style={tdStyle}>
                            {ticketMap[reg.id] && reg.status === "approved" ? (
                              <button
                                onClick={() => handleDownloadTicket(reg)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: "#0d1a00", color: "#beff00", border: "1px solid #1a2e00" }}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 12px rgba(190,255,0,0.2)"}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                              >
                                <Download className="w-3 h-3" /> PDF
                              </button>
                            ) : <span style={{ color: "#2a2a2a" }}>—</span>}
                          </td>
                          <td style={tdStyle}>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>
                              {statusLabels[reg.status] || reg.status}
                            </span>
                          </td>
                          <td style={tdStyle}><span style={{ color: "#555" }}>{reg.invited_by || "—"}</span></td>
                          <td style={{ ...tdStyle, maxWidth: "200px" }}><span className="truncate block" style={{ color: "#555" }}>{reg.notes || "—"}</span></td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <button
                              onClick={() => { setEditGuest(reg); setEditDialogOpen(true); }}
                              className="p-2 rounded-lg transition-all"
                              style={{ color: "#333" }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "#beff00"; e.currentTarget.style.background = "#111"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "#333"; e.currentTarget.style.background = "transparent"; }}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-right mt-2" style={{ color: "#333" }}>{filtered.length} von {registrations.length} Einträgen</p>
          </motion.div>
          </div>

          <EditGuestDialog
          guest={editGuest}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
            queryClient.invalidateQueries({ queryKey: ["tickets", eventId] });
          }}
          />
          </div>
          );
          }