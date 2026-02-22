import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import RegistrationForm from "../components/registration/RegistrationForm";

export default function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: settingsArr } = useQuery({
    queryKey: ["eventSettings"],
    queryFn: () => base44.entities.EventSettings.list(),
    initialData: [],
  });

  const eventSettings = settingsArr?.[0] || {};

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    await base44.entities.Registration.create({
      ...formData,
      status: "pending",
    });
    setIsSuccess(true);
    setIsSubmitting(false);
  };

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {eventSettings.event_name || "Veranstaltung"}
            </h1>
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