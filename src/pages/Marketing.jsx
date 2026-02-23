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

  const di = { background:"#111", border:"1px solid #1e1e1e", borderRadius:"10px", color:"#fff", padding:"10px 14px", fontSize:"14px", width:"100%", outline:"none" };
  const onF = e => e.target.style.borderColor="#beff00";
  const onB = e => e.target.style.borderColor="#1e1e1e";
  const DI = ({ label, hint, children }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#444" }}>{label}</label>
        {hint && <span style={{ fontSize:"11px", color:"#333" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background:"#070707" }}>
      <div className="max-w-3xl mx-auto space-y-5">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Marketing</h1>
            <p className="text-xs mt-0.5 uppercase tracking-widest" style={{color:"#444"}}>Custom-E-Mail an Teilnehmer versenden</p>
          </div>

          <div className="rounded-2xl p-6 space-y-5" style={{background:"#0d0d0d",border:"1px solid #1a1a1a"}}>
            <DI label="Empfänger">
              <select style={{...di,cursor:"pointer"}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} onFocus={onF} onBlur={onB}>
                <option value="approved" style={{background:"#111"}}>Nur Freigegebene</option>
                <option value="pending" style={{background:"#111"}}>Nur Ausstehende</option>
                <option value="rejected" style={{background:"#111"}}>Nur Abgelehnte</option>
                <option value="all" style={{background:"#111"}}>Alle Registrierungen</option>
              </select>
              <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-xl" style={{background:"#111",border:"1px solid #1a1a1a"}}>
                <Users className="w-3.5 h-3.5" style={{color:"#beff00"}} />
                <span className="text-sm" style={{color:"#555"}}><strong className="text-white">{recipients.length}</strong> Empfänger ausgewählt</span>
              </div>
            </DI>

            <DI label="Betreff">
              <input style={di} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="z.B. Wichtige Informationen zur Veranstaltung" onFocus={onF} onBlur={onB} />
            </DI>

            <DI label="Nachricht" hint={`{{name}}, {{vorname}}, {{email}}, {{kategorie}}`}>
              <textarea style={{...di,resize:"vertical"}} rows={10} value={body} onChange={e=>setBody(e.target.value)} placeholder={`Hallo {{vorname}},\n\nwir freuen uns, dich bald begrüßen zu dürfen!`} onFocus={onF} onBlur={onB} />
            </DI>

            {body && (
              <div className="rounded-xl overflow-hidden" style={{border:"1px solid #1e1e1e"}}>
                <div className="px-5 py-3 flex items-center justify-between" style={{background:"#111",borderBottom:"1px solid #1e1e1e"}}>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#444"}}>E-Mail Vorschau</p>
                  <span className="text-xs" style={{color:"#333"}}>Beispiel: Max Mustermann</span>
                </div>
                <div className="p-5" style={{background:"#0a0a0a"}}>
                  <div className="pb-3 mb-3 space-y-1" style={{borderBottom:"1px solid #141414"}}>
                    {[["An","max@beispiel.de"],["Betreff",subject||"—"]].map(([k,v])=>(
                      <div key={k} className="flex gap-2 text-xs"><span className="font-bold w-14" style={{color:"#333"}}>{k}:</span><span style={{color:"#555"}}>{v}</span></div>
                    ))}
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{color:"#666"}}>
                    {body.replace(/\{\{vorname\}\}/gi,"Max").replace(/\{\{nachname\}\}/gi,"Mustermann").replace(/\{\{name\}\}/gi,"Max Mustermann").replace(/\{\{email\}\}/gi,"max@beispiel.de").replace(/\{\{kategorie\}\}/gi,"VIP")}
                  </p>
                </div>
              </div>
            )}

            {sentCount !== null && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{background:"#0d1a00",color:"#beff00",border:"1px solid #1a2e00"}}>
                <CheckCircle2 className="w-4 h-4" /> {sentCount} E-Mails erfolgreich versendet
              </div>
            )}

            <button onClick={handleSend} disabled={sending||recipients.length===0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-40"
              style={{background:"#beff00",color:"#070707"}}
              onMouseEnter={e=>{if(!sending&&recipients.length>0)e.currentTarget.style.boxShadow="0 0 24px rgba(190,255,0,0.4)"}}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
            >
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird gesendet...</> : <><Send className="w-4 h-4" /> An {recipients.length} Empfänger senden</>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}