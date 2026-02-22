import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Settings as SettingsIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    event_name: "",
    event_subtitle: "",
    event_date: "",
    event_time: "",
    event_location: "",
    custom_question_1: "",
    custom_question_2: "",
    registration_open: true,
  });

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
        event_date: existingSettings.event_date || "",
        event_time: existingSettings.event_time || "",
        event_location: existingSettings.event_location || "",
        custom_question_1: existingSettings.custom_question_1 || "",
        custom_question_2: existingSettings.custom_question_2 || "",
        registration_open: existingSettings.registration_open !== false,
      });
    }
  }, [existingSettings]);

  const handleSave = async () => {
    setSaving(true);
    if (existingSettings) {
      await base44.entities.EventSettings.update(existingSettings.id, form);
    } else {
      await base44.entities.EventSettings.create(form);
    }
    queryClient.invalidateQueries({ queryKey: ["eventSettings"] });
    toast.success("Einstellungen gespeichert");
    setSaving(false);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Custom Questions */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5">
                Individuelle Fragen
              </h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Frage 1</Label>
                  <Input
                    value={form.custom_question_1}
                    onChange={(e) => handleChange("custom_question_1", e.target.value)}
                    placeholder="z.B. Wie haben Sie von uns erfahren?"
                    className="h-12 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Frage 2</Label>
                  <Input
                    value={form.custom_question_2}
                    onChange={(e) => handleChange("custom_question_2", e.target.value)}
                    placeholder="z.B. Welche Themen interessieren Sie?"
                    className="h-12 border-slate-200"
                  />
                </div>
              </div>
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