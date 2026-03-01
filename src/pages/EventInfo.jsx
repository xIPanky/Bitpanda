import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Link2,
  ImageIcon,
  Video,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EventInfo() {
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

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

  // 🔥 WICHTIG: verhindert Überschreiben beim Tippen
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

  // 🔥 Pflichtfeld-Check
  if (
    !form.name.trim() ||
    !form.date ||
    !form.location.trim() ||
    !form.organizer_name.trim() ||
    !form.organizer_email.trim()
  ) {
    toast.error("Bitte alle Pflichtfelder ausfüllen.");
    return;
  }

  // 🔥 Email Format prüfen
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.organizer_email)) {
    toast.error("Bitte eine gültige E-Mail-Adresse eingeben.");
    return;
  }

  setSaving(true);

  try {
    await base44.entities.Event.update(event.id, form);

    queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    queryClient.invalidateQueries({ queryKey: ["events"] });

    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  } catch {
    toast.error("Fehler beim Speichern");
  }

  setSaving(false);
};

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange("cover_image_url", file_url);
      handleChange("cover_video_url", "");
      toast.success("Bild hochgeladen");
    } catch {
      toast.error("Upload fehlgeschlagen");
    }

    setUploadingImage(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange("cover_video_url", file_url);
      handleChange("cover_image_url", "");
      toast.success("Video hochgeladen");
    } catch {
      toast.error("Upload fehlgeschlagen");
    }

    setUploadingVideo(false);
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
        <Loader2 className="w-6 h-6 animate-spin text-[#beff00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10 bg-[#070707]">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          
          <div className="mb-8">
            <Link
              to={createPageUrl(`Dashboard?event_id=${eventId}`)}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 text-[#444] hover:text-[#beff00]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>

            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">
                {event?.name || "Veranstaltungsinfos"}
              </h1>

              <a
                href={createPageUrl(`EventDetails?event_id=${eventId}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#0d1a00] text-[#beff00] border border-[#1a2e00]"
              >
                <Link2 className="w-3.5 h-3.5" />
                Zur Veranstaltung
              </a>
            </div>
          </div>

          <div className="rounded-2xl p-6 space-y-5 bg-[#0d0d0d] border border-[#1a1a1a]">

            <input style={darkInput} value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Event Name" />
            <input style={darkInput} value={form.subtitle} onChange={(e) => handleChange("subtitle", e.target.value)} placeholder="Untertitel" />
            <textarea style={{ ...darkInput, resize: "vertical" }} rows={4} value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Beschreibung" />

            <div className="grid grid-cols-2 gap-4">
              <input type="date" style={{ ...darkInput, colorScheme: "dark" }} value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
              <input style={darkInput} value={form.time} onChange={(e) => handleChange("time", e.target.value)} placeholder="19:00" />
            </div>

            <input style={darkInput} value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="Location" />

            {/* Cover Media */}
            <div className="space-y-4 pt-4 border-t border-[#141414]">

              {form.cover_image_url && (
                <div className="relative h-48 rounded-xl overflow-hidden border border-[#1e1e1e]">
                  <img src={form.cover_image_url} className="w-full h-full object-cover" />
                  <button onClick={() => handleChange("cover_image_url", "")} className="absolute top-2 right-2 bg-black/60 p-1 rounded-full">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              {form.cover_video_url && (
                <div className="relative h-48 rounded-xl overflow-hidden border border-[#1e1e1e]">
                  <video src={form.cover_video_url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                  <button onClick={() => handleChange("cover_video_url", "")} className="absolute top-2 right-2 bg-black/60 p-1 rounded-full">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              {!form.cover_image_url && !form.cover_video_url && (
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-[#1e1e1e] rounded-xl cursor-pointer hover:border-[#beff00] transition">
                    {uploadingImage ? <Loader2 className="animate-spin w-5 h-5 text-[#beff00]" /> : <><ImageIcon className="w-6 h-6 text-[#444]" /><span className="text-xs text-[#555] mt-1">Bild</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>

                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-[#1e1e1e] rounded-xl cursor-pointer hover:border-[#beff00] transition">
                    {uploadingVideo ? <Loader2 className="animate-spin w-5 h-5 text-[#beff00]" /> : <><Video className="w-6 h-6 text-[#444]" /><span className="text-xs text-[#555] mt-1">Video</span></>}
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  </label>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#141414] space-y-4">
              <input style={darkInput} value={form.organizer_name} onChange={(e) => handleChange("organizer_name", e.target.value)} placeholder="Veranstalter Name" />
              <input type="email" style={darkInput} value={form.organizer_email} onChange={(e) => handleChange("organizer_email", e.target.value)} placeholder="Veranstalter E-Mail" />
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold uppercase transition disabled:opacity-50 bg-[#beff00] text-black">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <><CheckCircle className="w-4 h-4" />Gespeichert!</> : <><Save className="w-4 h-4" />Speichern</>}
            </button>

          </div>
        </motion.div>
      </div>
    </div>
  );
}