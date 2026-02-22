import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Loader2, CheckCircle, Copy } from "lucide-react";
import { TicketSelector } from "@/components/ticketing/TicketSelector";
import { TicketRegistration } from "@/components/ticketing/TicketRegistration";
import { toast } from "sonner";

export default function EventTicketing() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [step, setStep] = useState("tickets"); // "tickets" or "registration"
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
  });

  // Track page visits
  useEffect(() => {
    if (event) {
      base44.analytics.track({
        eventName: "ticketing_page_viewed",
        properties: { event_id: eventId, event_name: event.name, step }
      });
    }
  }, [event, eventId, step]);

  // Track if user leaves without completing
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (step === "tickets" && !selectedTicketTier) {
        base44.analytics.track({
          eventName: "ticketing_abandoned",
          properties: { event_id: eventId, step: "ticket_selection", reason: "page_unload" }
        });
      } else if (step === "registration" && !registrationData) {
        base44.analytics.track({
          eventName: "ticketing_abandoned",
          properties: { event_id: eventId, step: "registration", reason: "page_unload" }
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [eventId, step, selectedTicketTier, registrationData]);

  if (!eventId) {
    return <div className="p-6 text-center text-slate-500">Event nicht gefunden.</div>;
  }

  if (eventLoading || tiersLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!event) {
    return <div className="p-6 text-center text-slate-500">Event konnte nicht geladen werden.</div>;
  }

  const handleTicketSelect = (tier) => {
    base44.analytics.track({
      eventName: "ticket_tier_selected",
      properties: { event_id: eventId, tier_id: tier.id, tier_name: tier.name }
    });
    setSelectedTicketTier(tier);
    setStep("registration");
  };

  const handleRegistrationComplete = (data) => {
    setRegistrationData(data);
    base44.analytics.track({
      eventName: "registration_completed",
      properties: { event_id: eventId, tier_id: selectedTicketTier.id }
    });
  };

  const handleRegistrationAbandoned = (reason) => {
    base44.analytics.track({
      eventName: "ticketing_abandoned",
      properties: { event_id: eventId, step: "registration", reason }
    });
  };

  const handleBackToTickets = () => {
    base44.analytics.track({
      eventName: "registration_back_clicked",
      properties: { event_id: eventId, tier_id: selectedTicketTier.id }
    });
    setSelectedTicketTier(null);
    setStep("tickets");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{event.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {step === "tickets" ? "Schritt 1: Ticket auswählen" : "Schritt 2: Registrierung"}
            </p>
          </div>
          <a href={createPageUrl(`EventDetails?event_id=${eventId}`)} className="text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-6 h-6" />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {step === "tickets" && (
          <TicketSelector
            event={event}
            tiers={ticketTiers}
            onSelectTier={handleTicketSelect}
          />
        )}

        {step === "registration" && selectedTicketTier && (
          <TicketRegistration
            event={event}
            tier={selectedTicketTier}
            onComplete={handleRegistrationComplete}
            onAbandoned={handleRegistrationAbandoned}
            onBack={handleBackToTickets}
          />
        )}
      </div>
    </div>
  );
}