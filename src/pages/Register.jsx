import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import RegistrationForm from "../components/registration/RegistrationForm";

export default function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const { data: eventArr } = useQuery({
    queryKey: ["event-register", eventId],
    queryFn: () => eventId
      ? base44.entities.Event.filter({ id: eventId })
      : base44.entities.EventSettings.list(),
    initialData: [],
  });

  // Support both old EventSettings and new Event entity
  const raw = eventArr?.[0] || {};
  const eventSettings = raw.event_name ? raw : {
    event_name: raw.name,
    event_subtitle: raw.subtitle,
    event_date: raw.date,
    event_time: raw.time,
    event_location: raw.location,
    cover_image_url: raw.cover_image_url,
    cover_image_position: raw.cover_image_position,
    custom_questions: raw.custom_questions,
    invitation_options: raw.invitation_options,
    registration_open: raw.registration_open,
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    await base44.entities.Registration.create({
      ...formData,
      event_id: eventId || raw.id || "",
      status: "pending",
    });
    setIsSuccess(true);
    setIsSubmitting(false);
  };

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Ungültiger Link</h1>
          <p className="text-slate-500">Dieser Registrierungslink ist nicht gültig. Bitte verwenden Sie den Link aus Ihrer Einladung.</p>
        </div>
      </div>
    );
  }

  if (eventSettings && eventSettings.registration_open === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Registrierung geschlossen</h1>
          <p className="text-slate-500">Die Registrierung für diese Veranstaltung ist derzeit nicht möglich.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-slate-900 text-white">
        {/* Cover image with overlay */}
        {eventSettings.cover_image_url && (
          <div className="absolute inset-0">
            <img
              src={eventSettings.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />
          </div>
        )}
        {!eventSettings.cover_image_url && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
        )}
        <div className="relative max-w-3xl mx-auto px-6 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-amber-300 mb-6">
              <CalendarDays className="w-4 h-4" />
              <span>Einladung zur Veranstaltung</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              {eventSettings.event_name || "Veranstaltung"}
            </h1>
            {eventSettings.event_subtitle && (
              <p className="text-lg text-slate-300 font-light">
                {eventSettings.event_subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300 text-sm mt-6">
              {eventSettings.event_date && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-400" />
                  {new Date(eventSettings.event_date).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
              {eventSettings.event_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {eventSettings.event_time} Uhr
                </div>
              )}
              {eventSettings.event_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  {eventSettings.event_location}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 -mt-8 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Registrierung</h2>
          <p className="text-sm text-slate-500 mb-8">
            Bitte füllen Sie das Formular aus. Sie erhalten Ihr Ticket nach Freigabe per E-Mail.
          </p>
          <RegistrationForm
            eventSettings={eventSettings}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isSuccess={isSuccess}
          />
        </motion.div>
      </div>
    </div>
  );
}