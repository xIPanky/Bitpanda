import React from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Clock, Ticket as TicketIcon, CheckCircle2, XCircle } from "lucide-react";
import QRGenerator from "../components/scanner/QRGenerator";

export default function TicketPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["ticket", code],
    queryFn: () => base44.entities.Ticket.filter({ ticket_code: code }),
    enabled: !!code,
    initialData: [],
  });

  const { data: settingsArr } = useQuery({
    queryKey: ["eventSettings"],
    queryFn: () => base44.entities.EventSettings.list(),
    initialData: [],
  });

  const ticket = tickets?.[0];
  const eventSettings = settingsArr?.[0] || {};

  if (!code) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-slate-500">Kein Ticket-Code angegeben.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Ticket nicht gefunden</h2>
          <p className="text-slate-500">Dieser Ticket-Code ist ungültig.</p>
        </div>
      </div>
    );
  }

  const isUsed = ticket.status === "used";
  const isCancelled = ticket.status === "cancelled";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4">
                <TicketIcon className="w-7 h-7 text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {eventSettings.event_name || "Veranstaltung"}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-4 text-slate-300 text-xs mt-4">
                {eventSettings.event_date && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                    {new Date(eventSettings.event_date).toLocaleDateString("de-DE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                )}
                {eventSettings.event_time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {eventSettings.event_time} Uhr
                  </div>
                )}
                {eventSettings.event_location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {eventSettings.event_location}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dashed separator */}
          <div className="relative">
            <div className="absolute -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-b from-slate-100 to-white" />
            <div className="absolute -right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-b from-slate-100 to-white" />
            <div className="border-b-2 border-dashed border-slate-200 mx-8" />
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            {(isUsed || isCancelled) && (
              <div className={`mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isUsed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
              }`}>
                {isUsed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {isUsed ? "Bereits eingecheckt" : "Storniert"}
              </div>
            )}

            <QRGenerator value={ticket.ticket_code} size={180} />

            <div className="mt-6 space-y-1">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Ticket-Code</p>
              <p className="text-2xl font-bold text-slate-900 tracking-widest">{ticket.ticket_code}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-left bg-slate-50 rounded-2xl p-5">
              <div>
                <p className="text-xs text-slate-400 font-medium">Gast</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{ticket.guest_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Kategorie</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{ticket.category}</p>
              </div>
            </div>

            {ticket.checked_in_at && (
              <p className="text-xs text-slate-400 mt-4">
                Eingecheckt: {new Date(ticket.checked_in_at).toLocaleString("de-DE")}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}