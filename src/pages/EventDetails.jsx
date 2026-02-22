import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Calendar, MapPin, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function EventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }).then(res => res[0]),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      base44.analytics.track({
        eventName: "event_details_viewed",
        properties: { event_id: eventId, event_name: event.name }
      });
    }
  }, [event, eventId]);

  if (!eventId) {
    return <div className="p-6 text-center text-slate-500">Event nicht gefunden.</div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!event) {
    return <div className="p-6 text-center text-slate-500">Event konnte nicht geladen werden.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section mit Cover Image */}
      <div className="relative h-96 bg-slate-200 overflow-hidden">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: event.cover_image_position || "50% 50%" }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{event.name}</h1>
          {event.subtitle && <p className="text-xl text-white/90">{event.subtitle}</p>}
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {event.date && (
            <div className="flex gap-4">
              <Calendar className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Datum</p>
                <p className="font-semibold text-slate-900">{format(new Date(event.date), "dd. MMMM yyyy", { locale: de })}</p>
              </div>
            </div>
          )}
          
          {event.time && (
            <div className="flex gap-4">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Uhrzeit</p>
                <p className="font-semibold text-slate-900">{event.time}</p>
              </div>
            </div>
          )}
          
          {event.location && (
            <div className="flex gap-4">
              <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Ort</p>
                <p className="font-semibold text-slate-900">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="prose prose-slate max-w-none mb-12">
            <h2 className="text-2xl font-bold mb-4">Über diese Veranstaltung</h2>
            <p className="whitespace-pre-line text-slate-600">{event.description}</p>
          </div>
        )}

        {/* CTA Button */}
        <div className="flex gap-4">
          <Button
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => {
              base44.analytics.track({
                eventName: "tickets_cta_clicked",
                properties: { event_id: eventId, event_name: event.name }
              });
              window.location.href = createPageUrl(`EventTicketing?event_id=${eventId}`);
            }}
          >
            Jetzt Tickets sichern
          </Button>
        </div>
      </div>
    </div>
  );
}