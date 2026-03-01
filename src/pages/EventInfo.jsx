import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, ArrowLeft, CheckCircle, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EventInfo() {
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    description: "",
    date: "",
    time: "",
    location: "",
    cover_image_url: "",
    cover_image_position: "50% 50%",
    cover_video_url: "",
    is_paid: false,
    currency: "EUR",
    status: "draft",
    organizer_name: "",
    organizer_email: "",
  });

  const { data: eventArr, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });

  const event = eventArr?.[0];

  // 🔥 IMPORTANT FIX
  const didInit = useRef(false);

  useEffect(() => {
    if (event && !didInit.current) {
      setForm({
        name: event.name || "",
        subtitle: event.subtitle || "",
        description: event.description || "",
        date: event.date || "",
        time: event.time || "",
        location: event.location || "",
        cover_image_url: event.cover_image_url || "",
        cover_image_position: event.cover_image_position || "50% 50%",
        cover_video_url: event.cover_video_url || "",
        is_paid: event.is_paid || false,
        currency: event.currency || "EUR",
        status: event.status || "draft",
        organizer_name: event.organizer_name || "",
        organizer_email: event.organizer_email || "",
      });

      didInit.current = true;
    }
  }, [event]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!event) return;

    setSaving(true);

    try {
      await base44.entities.Event.update(event.id, form);

      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } catch (error) {
      toast.error("Fehler beim Speichern");
    }

    setSaving(false);
  };

  const darkInput = {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "10px",
    color: "#fff",
    padding: "10px 14px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070707" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#beff00" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: "#070707" }}>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          
          <div className="mb-8">
            <Link
              to={createPageUrl(`Dashboard?event_id=${eventId}`)}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 transition-colors"
              style={{ color: "#444" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#beff00")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>

            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {event?.name || "Veranstaltungsinfos"}
              </h1>

              <a
                href={createPageUrl(`EventDetails?event_id=${eventId}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: "#0d1a00", color: "#beff00", border: "1px solid #1a2e00" }}
              >
                <Link2 className="w-3.5 h-3.5" />
                Zur Veranstaltung
              </a>
            </div>
          </div>

          <div className="rounded-2xl p-6 space-y-5" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
            
            <input style={darkInput} value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Event Name" />
            <input style={darkInput} value={form.subtitle} onChange={(e) => handleChange("subtitle", e.target.value)} placeholder="Untertitel" />
            <textarea style={{ ...darkInput, resize: "vertical" }} rows={4} value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Beschreibung" />

            <div className="grid grid-cols-2 gap-4">
              <input type="date" style={{ ...darkInput, colorScheme: "dark" }} value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
              <input style={darkInput} value={form.time} onChange={(e) => handleChange("time", e.target.value)} placeholder="19:00" />
            </div>

            <input style={darkInput} value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Location" />

            <div className="pt-6 border-t border-[#141414] space-y-4">
              <input style={darkInput} value={form.organizer_name} onChange={(e) => handleChange("organizer_name", e.target.value)} placeholder="Veranstalter Name" />
              <input type="email" style={darkInput} value={form.organizer_email} onChange={(e) => handleChange("organizer_email", e.target.value)} placeholder="Veranstalter E-Mail" />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              style={savedOk ? { background: "#0d1a00", color: "#beff00" } : { background: "#beff00", color: "#070707" }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : savedOk ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Gespeichert!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Speichern
                </>
              )}
            </button>

          </div>
        </motion.div>
      </div>
    </div>
  );
}