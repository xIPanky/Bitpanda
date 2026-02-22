import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Save, Loader2, Mail, ArrowLeft, CheckCircle,
  Clock, CalendarCheck, PartyPopper, Eye, EyeOff, Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SEQUENCE_TYPES = [
  {
    trigger: "on_registration",
    icon: Mail,
    label: "Bestätigungsmail",
    description: "Wird automatisch nach jeder Registrierung versendet",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    iconColor: "text-blue-500",
    defaultSubject: "Ihre Registrierung wurde erhalten",
    defaultBody: `Hallo {{vorname}},\n\nvielen Dank für Ihre Registrierung! Wir haben Ihre Anmeldung erhalten und werden sie schnellstmöglich prüfen.\n\nSobald Ihre Registrierung freigegeben wurde, erhalten Sie Ihre Ticket-Bestätigung.\n\nMit freundlichen Grüßen,\nIhr Veranstaltungsteam`,
  },
  {
    trigger: "reminder_before",
    icon: Clock,
    label: "Erinnerungsmail",
    description: "Wird X Tage vor der Veranstaltung versendet",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    iconColor: "text-amber-500",
    defaultSubject: "Erinnerung: Ihre Veranstaltung steht bevor!",
    defaultBody: `Hallo {{vorname}},\n\nnur noch wenige Tage bis zur Veranstaltung! Wir freuen uns, Sie bald begrüßen zu dürfen.\n\nBitte denken Sie daran, Ihr Ticket mitzubringen.\n\nBis bald,\nIhr Veranstaltungsteam`,
  },
  {
    trigger: "post_event",
    icon: PartyPopper,
    label: "Dankesmail",
    description: "Wird X Tage nach der Veranstaltung versendet",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    iconColor: "text-emerald-500",
    defaultSubject: "Vielen Dank für Ihre Teilnahme!",
    defaultBody: `Hallo {{vorname}},\n\nwir möchten uns herzlich für Ihre Teilnahme bedanken! Es war uns eine große Freude, Sie bei unserer Veranstaltung begrüßen zu dürfen.\n\nWir hoffen, es hat Ihnen gefallen und freuen uns, Sie beim nächsten Mal wieder zu sehen.\n\nHerzliche Grüße,\nIhr Veranstaltungsteam`,
  },
];

function EmailSequenceCard({ type, sequence, eventDate, onSave }) {
  const Icon = type.icon;
  const [form, setForm] = useState({
    enabled: true,
    days_offset: type.trigger === "reminder_before" ? 3 : 1,
    subject: type.defaultSubject,
    body: type.defaultBody,
    send_to: "approved",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (sequence) {
      setForm({
        enabled: sequence.enabled !== false,
        days_offset: sequence.days_offset ?? (type.trigger === "reminder_before" ? 3 : 1),
        subject: sequence.subject || type.defaultSubject,
        body: sequence.body || type.defaultBody,
        send_to: sequence.send_to || "approved",
      });
    }
  }, [sequence]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(type.trigger, form, sequence?.id);
    setSaving(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  };

  const previewBody = form.body
    .replace(/\{\{vorname\}\}/gi, "Max")
    .replace(/\{\{nachname\}\}/gi, "Mustermann")
    .replace(/\{\{name\}\}/gi, "Max Mustermann")
    .replace(/\{\{email\}\}/gi, "max@beispiel.de")
    .replace(/\{\{kategorie\}\}/gi, "VIP");

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${type.color} border-opacity-60`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center shadow-sm`}>
            <Icon className={`w-5 h-5 ${type.iconColor}`} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{type.label}</p>
            <p className="text-xs text-slate-500">{type.description}</p>
          </div>
        </div>
        <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
      </div>

      {/* Body */}
      <div className={`p-6 space-y-5 transition-opacity ${!form.enabled ? "opacity-40 pointer-events-none" : ""}`}>
        {/* Days offset (not for on_registration) */}
        {type.trigger !== "on_registration" && (
          <div className="flex items-center gap-4 bg-slate-50 rounded-xl px-5 py-3">
            <CalendarCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-600">
              {type.trigger === "reminder_before" ? "Versenden" : "Versenden"}
            </span>
            <input
              type="number"
              min="1"
              max="365"
              value={form.days_offset}
              onChange={(e) => setForm((f) => ({ ...f, days_offset: parseInt(e.target.value) || 1 }))}
              className="w-16 h-8 text-center text-sm font-semibold border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-600">
              Tage {type.trigger === "reminder_before" ? "vor" : "nach"} der Veranstaltung
            </span>
            {eventDate && (
              <span className="text-xs text-slate-400 ml-auto">
                ≈ {(() => {
                  const d = new Date(eventDate);
                  const offset = type.trigger === "reminder_before" ? -form.days_offset : form.days_offset;
                  d.setDate(d.getDate() + offset);
                  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
                })()}
              </span>
            )}
          </div>
        )}

        {/* Send to */}
        <div className="flex items-center gap-4">
          <Label className="text-sm text-slate-600 shrink-0">Empfänger:</Label>
          <div className="flex gap-2">
            {[{ value: "approved", label: "Nur Freigegebene" }, { value: "all", label: "Alle Registrierungen" }].map((o) => (
              <button
                key={o.value}
                onClick={() => setForm((f) => ({ ...f, send_to: o.value }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.send_to === o.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Betreff</Label>
          <Input
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            className="h-10 border-slate-200 text-sm"
          />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nachricht</Label>
            <span className="text-xs text-slate-400">Platzhalter: {`{{vorname}}`}, {`{{name}}`}, {`{{email}}`}, {`{{kategorie}}`}</span>
          </div>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={7}
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
          />
        </div>

        {/* Preview toggle */}
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? "Vorschau verbergen" : "E-Mail-Vorschau anzeigen"}
        </button>

        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-100 px-5 py-3 flex items-center justify-between border-b border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vorschau</p>
                <span className="text-xs text-slate-400">Beispiel: Max Mustermann</span>
              </div>
              <div className="bg-white p-5">
                <div className="space-y-1 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex gap-2 text-xs text-slate-500">
                    <span className="font-semibold w-14">Betreff:</span>
                    <span className="font-medium text-slate-800">{form.subject}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500">
                    <span className="font-semibold w-14">An:</span>
                    <span>max@beispiel.de</span>
                  </div>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{previewBody}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`w-full h-10 rounded-xl text-sm font-medium transition-all ${savedOk ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <><CheckCircle className="w-4 h-4 mr-2" />Gespeichert!</> : <><Save className="w-4 h-4 mr-2" />Speichern</>}
        </Button>
      </div>
    </motion.div>
  );
}

export default function EmailSequences() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const { data: eventArr } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });
  const event = eventArr?.[0];

  const { data: sequences } = useQuery({
    queryKey: ["email-sequences", eventId],
    queryFn: () => base44.entities.EmailSequence.filter({ event_id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });

  const getSequence = (trigger) => sequences.find((s) => s.trigger === trigger);

  const handleSave = async (trigger, formData, existingId) => {
    const data = { ...formData, event_id: eventId, trigger };
    if (existingId) {
      await base44.entities.EmailSequence.update(existingId, data);
    } else {
      await base44.entities.EmailSequence.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["email-sequences", eventId] });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            to={createPageUrl(`Settings?event_id=${eventId}`)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Einstellungen
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <Mail className="w-6 h-6 text-slate-400" />
            <h1 className="text-2xl font-bold text-slate-900">E-Mail-Sequenzen</h1>
          </div>
          <p className="text-sm text-slate-500 ml-9">Automatische E-Mails für {event?.name}</p>
        </div>

        <div className="space-y-5">
          {SEQUENCE_TYPES.map((type) => (
            <EmailSequenceCard
              key={type.trigger}
              type={type}
              sequence={getSequence(type.trigger)}
              eventDate={event?.date}
              onSave={handleSave}
            />
          ))}
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Hinweis zu automatischen Sendungen</p>
          <p className="text-xs text-amber-600 leading-relaxed">
            Erinnerungs- und Dankesmails werden beim Öffnen des Dashboards automatisch ausgelöst, wenn das entsprechende Datum erreicht wurde.
            Bestätigungsmails werden direkt bei der Freigabe einer Registrierung versendet.
          </p>
        </div>
      </div>
    </div>
  );
}