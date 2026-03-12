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
  Upload,
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
  const [uploadingSponsors, setUploadingSponsors] = useState(false);
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
    sponsor_logo_urls: [],
    status: "draft",
    organizer_name: "",
    organizer_email: "",
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
        sponsor_logo_urls: event.sponsor_logo_urls || [],
        status: event.status || "draft",
        organizer_name: event.organizer_name || "",
        organizer_email: event.organizer_email || "",
        primary_color: event.primary_color || "#111111",
        secondary_color: event.secondary_color || "#ffffff",
        accent_color: event.accent_color || "#ff2e63",
        theme_mode: event.theme_mode || "dark",
      });
      didInit.current = true;
    }
  }, [event]);

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name ist erforderlich";
    if (!form.date) newErrors.date = "Datum ist erforderlich";
    if (!form.time) newErrors.time = "Startzeit ist erforderlich";
    if (!form.end_time) newErrors.end_time = "Endzeit ist erforderlich";
    if (!form.location.trim()) newErrors.location = "Ort ist erforderlich";
    if (!form.organizer_name.trim()) {
      newErrors.organizer_name = "Veranstalter erforderlich";
    }

    if (!form.organizer_email.trim()) {
      newErrors.organizer_email = "E-Mail erforderlich";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.organizer_email)) {
        newErrors.organizer_email = "Ungültige E-Mail";
      }
    }

    if (form.time && form.end_time) {
      const [startHour, startMinute] = form.time.split(":").map(Number);
      const [endHour, endMinute] = form.end_time.split(":").map(Number);

      if (
        Number.isNaN(startHour) ||
        Number.isNaN(startMinute) ||
        Number.isNaN(endHour) ||
        Number.isNaN(endMinute)
      ) {
        newErrors.time = "Ungültige Zeitangabe";
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
      toast.success("Änderungen gespeichert");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange("cover_image_url", file_url);
      toast.success("Bild hochgeladen");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Bild-Upload");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingVideo(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange("cover_video_url", file_url);
      toast.success("Video hochgeladen");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Video-Upload");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSponsorLogosUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setUploadingSponsors(true);

      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }

      handleChange("sponsor_logo_urls", [
        ...(form.sponsor_logo_urls || []),
        ...uploadedUrls,
      ]);

      toast.success("Sponsor-Logos hochgeladen");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Upload der Sponsor-Logos");
    } finally {
      setUploadingSponsors(false);
      e.target.value = "";
    }
  };

  const removeSponsorLogo = (indexToRemove) => {
    handleChange(
      "sponsor_logo_urls",
      (form.sponsor_logo_urls || []).filter((_, index) => index !== indexToRemove)
    );
  };

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
          <div className="mb-8">
            <Link
              to={createPageUrl(`Dashboard?event_id=${eventId}`)}
              className="text-xs text-[#444] hover:text-[#beff00]"
            >
              <ArrowLeft className="inline w-4 h-4 mr-1" />
              Dashboard
            </Link>
          </div>

          <div className="space-y-5 bg-[#0d0d0d] p-6 rounded-2xl border border-[#1a1a1a]">
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

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-[#666]">Startzeit *</label>
                <input
                  type="time"
                  style={inputStyle("time")}
                  value={form.time}
                  onChange={(e) => handleChange("time", e.target.value)}
                />
                {errorText("time")}
              </div>

              <div className="flex-1">
                <label className="text-xs text-[#666]">Endzeit *</label>
                <input
                  type="time"
                  style={inputStyle("end_time")}
                  value={form.end_time}
                  onChange={(e) => handleChange("end_time", e.target.value)}
                />
                {errorText("end_time")}
              </div>
            </div>

            <div>
              {form.cover_image_url ? (
                <div className="relative">
                  <img
                    src={form.cover_image_url}
                    className="rounded-xl h-40 w-full object-cover"
                    alt="Cover"
                  />
                  <button
                    type="button"
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
                    type="button"
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

            {/* SPONSOR LOGOS */}
            <div className="pt-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-[#666] uppercase tracking-wider">
                  Sponsoren-Logos
                </h3>
                <label className="text-xs text-[#beff00] cursor-pointer hover:opacity-80 flex items-center gap-1">
                  {uploadingSponsors ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Logos hinzufügen
                    </>
                  )}
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleSponsorLogosUpload}
                  />
                </label>
              </div>

              {form.sponsor_logo_urls?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.sponsor_logo_urls.map((logoUrl, index) => (
                    <div
                      key={`${logoUrl}-${index}`}
                      className="relative bg-[#111] border border-[#1e1e1e] rounded-xl p-3 h-24 flex items-center justify-center"
                    >
                      <img
                        src={logoUrl}
                        alt={`Sponsor Logo ${index + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => removeSponsorLogo(index)}
                        className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!form.sponsor_logo_urls?.length && (
                <div className="border border-dashed border-[#1e1e1e] rounded-xl p-4 text-sm text-[#555]">
                  Keine Sponsor-Logos hochgeladen. Dieser Bereich bleibt auf der Website automatisch unsichtbar, wenn leer.
                </div>
              )}
            </div>

            <input
              style={inputStyle("organizer_name")}
              value={form.organizer_name}
              onChange={(e) => handleChange("organizer_name", e.target.value)}
              placeholder="Veranstalter *"
            />
            {errorText("organizer_name")}

            <input
              type="email"
              style={inputStyle("organizer_email")}
              value={form.organizer_email}
              onChange={(e) => handleChange("organizer_email", e.target.value)}
              placeholder="E-Mail *"
            />
            {errorText("organizer_email")}

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