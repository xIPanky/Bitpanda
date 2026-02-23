import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Calendar, MapPin, Users, Loader2, Ticket, LayoutDashboard, ChevronDown, ChevronUp, ExternalLink, Copy, Zap, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import CreateEventDialog from "@/components/events/CreateEventDialog.jsx";
import { toast } from "sonner";

const statusConfig = {
  draft:     { label: "Entwurf",        bg: "#111", text: "#555",    border: "#1a1a1a" },
  published: { label: "Veröffentlicht", bg: "#0d1a00", text: "#beff00", border: "#1a2e00" },
  archived:  { label: "Archiviert",     bg: "#111", text: "#333",    border: "#1a1a1a" },
};

export default function Home() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [deleteEvent, setDeleteEvent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === "admin";

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const all = await base44.entities.Event.list("-created_date");
      if (isAdmin) return all;
      return all.filter((e) => e.created_by === user?.email);
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: registrations } = useQuery({
    queryKey: ["all-registrations"],
    queryFn: () => base44.entities.Registration.list(),
    initialData: [],
  });

  const getEventStats = (eventId) => {
    const regs = registrations.filter((r) => r.event_id === eventId);
    return {
      total: regs.length,
      approved: regs.filter((r) => r.status === "approved").length,
      pending: regs.filter((r) => r.status === "pending").length,
    };
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const upcomingEvents = sortedEvents.slice(0, 5);
  const visibleEvents = eventsExpanded ? events : upcomingEvents;

  const handleDeleteEvent = async () => {
    if (!deleteEvent) return;
    setIsDeleting(true);
    try {
      await base44.entities.Event.delete(deleteEvent.id);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event gelöscht");
      setDeleteEvent(null);
    } catch (error) {
      toast.error("Fehler beim Löschen");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: "#070707" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Meine Events</h1>
            <p className="text-sm mt-0.5" style={{ color: "#444" }}>
              {isAdmin ? "Alle Events aller Veranstalter" : "Deine Veranstaltungen"}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: "#beff00", color: "#070707" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(190,255,0,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
          >
            <Plus className="w-4 h-4" />
            Neues Event
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#2a2a2a" }} />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24">
            <Ticket className="w-10 h-10 mx-auto mb-4" style={{ color: "#1a1a1a" }} />
            <p className="font-semibold text-white">Noch keine Events</p>
            <p className="text-sm mt-1" style={{ color: "#444" }}>Erstelle dein erstes Event</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {visibleEvents.map((event, i) => {
                  const stats = getEventStats(event.id);
                  const sc = statusConfig[event.status] || statusConfig.draft;
                  const registerUrl = `${window.location.origin}/register?event_id=${event.id}`;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-2xl overflow-hidden transition-all group"
                      style={{ background: "#0d0d0d", border: "1px solid #161616" }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#222"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "#161616"}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Cover thumb */}
                        <Link to={createPageUrl(`Dashboard?event_id=${event.id}`)} className="shrink-0 w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center transition-opacity hover:opacity-80" style={{ background: "#1a1a1a" }}>
                          {event.cover_image_url ? (
                            <img src={event.cover_image_url} alt={event.name} className="w-full h-full object-cover" style={{ objectPosition: event.cover_image_position || "50% 50%" }} />
                          ) : (
                            <Zap className="w-5 h-5" style={{ color: "#beff00" }} />
                          )}
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link to={createPageUrl(`Dashboard?event_id=${event.id}`)} className="font-semibold text-white truncate text-sm hover:opacity-70 transition-opacity">
                              {event.name}
                            </Link>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                              {sc.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: "#444" }}>
                            {isAdmin && event.created_by && (
                              <span>Von: <span style={{ color: "#666" }}>{event.created_by}</span></span>
                            )}
                            {event.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(event.date), "dd. MMM yyyy", { locale: de })}
                                {event.time && ` · ${event.time}`}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {stats.total} Anmeldungen
                              {stats.pending > 0 && <span style={{ color: "#f59e0b" }} className="font-medium"> · {stats.pending} offen</span>}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-1">
                          {[
                            { icon: Copy, title: "Link kopieren", action: () => { navigator.clipboard.writeText(registerUrl); toast.success("Link kopiert!"); } },
                            { icon: ExternalLink, title: "Registrierung öffnen", href: registerUrl },
                            { icon: LayoutDashboard, title: "Dashboard", to: createPageUrl(`Dashboard?event_id=${event.id}`) },
                          ].map(({ icon: Icon, title, action, href, to }, idx) => {
                            const cls = "p-2 rounded-lg transition-all text-sm";
                            const style = { color: "#333" };
                            const hoverEnter = (e) => { e.currentTarget.style.color = "#beff00"; e.currentTarget.style.background = "#111"; };
                            const hoverLeave = (e) => { e.currentTarget.style.color = "#333"; e.currentTarget.style.background = "transparent"; };
                            if (action) return (
                              <button key={idx} onClick={action} title={title} className={cls} style={style} onMouseEnter={hoverEnter} onMouseLeave={hoverLeave}>
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                            if (href) return (
                              <a key={idx} href={href} target="_blank" rel="noopener noreferrer" title={title} className={cls} style={style} onMouseEnter={hoverEnter} onMouseLeave={hoverLeave}>
                                <Icon className="w-4 h-4" />
                              </a>
                            );
                            return (
                              <Link key={idx} to={to} title={title} className={cls} style={style} onMouseEnter={hoverEnter} onMouseLeave={hoverLeave}>
                                <Icon className="w-4 h-4" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {events.length > 5 && (
              <button
                onClick={() => setEventsExpanded(!eventsExpanded)}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium uppercase tracking-widest transition-colors"
                style={{ color: "#333" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#beff00"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#333"}
              >
                {eventsExpanded
                  ? <><ChevronUp className="w-4 h-4" /> Weniger anzeigen</>
                  : <><ChevronDown className="w-4 h-4" /> Alle {events.length} Events anzeigen</>}
              </button>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <CreateEventDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => { queryClient.invalidateQueries(["events"]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}