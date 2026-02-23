import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Loader2, CheckCircle, Zap } from "lucide-react";
import { TicketSelector } from "@/components/ticketing/TicketSelector";
import { TicketRegistration } from "@/components/ticketing/TicketRegistration";
import { toast } from "sonner";

export default function EventTicketing() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [step, setStep] = useState("tickets");
  const [selectedTicketTier, setSelectedTicketTier] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }).then(res => res[0]),
    enabled: !!eventId,
  });

  const { data: ticketTiers, isLoading: tiersLoading } = useQuery({
    queryKey: ["ticketTiers", eventId],
    queryFn: () => base44.entities.TicketTier.filter({ event_id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });

  useEffect(() => {
    if (event) {
      base44.analytics.track({ eventName: "ticketing_page_viewed", properties: { event_id: eventId, event_name: event.name, step } });
    }
  }, [event, eventId, step]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (step !== "success") {
        base44.analytics.track({ eventName: "ticketing_abandoned", properties: { event_id: eventId, step } });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [eventId, step]);

  if (!eventId) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#070707" }}>
      <p className="text-sm" style={{ color: "#444" }}>Event nicht gefunden.</p>
    </div>
  );

  if (eventLoading || tiersLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#070707" }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#beff00" }} />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#070707" }}>
      <p className="text-sm" style={{ color: "#444" }}>Event konnte nicht geladen werden.</p>
    </div>
  );

  const visibleTiers = ticketTiers?.filter(t => t.is_visible !== false) || [];
  const hasTickets = visibleTiers.length > 0;

  const handleTicketSelect = (tier) => {
    base44.analytics.track({ eventName: "ticket_tier_selected", properties: { event_id: eventId, tier_id: tier.id } });
    setSelectedTicketTier(tier);
    setStep("registration");
  };

  const handleRegistrationComplete = (data) => {
    base44.analytics.track({ eventName: "registration_completed", properties: { event_id: eventId } });
    setRegistrationData(data);
    setStep("success");
  };

  const handleRegistrationAbandoned = (reason) => {
    base44.analytics.track({ eventName: "ticketing_abandoned", properties: { event_id: eventId, step: "registration", reason } });
  };

  const handleBackToTickets = () => {
    setSelectedTicketTier(null);
    setStep("tickets");
  };

  // ── SHARED COMPONENTS ──────────────────────────────────────────────────

  const PageHeader = ({ subtitle }) => (
    <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between" style={{ background: "rgba(7,7,7,0.95)", borderBottom: "1px solid #141414", backdropFilter: "blur(12px)" }}>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#beff00" }}>
          <Zap className="w-3.5 h-3.5 text-black" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight">{event.name}</p>
          {subtitle && <p className="text-xs" style={{ color: "#444" }}>{subtitle}</p>}
        </div>
      </div>
      <a href={createPageUrl(`EventDetails?event_id=${eventId}`)} className="p-2 rounded-xl transition-all" style={{ color: "#333" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "#111"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#333"; e.currentTarget.style.background = "transparent"; }}>
        <ChevronLeft className="w-5 h-5" />
      </a>
    </div>
  );

  const SuccessScreen = ({ title, subtitle }) => (
    <div className="text-center py-12 px-6">
      {/* Steps */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {["Registriert", "In Prüfung", "Genehmigt"].map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: i === 0 ? "#beff00" : "#111", color: i === 0 ? "#070707" : "#333", border: i > 0 ? "1px solid #1a1a1a" : "none" }}>
                {i === 0 ? "✓" : i + 1}
              </div>
              <span className="text-xs font-semibold" style={{ color: i === 0 ? "#beff00" : "#333" }}>{label}</span>
            </div>
            {i < 2 && <div className="w-6 h-px" style={{ background: "#1a1a1a" }} />}
          </React.Fragment>
        ))}
      </div>

      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: "#0d1a00", border: "1px solid #1a2e00" }}>
        <CheckCircle className="w-8 h-8" style={{ color: "#beff00" }} />
      </div>
      <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm mb-10" style={{ color: "#555" }}>{subtitle}</p>

      <div className="rounded-2xl p-6 mb-8 text-left max-w-sm mx-auto" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#444" }}>E-Mail</p>
            <p className="text-sm text-white">{registrationData?.email}</p>
          </div>
          {selectedTicketTier && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#444" }}>Ticket-Typ</p>
              <p className="text-sm text-white">{selectedTicketTier.name}</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs mb-8" style={{ color: "#444" }}>Bestätigung wurde per E-Mail gesendet.</p>

      <a
        href={createPageUrl(`EventDetails?event_id=${eventId}`)}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
        style={{ background: "#beff00", color: "#070707" }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 24px rgba(190,255,0,0.4)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
      >
        Zur Veranstaltungsseite
      </a>
    </div>
  );

  // ── NO TICKET TIERS (guest-only flow) ─────────────────────────────────
  if (!hasTickets) {
    return (
      <div className="min-h-screen" style={{ background: "#070707" }}>
        <PageHeader subtitle={step === "success" ? "Registrierung abgeschlossen" : "Registrierung"} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          {step === "registration" ? (
            <TicketRegistration
              event={event}
              onRegistrationComplete={handleRegistrationComplete}
              onAbandon={handleRegistrationAbandoned}
              onBack={() => {
                setStep("success");
              }}
            />
          ) : (
            <SuccessScreen
              title="Registrierung eingegangen!"
              subtitle="Deine Registrierung wird geprüft. Du erhältst dein Ticket per E-Mail."
            />
          )}
        </div>
      </div>
    );
  }

  // ── WITH TICKET TIERS (full flow) ──────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#070707" }}>
      <PageHeader subtitle={step === "tickets" ? "Ticketwahl" : step === "registration" ? "Registrierung" : "Registrierung abgeschlossen"} />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        {step === "tickets" && (
          <TicketSelector tiers={visibleTiers} onSelectTier={handleTicketSelect} />
        )}
        {step === "registration" && (
          <TicketRegistration
            event={event}
            ticketTier={selectedTicketTier}
            onRegistrationComplete={handleRegistrationComplete}
            onAbandon={handleRegistrationAbandoned}
            onBack={handleBackToTickets}
          />
        )}
        {step === "success" && (
          <SuccessScreen
            title="Registrierung eingegangen!"
            subtitle="Deine Registrierung wird geprüft. Du erhältst dein Ticket per E-Mail."
          />
        )}
      </div>
    </div>
  );
}