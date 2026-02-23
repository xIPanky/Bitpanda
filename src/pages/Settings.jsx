import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Loader2, Settings as SettingsIcon, Plus, X, ImageIcon, ArrowLeft, Euro, Tag, ChevronUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Settings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = React.useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [form, setForm] = useState({
    name: "", subtitle: "", date: "", time: "", location: "",
    cover_image_url: "", cover_image_position: "50% 50%",
    is_paid: false, currency: "EUR",
    custom_questions: [""], invitation_options: [], registration_open: true,
    status: "draft",
  });

  const [tiers, setTiers] = useState([]);
  const [savingTier, setSavingTier] = useState(false);

  const { data: eventArr, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });
  const event = eventArr?.[0];

  const { data: existingTiers } = useQuery({
    queryKey: ["tiers", eventId],
    queryFn: () => base44.entities.TicketTier.filter({ event_id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name || "",
        subtitle: event.subtitle || "",
        date: event.date || "",
        time: event.time || "",
        location: event.location || "",
        cover_image_url: event.cover_image_url || "",
        cover_image_position: event.cover_image_position || "50% 50%",
        is_paid: event.is_paid || false,
        currency: event.currency || "EUR",
        custom_questions: event.custom_questions?.length ? event.custom_questions : [""],
        invitation_options: event.invitation_options || [],
        registration_open: event.registration_open !== false,
        status: event.status || "draft",
      });
    }
  }, [event]);

  useEffect(() => {
    if (existingTiers?.length) {
      setTiers(existingTiers.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    }
  }, [existingTiers]);

  const handleSave = async () => {
    setSaving(true);
    const cleanedForm = { ...form, custom_questions: form.custom_questions.filter((q) => q.trim() !== "") };
    if (event) {
      await base44.entities.Event.update(event.id, cleanedForm);
    }
    queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
    toast.success("Einstellungen gespeichert");
    setSaving(false);
  };

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleQuestionChange = (idx, value) => {
    const updated = [...form.custom_questions];
    updated[idx] = value;
    if (idx === updated.length - 1 && value.trim() !== "") updated.push("");
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

  // Tier management
  const addTier = () => {
    setTiers([...tiers, { _new: true, name: "", description: "", price: 0, color: "Standard", is_visible: true, capacity: "", sort_order: tiers.length }]);
  };

  const updateTier = (idx, field, value) => {
    const updated = [...tiers];
    updated[idx] = { ...updated[idx], [field]: value };
    setTiers(updated);
  };

  const removeTier = async (idx) => {
    const tier = tiers[idx];
    if (tier.id) await base44.entities.TicketTier.delete(tier.id);
    setTiers(tiers.filter((_, i) => i !== idx));
    queryClient.invalidateQueries({ queryKey: ["tiers", eventId] });
  };

  const saveTiers = async () => {
    setSavingTier(true);
    for (let i = 0; i < tiers.length; i++) {
      const tier = { ...tiers[i], event_id: eventId, sort_order: i };
      delete tier._new;
      if (tier.id) {
        await base44.entities.TicketTier.update(tier.id, tier);
      } else {
        await base44.entities.TicketTier.create(tier);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["tiers", eventId] });
    toast.success("Ticketstufen gespeichert");
    setSavingTier(false);
  };

  const categoryColors = { VIP: "bg-amber-50 text-amber-700", Business: "bg-blue-50 text-blue-700", Presse: "bg-purple-50 text-purple-700", Standard: "bg-slate-50 text-slate-600", Speaker: "bg-emerald-50 text-emerald-700", Sponsor: "bg-pink-50 text-pink-700" };

  const DI = ({ label, children }) => (
    <div>
      <label style={{ display:"block", fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#444", marginBottom:"8px" }}>{label}</label>
      {children}
    </div>
  );
  const di = { background:"#111", border:"1px solid #1e1e1e", borderRadius:"10px", color:"#fff", padding:"10px 14px", fontSize:"14px", width:"100%", outline:"none" };
  const onF = e => { e.target.style.borderColor="#beff00"; };
  const onB = e => { e.target.style.borderColor="#1e1e1e"; };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background:"#070707" }}><Loader2 className="w-6 h-6 animate-spin" style={{color:"#333"}} /></div>;

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background:"#070707" }}>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <div className="mb-8">
            <Link to={createPageUrl(`Dashboard?event_id=${eventId}`)} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4 transition-colors" style={{color:"#444"}} onMouseEnter={e=>e.currentTarget.style.color="#beff00"} onMouseLeave={e=>e.currentTarget.style.color="#444"}>
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">Einstellungen</h1>
            <p className="text-xs mt-0.5 uppercase tracking-widest" style={{color:"#444"}}>{event?.name}</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl p-6 space-y-5" style={{ background:"#0d0d0d", border:"1px solid #1a1a1a" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#333"}}>Veranstaltung</p>
              <DI label="Name"><input style={di} value={form.name} onChange={e=>handleChange("name",e.target.value)} placeholder="z.B. Gala Abend 2026" onFocus={onF} onBlur={onB} /></DI>
              <DI label="Untertitel"><input style={di} value={form.subtitle} onChange={e=>handleChange("subtitle",e.target.value)} placeholder="Subheadline" onFocus={onF} onBlur={onB} /></DI>
              <div className="grid grid-cols-2 gap-4">
                <DI label="Datum"><input type="date" style={{...di,colorScheme:"dark"}} value={form.date} onChange={e=>handleChange("date",e.target.value)} onFocus={onF} onBlur={onB} /></DI>
                <DI label="Uhrzeit"><input style={di} value={form.time} onChange={e=>handleChange("time",e.target.value)} placeholder="19:00" onFocus={onF} onBlur={onB} /></DI>
              </div>
              <DI label="Veranstaltungsort"><input style={di} value={form.location} onChange={e=>handleChange("location",e.target.value)} placeholder="Hotel Adlon, Berlin" onFocus={onF} onBlur={onB} /></DI>

              <DI label="Titelbild">
                {form.cover_image_url ? (
                  <div>
                    <div ref={imageRef} className="relative rounded-xl overflow-hidden h-40 cursor-crosshair select-none" style={{border:"1px solid #1e1e1e"}}
                      onMouseDown={e=>{setIsDragging(true);const r=imageRef.current.getBoundingClientRect();handleChange("cover_image_position",`${Math.round(((e.clientX-r.left)/r.width)*100)}% ${Math.round(((e.clientY-r.top)/r.height)*100)}%`);}}
                      onMouseMove={e=>{if(!isDragging)return;const r=imageRef.current.getBoundingClientRect();handleChange("cover_image_position",`${Math.round(((e.clientX-r.left)/r.width)*100)}% ${Math.round(((e.clientY-r.top)/r.height)*100)}%`);}}
                      onMouseUp={()=>setIsDragging(false)} onMouseLeave={()=>setIsDragging(false)}
                    >
                      <img src={form.cover_image_url} className="w-full h-full object-cover pointer-events-none" style={{objectPosition:form.cover_image_position}} draggable={false} />
                      <button onClick={e=>{e.stopPropagation();handleChange("cover_image_url","");}} className="absolute top-2 right-2 rounded-full p-1" style={{background:"rgba(0,0,0,0.6)",color:"#fff"}}><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 rounded-xl cursor-pointer transition-all" style={{border:"2px dashed #1e1e1e"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#beff00"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e1e"}>
                    {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" style={{color:"#333"}} /> : <><ImageIcon className="w-7 h-7 mb-2" style={{color:"#2a2a2a"}} /><p className="text-sm" style={{color:"#444"}}>Bild hochladen</p></>}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </DI>

              <DI label="Event-Status">
                <div className="flex gap-2">
                  {[["draft","Entwurf"],["published","Veröffentlicht"],["archived","Archiviert"]].map(([s,l])=>(
                    <button key={s} onClick={()=>handleChange("status",s)} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                      style={form.status===s?{background:"#beff00",color:"#070707"}:{background:"#111",color:"#444",border:"1px solid #1e1e1e"}}
                    >{l}</button>
                  ))}
                </div>
              </DI>
            </div>

            <div className="rounded-2xl p-6 space-y-4" style={{ background:"#0d0d0d", border:"1px solid #1a1a1a" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#333"}}>Registrierung</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Registrierung geöffnet</p>
                  <p className="text-xs mt-0.5" style={{color:"#444"}}>Ob sich Gäste registrieren können</p>
                </div>
                <Switch checked={form.registration_open} onCheckedChange={checked=>handleChange("registration_open",checked)} />
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              style={{background:"#beff00",color:"#070707"}}
              onMouseEnter={e=>{if(!saving)e.currentTarget.style.boxShadow="0 0 24px rgba(190,255,0,0.4)"}}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />Speichern</>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}