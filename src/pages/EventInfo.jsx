import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  ArrowLeft,
  CheckCircle,
  ImageIcon,
  Video,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EventInfo() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [errors, setErrors] = useState({});
  const didInit = useRef(false);

  const [form, setForm] = useState({
  name: "",
  subtitle: "",
  description: "",
  date: "",
  time: "",
  end_time: "",
  location: "",
  cover_image_url: "",
  cover_video_url: "",
  status: "draft",
  organizer_name: "",
  organizer_email: "",

  // 👇 HIER NEU
  primary_color: "#111111",
  secondary_color: "#ffffff",
  accent_color: "#ff2e63",
  theme_mode: "dark",
});

  const { data: eventArr, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });

  const event = eventArr?.[0];

  useEffect(() => {
    if (event && !didInit.current) {
setForm({
  name: event.name || "",
  subtitle: event.subtitle || "",
  description: event.description || "",
  date: event.date || "",
  time: event.time || "",
  end_time: event.end_time || "",
  location: event.location || "",
  cover_image_url: event.cover_image_url || "",
  cover_video_url: event.cover_video_url || "",
  status: event.status || "draft",
  organizer_name: event.organizer_name || "",
  organizer_email: event.organizer_email || "",

  // 👇 HIER NEU
  primary_color: event.primary_color || "#111111",
  secondary_color: event.secondary_color || "#ffffff",
  accent_color: event.accent_color || "#ff2e63",
  theme_mode: event.theme_mode || "dark",
});
      didInit.current = true;
    }
  }, [event]);

  // ---------------- VALIDATION ----------------

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name ist erforderlich";
    if (!form.date) newErrors.date = "Datum ist erforderlich";
    if (!form.location.trim()) newErrors.location = "Ort ist erforderlich";
    if (!form.end_time) newErrors.end_time = "Endzeit erforderlich";
    if (!form.organizer_name.trim())
      newErrors.organizer_name = "Veranstalter erforderlich";

    if (!form.organizer_email.trim()) {
      newErrors.organizer_email = "E-Mail erforderlich";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.organizer_email)) {
        newErrors.organizer_email = "Ungültige E-Mail";
      }
const eventDate = new Date(form.date);

const startDateTime = new Date(eventDate);
const [startHour, startMinute] = form.time.split(":").map(Number);
startDateTime.setHours(startHour, startMinute, 0, 0);

const endDateTime = new Date(eventDate);
const [endHour, endMinute] = form.end_time.split(":").map(Number);
endDateTime.setHours(endHour, endMinute, 0, 0);

if (endDateTime <= startDateTime) {
  endDateTime.setDate(endDateTime.getDate() + 1);
}
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Bitte Pflichtfelder korrekt ausfüllen.");
      return;
    }

    setSaving(true);

    try {
      await base44.entities.Event.update(event.id, form);
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } catch {
      toast.error("Fehler beim Speichern");
    }

    setSaving(false);
  };

  // ---------------- FILE UPLOAD ----------------

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange("cover_image_url", file_url);
    setUploadingImage(false);
    toast.success("Bild hochgeladen");
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange("cover_video_url", file_url);
    setUploadingVideo(false);
    toast.success("Video hochgeladen");
  };

  // ---------------- STYLES ----------------

  const inputStyle = (field) => ({
    background: "#111",
    border: errors[field] ? "1px solid #ff4d4f" : "1px solid #1e1e1e",
    borderRadius: "10px",
    color: "#fff",
    padding: "10px 14px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  });

  const errorText = (field) =>
    errors[field] && (
      <p style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}>
        {errors[field]}
      </p>
    );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070707]">
        <Loader2 className="w-6 h-6 animate-spin text-[#beff00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-[#070707]">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* BACK */}
          <div className="mb-8">
            <Link
              to={createPageUrl(`Dashboard?event_id=${eventId}`)}
              className="text-xs text-[#444] hover:text-[#beff00]"
            >
              <ArrowLeft className="inline w-4 h-4 mr-1" />
              Dashboard
            </Link>
          </div>

          {/* CARD */}
          <div className="space-y-5 bg-[#0d0d0d] p-6 rounded-2xl border border-[#1a1a1a]">

            {/* BASIC INFO */}
            <input
              style={inputStyle("name")}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Event Name *"
            />
            {errorText("name")}

            <input
  style={inputStyle("subtitle")}
  value={form.subtitle}
  onChange={(e) => handleChange("subtitle", e.target.value)}
  placeholder="Untertitel"
/>

<textarea
  style={{
    ...inputStyle("description"),
    minHeight: "140px",
    resize: "vertical",
    lineHeight: "1.5",
  }}
  value={form.description}
  onChange={(e) => handleChange("description", e.target.value)}
  placeholder="Veranstaltungstext / Beschreibung"
/>
{errorText("description")}

            <input
              type="date"
              style={inputStyle("date")}
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
            />
            {errorText("date")}

            <input
              style={inputStyle("location")}
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Location *"
            />
            {errorText("location")}

            {/* START & END TIME */}
<div className="flex gap-4">
  <div className="flex-1">
    <label className="text-xs text-[#666]">Startzeit</label>
    <input
      type="time"
      style={inputStyle("time")}
      value={form.time}
      onChange={(e) => handleChange("time", e.target.value)}
    />
  </div>

  <div className="flex-1">
    <label className="text-xs text-[#666]">Endzeit</label>
    <input
      type="time"
      style={inputStyle("end_time")}
      value={form.end_time}
      onChange={(e) => handleChange("end_time", e.target.value)}
    />
    {errorText("end_time")}
  </div>
</div>

            {/* COVER IMAGE */}
            <div>
              {form.cover_image_url ? (
                <div className="relative">
                  <img
                    src={form.cover_image_url}
                    className="rounded-xl h-40 w-full object-cover"
                  />
                  <button
                    onClick={() => handleChange("cover_image_url", "")}
                    className="absolute top-2 right-2 bg-black/60 p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-32 border-2 border-dashed border-[#1e1e1e] rounded-xl cursor-pointer hover:border-[#beff00]">
                  {uploadingImage ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="mr-2" /> Bild hochladen
                    </>
                  )}
                  <input type="file" hidden onChange={handleImageUpload} />
                </label>
              )}
            </div>

            {/* COVER VIDEO */}
            <div>
              {form.cover_video_url ? (
                <div className="relative">
                  <video
                    src={form.cover_video_url}
                    className="rounded-xl h-40 w-full object-cover"
                    autoPlay
                    muted
                    loop
                  />
                  <button
                    onClick={() => handleChange("cover_video_url", "")}
                    className="absolute top-2 right-2 bg-black/60 p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-32 border-2 border-dashed border-[#1e1e1e] rounded-xl cursor-pointer hover:border-[#beff00]">
                  {uploadingVideo ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Video className="mr-2" /> Video hochladen
                    </>
                  )}
                  <input type="file" hidden onChange={handleVideoUpload} />
                </label>
              )}
            </div>

            {/* ORGANIZER */}
            <input
              style={inputStyle("organizer_name")}
              value={form.organizer_name}
              onChange={(e) =>
                handleChange("organizer_name", e.target.value)
              }
              placeholder="Veranstalter *"
            />
            {errorText("organizer_name")}

            <input
              type="email"
              style={inputStyle("organizer_email")}
              value={form.organizer_email}
              onChange={(e) =>
                handleChange("organizer_email", e.target.value)
              }
              placeholder="E-Mail *"
            />
           {errorText("organizer_email")}

{/* EVENT DESIGN */}
<div className="pt-6 border-t border-[#1a1a1a] space-y-4">

  <h3 className="text-sm text-[#666] uppercase tracking-wider">
    Event Design
  </h3>

  <div className="flex gap-6">

    <div className="flex flex-col">
      <label className="text-xs text-[#666] mb-1">Primary</label>
      <input
        type="color"
        value={form.primary_color}
        onChange={(e) => handleChange("primary_color", e.target.value)}
        className="w-14 h-10 cursor-pointer"
      />
    </div>

    <div className="flex flex-col">
      <label className="text-xs text-[#666] mb-1">Secondary</label>
      <input
        type="color"
        value={form.secondary_color}
        onChange={(e) => handleChange("secondary_color", e.target.value)}
        className="w-14 h-10 cursor-pointer"
      />
    </div>

    <div className="flex flex-col">
      <label className="text-xs text-[#666] mb-1">Accent</label>
      <input
        type="color"
        value={form.accent_color}
        onChange={(e) => handleChange("accent_color", e.target.value)}
        className="w-14 h-10 cursor-pointer"
      />
    </div>

  </div>

  <select
    value={form.theme_mode}
    onChange={(e) => handleChange("theme_mode", e.target.value)}
    style={inputStyle("theme_mode")}
  >
    <option value="dark">Dark</option>
    <option value="light">Light</option>
  </select>

</div>

{/* SAVE */}
<button
  onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl font-bold uppercase text-black bg-[#beff00]"
            >
              {saving ? (
                <Loader2 className="animate-spin inline w-4 h-4" />
              ) : savedOk ? (
                <>
                  <CheckCircle className="inline w-4 h-4 mr-2" />
                  Gespeichert
                </>
              ) : (
                <>
                  <Save className="inline w-4 h-4 mr-2" />
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