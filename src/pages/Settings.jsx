import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Settings as SettingsIcon, Plus, X, Upload, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    event_name: "",
    event_subtitle: "",
    event_date: "",
    event_time: "",
    event_location: "",
    cover_image_url: "",
    cover_image_position: "50% 50%",
    custom_questions: [""],
    invitation_options: [],
    registration_open: true,
  });
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = React.useRef(null);

  const { data: settingsArr, isLoading } = useQuery({
    queryKey: ["eventSettings"],
    queryFn: () => base44.entities.EventSettings.list(),
    initialData: [],
  });

  const existingSettings = settingsArr?.[0];

  useEffect(() => {
    if (existingSettings) {
      setForm({
        event_name: existingSettings.event_name || "",
        event_subtitle: existingSettings.event_subtitle || "",
        event_date: existingSettings.event_date || "",
        event_time: existingSettings.event_time || "",
        event_location: existingSettings.event_location || "",
        cover_image_url: existingSettings.cover_image_url || "",
        custom_questions: existingSettings.custom_questions?.length ? existingSettings.custom_questions : [""],
        invitation_options: existingSettings.invitation_options || [],
        registration_open: existingSettings.registration_open !== false,
      });
    }
  }, [existingSettings]);

  const handleSave = async () => {
    setSaving(true);
    // Remove empty questions before saving
    const cleanedForm = {
      ...form,
      custom_questions: form.custom_questions.filter((q) => q.trim() !== ""),
    };
    if (existingSettings) {
      await base44.entities.EventSettings.update(existingSettings.id, cleanedForm);
    } else {
      await base44.entities.EventSettings.create(cleanedForm);
    }
    queryClient.invalidateQueries({ queryKey: ["eventSettings"] });
    toast.success("Einstellungen gespeichert");
    setSaving(false);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (idx, value) => {
    const updated = [...form.custom_questions];
    updated[idx] = value;
    // Auto-add new empty field when last one is filled
    if (idx === updated.length - 1 && value.trim() !== "") {
      updated.push("");
    }
    setForm((prev) => ({ ...prev, custom_questions: updated }));
  };

  const removeQuestion = (idx) => {
    const updated = form.custom_questions.filter((_, i) => i !== idx);
    if (updated.length === 0) updated.push("");
    setForm((prev) => ({ ...prev, custom_questions: updated }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange("cover_image_url", file_url);
    setUploadingImage(false);
    toast.success("Bild hochgeladen");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <SettingsIcon className="w-6 h-6 text-slate-400" />
              <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
            </div>
            <p className="text-sm text-slate-500 ml-9">
              Veranstaltungsdaten und Registrierungseinstellungen
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-8">
            {/* Event Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5">
                Veranstaltung
              </h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Name der Veranstaltung</Label>
                  <Input
                    value={form.event_name}
                    onChange={(e) => handleChange("event_name", e.target.value)}
                    placeholder="z.B. Gala Abend 2026"
                    className="h-12 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Subheadline / Untertitel</Label>
                  <Input
                    value={form.event_subtitle}
                    onChange={(e) => handleChange("event_subtitle", e.target.value)}
                    placeholder="z.B. Die exklusive Networking-Gala"
                    className="h-12 border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Datum</Label>
                    <Input
                      type="date"
                      value={form.event_date}
                      onChange={(e) => handleChange("event_date", e.target.value)}
                      className="h-12 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Uhrzeit</Label>
                    <Input
                      value={form.event_time}
                      onChange={(e) => handleChange("event_time", e.target.value)}
                      placeholder="19:00"
                      className="h-12 border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Veranstaltungsort</Label>
                  <Input
                    value={form.event_location}
                    onChange={(e) => handleChange("event_location", e.target.value)}
                    placeholder="z.B. Hotel Adlon, Berlin"
                    className="h-12 border-slate-200"
                  />
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Titelbild</Label>
                  {form.cover_image_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 h-40">
                      <img
                        src={form.cover_image_url}
                        alt="Titelbild"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30" />
                      <button
                        onClick={() => handleChange("cover_image_url", "")}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="absolute bottom-2 left-3 text-white text-xs opacity-70">Vorschau mit Abdunklung</p>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-sm text-slate-500">Bild hochladen</p>
                          <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Custom Questions */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-1">
                Individuelle Fragen
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Neue Frage erscheint automatisch, wenn die letzte ausgefüllt wird.
              </p>
              <div className="space-y-2">
                {form.custom_questions.map((q, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={q}
                      onChange={(e) => handleQuestionChange(idx, e.target.value)}
                      placeholder={`Frage ${idx + 1}`}
                      className="h-10 border-slate-200 text-sm"
                    />
                    {form.custom_questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => removeQuestion(idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Invitation Options */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-1">
                Einladende Personen (Dropdown)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Diese Namen erscheinen im Formular unter "Wer hat Sie eingeladen?".
              </p>
              <div className="space-y-2 mb-3">
                {(form.invitation_options || []).map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const updated = [...form.invitation_options];
                        updated[idx] = e.target.value;
                        handleChange("invitation_options", updated);
                      }}
                      className="h-10 border-slate-200 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      onClick={() => {
                        const updated = form.invitation_options.filter((_, i) => i !== idx);
                        handleChange("invitation_options", updated);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-sm border-dashed"
                onClick={() => handleChange("invitation_options", [...(form.invitation_options || []), ""])}
              >
                <Plus className="w-4 h-4 mr-1" />
                Name hinzufügen
              </Button>
            </div>

            <div className="border-t border-slate-100" />

            {/* Registration Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Registrierung geöffnet</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bestimmt, ob sich Gäste registrieren können
                </p>
              </div>
              <Switch
                checked={form.registration_open}
                onCheckedChange={(checked) => handleChange("registration_open", checked)}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 rounded-xl text-base font-medium"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Speichern
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}