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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event, i) => {
              const stats = getEventStats(event.id);
              const sc = statusConfig[event.status] || statusConfig.draft;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={createPageUrl(`Dashboard?event_id=${event.id}`)}>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group">
                      {event.cover_image_url ? (
                        <div className="h-36 overflow-hidden">
                          <img
                            src={event.cover_image_url}
                            alt={event.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            style={{ objectPosition: event.cover_image_position || "50% 50%" }}
                          />
                        </div>
                      ) : (
                        <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                          <Ticket className="w-10 h-10 text-amber-400 opacity-60" />
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="font-semibold text-slate-900 leading-tight">{event.name}</h3>
                          <Badge variant="outline" className={`${sc.color} text-xs shrink-0`}>{sc.label}</Badge>
                        </div>
                        <div className="space-y-1.5 text-sm text-slate-500">
                          {event.date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {format(new Date(event.date), "dd. MMMM yyyy", { locale: de })}
                              {event.time && ` · ${event.time}`}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {event.location}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-900">{stats.total}</span>
                            <span className="text-slate-400">Anmeldungen</span>
                          </div>
                          {stats.pending > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="text-amber-700 font-medium">{stats.pending} offen</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && <CreateEventDialog onClose={() => setShowCreate(false)} onCreated={() => { queryClient.invalidateQueries(["events"]); setShowCreate(false); }} />}
    </div>
  );
}