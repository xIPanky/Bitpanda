import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { CheckCircle, Mail, Calendar, Download, Smartphone, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

export default function RegistrationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { eventId } = state;
  const urlParams = new URLSearchParams(window.location.search);
  const registrationId = urlParams.get("registration_id");
  const eventIdParam = urlParams.get("event_id");
  
  const { data: registration } = useQuery({
    queryKey: ["registration", registrationId],
    queryFn: () => registrationId ? base44.entities.Registration.filter({ id: registrationId }) : Promise.resolve([]),
    select: (data) => data?.[0],
    enabled: !!registrationId,
  });

  const { data: event } = useQuery({
    queryKey: ["event", eventIdParam],
    queryFn: () => eventIdParam ? base44.entities.Event.filter({ id: eventIdParam }) : Promise.resolve([]),
    select: (data) => data?.[0],
    enabled: !!eventIdParam,
  });

  const { data: tickets } = useQuery({
    queryKey: ["tickets", registrationId],
    queryFn: () => registrationId ? base44.entities.Ticket.filter({ registration_id: registrationId }) : Promise.resolve([]),
    enabled: !!registrationId && registration?.status === "approved",
  });

  const ticket = tickets?.[0];
  const isApproved = registration?.status === "approved";
  const eventName = event?.name || "Event";

  const statuses = [
    { step: 1, label: "Registriert", status: "done" },
    { step: 2, label: "In Prüfung", status: registration?.status === "pending" ? "active" : registration?.status === "approved" ? "done" : "pending" },
    { step: 3, label: "Genehmigt", status: registration?.status === "approved" ? "done" : "pending" }
  ];

  const handleAddToCalendar = () => {
    if (!event?.date) {
      toast.error("Event-Datum nicht verfügbar");
      return;
    }

    const startDate = new Date(event.date + (event.time ? `T${event.time}` : "T09:00"));
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Ticket Manager//DE
BEGIN:VEVENT
UID:${event.id}@ticketmanager
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
SUMMARY:${eventName}
LOCATION:${event.location || ""}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ical], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kalender-Datei heruntergeladen");
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "#070707" }}>
      <div className="max-w-2xl mx-auto">
        {/* Status Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {statuses.map((s, idx) => (
              <div key={s.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center w-full">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 flex-shrink-0 ${
                    s.status === "done" ? "bg-[#beff00] text-black" : 
                    s.status === "active" ? "bg-[#beff00] text-black" : 
                    "bg-[#1a1a1a] text-[#333]"
                  }`}>
                    {s.status === "done" ? <CheckCircle className="w-5 h-5" /> : s.step}
                  </div>
                  <span className={`text-xs md:text-sm font-medium text-center ${
                    s.status === "done" ? "text-[#beff00]" : 
                    s.status === "active" ? "text-[#beff00]" : 
                    "text-[#333]"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < statuses.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${
                    s.status === "done" ? "bg-[#beff00]" : "bg-[#1a1a1a]"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: "#1a2e00" }}>
            <CheckCircle className="w-8 h-8" style={{ color: "#beff00" }} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Registrierung eingegangen!</h1>
          <p className="text-sm md:text-base" style={{ color: "#888" }}>
            Deine Registrierung wird geprüft. Du erhältst dein Ticket per E-Mail.
          </p>
        </div>

        {/* Event Info Card */}
        {event && (
          <div className="rounded-2xl p-6 md:p-8 mb-8" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
            <h2 className="text-xl font-bold text-white mb-6">{eventName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#beff00" }} />
                  <div>
                    <p className="text-xs" style={{ color: "#666" }}>DATUM</p>
                    <p className="text-sm md:text-base text-white font-medium">
                      {new Date(event.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                      {event.time && ` · ${event.time} Uhr`}
                    </p>
                  </div>
                </div>
              )}
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#beff00" }} />
                  <div>
                    <p className="text-xs" style={{ color: "#666" }}>ORT</p>
                    <p className="text-sm md:text-base text-white font-medium">{event.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isApproved && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            <button
              onClick={handleAddToCalendar}
              className="p-4 rounded-xl font-medium transition-all text-sm"
              style={{ background: "#111", border: "1px solid #1a1a1a", color: "#beff00" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1a1a1a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#111"; }}
            >
              <Calendar className="w-4 h-4 mx-auto mb-2" />
              Kalender
            </button>
            <button
              disabled
              className="p-4 rounded-xl font-medium transition-all text-sm opacity-50 cursor-not-allowed"
              style={{ background: "#111", border: "1px solid #1a1a1a", color: "#666" }}
            >
              <Download className="w-4 h-4 mx-auto mb-2" />
              PDF
            </button>
            <button
              disabled
              className="p-4 rounded-xl font-medium transition-all text-sm opacity-50 cursor-not-allowed"
              style={{ background: "#111", border: "1px solid #1a1a1a", color: "#666" }}
            >
              <Smartphone className="w-4 h-4 mx-auto mb-2" />
              Wallet
            </button>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate(createPageUrl(`EventDetails?event_id=${eventIdParam || eventId}`))}
          className="w-full py-3 rounded-xl font-bold transition-all text-sm"
          style={{ background: "#beff00", color: "#070707" }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(190,255,0,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
        >
          Zur Veranstaltungsseite
        </button>
      </div>
    </div>
  );
}