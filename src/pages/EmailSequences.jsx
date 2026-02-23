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

  const di = { background:"#111", border:"1px solid #1e1e1e", borderRadius:"10px", color:"#fff", padding:"10px 14px", fontSize:"13px", width:"100%", outline:"none" };
  const onF = e => e.target.style.borderColor="#beff00";
  const onB = e => e.target.style.borderColor="#1e1e1e";

  const iconBg = { Mail:"#0a0f1a", Clock:"#1a1500", PartyPopper:"#0a1a0d" };
  const iconColor = { Mail:"#60a5fa", Clock:"#f59e0b", PartyPopper:"#34d399" };

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="rounded-2xl overflow-hidden" style={{background:"#0d0d0d",border:"1px solid #1a1a1a"}}>
      <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:"1px solid #141414"}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:iconBg[Icon.displayName]||"#111"}}>
            <Icon className="w-5 h-5" style={{color:iconColor[Icon.displayName]||"#beff00"}} />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{type.label}</p>
            <p className="text-xs" style={{color:"#444"}}>{type.description}</p>
          </div>
        </div>
        <Switch checked={form.enabled} onCheckedChange={v=>setForm(f=>({...f,enabled:v}))} />
      </div>

      <div className={`p-6 space-y-5 transition-opacity ${!form.enabled?"opacity-30 pointer-events-none":""}`}>
        {type.trigger !== "on_registration" && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{background:"#111",border:"1px solid #1a1a1a"}}>
            <CalendarCheck className="w-4 h-4 flex-shrink-0" style={{color:"#555"}} />
            <span className="text-sm" style={{color:"#555"}}>Versenden</span>
            <input type="number" min="1" max="365" value={form.days_offset}
              onChange={e=>setForm(f=>({...f,days_offset:parseInt(e.target.value)||1}))}
              className="w-14 h-8 text-center text-sm font-bold rounded-lg outline-none"
              style={{background:"#0d0d0d",border:"1px solid #1e1e1e",color:"#beff00"}}
              onFocus={onF} onBlur={onB}
            />
            <span className="text-sm" style={{color:"#555"}}>Tage {type.trigger==="reminder_before"?"vor":"nach"} der Veranstaltung</span>
            {eventDate && (
              <span className="text-xs ml-auto" style={{color:"#333"}}>≈ {(() => { const d=new Date(eventDate); d.setDate(d.getDate()+(type.trigger==="reminder_before"?-form.days_offset:form.days_offset)); return d.toLocaleDateString("de-DE",{day:"numeric",month:"short",year:"numeric"}); })()}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest flex-shrink-0" style={{color:"#444"}}>Empfänger:</span>
          <div className="flex gap-2">
            {[["approved","Freigegebene"],["all","Alle"]].map(([v,l])=>(
              <button key={v} onClick={()=>setForm(f=>({...f,send_to:v}))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={form.send_to===v?{background:"#beff00",color:"#070707"}:{background:"#111",color:"#555",border:"1px solid #1e1e1e"}}
              >{l}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{display:"block",fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#444",marginBottom:"6px"}}>Betreff</label>
          <input style={di} value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} onFocus={onF} onBlur={onB} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#444"}}>Nachricht</label>
            <span style={{fontSize:"11px",color:"#333"}}>{`{{vorname}}`}, {`{{name}}`}, {`{{email}}`}, {`{{kategorie}}`}</span>
          </div>
          <textarea style={{...di,resize:"vertical"}} rows={7} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} onFocus={onF} onBlur={onB} />
        </div>

        <button onClick={()=>setShowPreview(v=>!v)} className="flex items-center gap-2 text-xs transition-colors" style={{color:"#444"}} onMouseEnter={e=>e.currentTarget.style.color="#beff00"} onMouseLeave={e=>e.currentTarget.style.color="#444"}>
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? "Vorschau verbergen" : "E-Mail-Vorschau anzeigen"}
        </button>

        <AnimatePresence>
          {showPreview && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="rounded-xl overflow-hidden" style={{border:"1px solid #1e1e1e"}}>
              <div className="px-5 py-3 flex items-center justify-between" style={{background:"#111",borderBottom:"1px solid #1e1e1e"}}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#444"}}>Vorschau</p>
                <span className="text-xs" style={{color:"#333"}}>Beispiel: Max Mustermann</span>
              </div>
              <div className="p-5" style={{background:"#0a0a0a"}}>
                <div className="space-y-1 pb-3 mb-3" style={{borderBottom:"1px solid #141414"}}>
                  {[["Betreff",form.subject],["An","max@beispiel.de"]].map(([k,v])=>(
                    <div key={k} className="flex gap-2 text-xs"><span className="font-bold w-14" style={{color:"#333"}}>{k}:</span><span style={{color:"#555"}}>{v}</span></div>
                  ))}
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{color:"#666"}}>{previewBody}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
          style={savedOk?{background:"#0d1a00",color:"#beff00",border:"1px solid #1a2e00"}:{background:"#beff00",color:"#070707"}}
          onMouseEnter={e=>{if(!saving&&!savedOk)e.currentTarget.style.boxShadow="0 0 24px rgba(190,255,0,0.4)"}}
          onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
        >
          {saving?<Loader2 className="w-4 h-4 animate-spin"/>:savedOk?<><CheckCircle className="w-4 h-4"/>Gespeichert!</>:<><Save className="w-4 h-4"/>Speichern</>}
        </button>
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
    <div className="min-h-screen p-5 md:p-8" style={{ background:"#070707" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to={createPageUrl(`Settings?event_id=${eventId}`)} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4 transition-colors" style={{color:"#444"}} onMouseEnter={e=>e.currentTarget.style.color="#beff00"} onMouseLeave={e=>e.currentTarget.style.color="#444"}>
            <ArrowLeft className="w-3.5 h-3.5" /> Einstellungen
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">E-Mail-Sequenzen</h1>
          <p className="text-xs mt-0.5 uppercase tracking-widest" style={{color:"#444"}}>Automatische E-Mails für {event?.name}</p>
        </div>

        <div className="space-y-4">
          {SEQUENCE_TYPES.map((type) => (
            <EmailSequenceCard key={type.trigger} type={type} sequence={getSequence(type.trigger)} eventDate={event?.date} onSave={handleSave} />
          ))}
        </div>

        <div className="mt-5 px-5 py-4 rounded-xl" style={{background:"#1a1500",border:"1px solid #2a2000"}}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color:"#f59e0b"}}>Hinweis</p>
          <p className="text-xs leading-relaxed" style={{color:"#8a6000"}}>Erinnerungs- und Dankesmails werden beim Öffnen des Dashboards automatisch ausgelöst.</p>
        </div>
      </div>
    </div>
  );
}