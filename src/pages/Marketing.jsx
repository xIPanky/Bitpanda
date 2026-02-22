import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Loader2, Mail, Users, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Marketing() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filterStatus, setFilterStatus] = useState("approved");
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const { data: registrations } = useQuery({
    queryKey: ["registrations", eventId],
    queryFn: () => eventId
      ? base44.entities.Registration.filter({ event_id: eventId }, "-created_date")
      : base44.entities.Registration.list("-created_date"),
    initialData: [],
  });

  const { data: eventSettingsArr } = useQuery({
    queryKey: ["eventSettings"],
    queryFn: () => base44.entities.EventSettings.list(),
    initialData: [],
  });
  const eventSettings = eventSettingsArr?.[0] || {};

  const recipients = registrations.filter((r) =>
    filterStatus === "all" ? true : r.status === filterStatus
  );

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Bitte Betreff und Nachricht ausfüllen.");
      return;
    }
    if (recipients.length === 0) {
      toast.error("Keine Empfänger gefunden.");
      return;
    }
    setSending(true);
    let count = 0;
    for (const reg of recipients) {
      const personalBody = body
        .replace(/\{\{vorname\}\}/gi, reg.first_name || "")
        .replace(/\{\{nachname\}\}/gi, reg.last_name || "")
        .replace(/\{\{name\}\}/gi, `${reg.first_name || ""} ${reg.last_name || ""}`.trim())
        .replace(/\{\{email\}\}/gi, reg.email || "")
        .replace(/\{\{kategorie\}\}/gi, reg.category || "Standard");

      await base44.integrations.Core.SendEmail({
        to: reg.email,
        subject,
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            ${personalBody.replace(/\n/g, "<br/>")}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">${eventSettings.event_name || ""}</p>
          </div>
        `,
      });
      count++;
    }
    setSentCount(count);
    setSending(false);
    toast.success(`${count} E-Mails erfolgreich versendet!`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <Mail className="w-6 h-6 text-slate-400" />
              <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
            </div>
            <p className="text-sm text-slate-500 ml-9">Custom-E-Mail an Teilnehmer versenden</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
            {/* Empfänger */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Empfänger</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-11 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Nur Freigegebene</SelectItem>
                  <SelectItem value="pending">Nur Ausstehende</SelectItem>
                  <SelectItem value="rejected">Nur Abgelehnte</SelectItem>
                  <SelectItem value="all">Alle Registrierungen</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span><strong className="text-slate-900">{recipients.length}</strong> Empfänger ausgewählt</span>
              </div>
            </div>

            {/* Betreff */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Betreff</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="z.B. Wichtige Informationen zur Veranstaltung"
                className="h-11 border-slate-200"
              />
            </div>

            {/* Nachricht */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Nachricht</Label>
                <span className="text-xs text-slate-400">Platzhalter: {`{{name}}`}, {`{{vorname}}`}, {`{{nachname}}`}, {`{{email}}`}, {`{{kategorie}}`}</span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                placeholder={`Hallo {{vorname}},\n\nwir freuen uns, Sie bald bei ${eventSettings.event_name || "unserer Veranstaltung"} begrüßen zu dürfen!\n\nMit freundlichen Grüßen,\nIhr Team`}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-y min-h-[200px]"
              />
              <p className="text-xs text-slate-400">Platzhalter werden automatisch durch die Daten des jeweiligen Empfängers ersetzt.</p>
            </div>

            {/* Preview */}
            {body && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Vorschau (Beispiel)</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {body
                    .replace(/\{\{vorname\}\}/gi, "Max")
                    .replace(/\{\{nachname\}\}/gi, "Mustermann")
                    .replace(/\{\{name\}\}/gi, "Max Mustermann")
                    .replace(/\{\{email\}\}/gi, "max@beispiel.de")
                    .replace(/\{\{kategorie\}\}/gi, "VIP")}
                </p>
              </div>
            )}

            {sentCount !== null && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {sentCount} E-Mails erfolgreich versendet
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={sending || recipients.length === 0}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 rounded-xl text-base font-medium"
            >
              {sending ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Wird gesendet...</>
              ) : (
                <><Send className="w-5 h-5 mr-2" /> An {recipients.length} Empfänger senden</>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}