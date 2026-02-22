import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Calendar, MapPin, Users, Loader2, Ticket, LayoutDashboard, ChevronDown, ChevronUp, ExternalLink, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CreateEventDialog from "@/components/events/CreateEventDialog.jsx";
import { toast } from "sonner";

const statusConfig = {
  draft:     { label: "Entwurf",      color: "bg-slate-100 text-slate-600 border-slate-200" },
  published: { label: "Veröffentlicht", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  archived:  { label: "Archiviert",   color: "bg-slate-50 text-slate-400 border-slate-100" },
};

export default function Home() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);

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

  // Chronological next 5 events
  const sortedEvents = [...events].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  const upcomingEvents = sortedEvents.slice(0, 5);
  const visibleEvents = eventsExpanded ? events : upcomingEvents;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Meine Events</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isAdmin ? "Alle Events aller Veranstalter" : "Deine Veranstaltungen"}
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-slate-900 hover:bg-slate-800 rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Neues Event
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Noch keine Events</p>
            <p className="text-sm mt-1">Erstelle dein erstes Event</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {visibleEvents.map((event, i) => {
                  const stats = getEventStats(event.id);
                  const sc = statusConfig[event.status] || statusConfig.draft;
                  const registerUrl = `${window.location.origin}/register?event_id=${event.id}`;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4 p-4 md:p-5">
                        {/* Cover thumb */}
                        <Link to={createPageUrl(`Dashboard?event_id=${event.id}`)} className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center hover:opacity-80 transition-opacity">
                          {event.cover_image_url ? (
                            <img src={event.cover_image_url} alt={event.name} className="w-full h-full object-cover" style={{ objectPosition: event.cover_image_position || "50% 50%" }} />
                          ) : (
                            <Ticket className="w-6 h-6 text-amber-400 opacity-70" />
                          )}
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Link to={createPageUrl(`Dashboard?event_id=${event.id}`)} className="font-semibold text-slate-900 truncate hover:text-slate-600 transition-colors">{event.name}</Link>
                            <Badge variant="outline" className={`${sc.color} text-xs shrink-0`}>{sc.label}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                            {isAdmin && event.created_by && (
                              <span className="flex items-center gap-1">
                                <span className="text-slate-400">Von:</span>
                                <span className="text-slate-700 font-medium">{event.created_by}</span>
                              </span>
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
                              {stats.pending > 0 && <span className="text-amber-600 font-medium"> · {stats.pending} offen</span>}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(registerUrl);
                              toast.success("Registrierungslink kopiert!");
                            }}
                            title="Registrierungslink kopieren"
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <a
                            href={registerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Registrierungsseite öffnen"
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <Link
                            to={createPageUrl(`Dashboard?event_id=${event.id}`)}
                            title="Dashboard"
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                          </Link>
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
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                {eventsExpanded ? <><ChevronUp className="w-4 h-4" /> Weniger anzeigen</> : <><ChevronDown className="w-4 h-4" /> Alle {events.length} Events anzeigen</>}
              </button>
            )}
          </>
        )}
      </div>

      {showCreate && <CreateEventDialog onClose={() => setShowCreate(false)} onCreated={() => { queryClient.invalidateQueries(["events"]); setShowCreate(false); }} />}
    </div>
  );
}