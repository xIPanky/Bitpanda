import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Info, ImageIcon, X, ArrowLeft, Euro, Tag, Plus, CheckCircle, Link2, Copy, Trash2, Video } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EventInfo() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [savingTiersOk, setSavingTiersOk] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = React.useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [form, setForm] = useState({
    name: "", subtitle: "", description: "", date: "", time: "", location: "",
    cover_image_url: "", cover_image_position: "50% 50%",
    cover_video_url: "",
    is_paid: false, currency: "EUR", status: "draft",
    organizer_name: "", organizer_email: "",
  });



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
        description: event.description || "",
        date: event.date || "",
        time: event.time || "",
        location: event.location || "",
        cover_image_url: event.cover_image_url || "",
        cover_image_position: event.cover_image_position || "50% 50%",
        cover_video_url: event.cover_video_url || "",
        is_paid: event.is_paid || false,
        currency: event.currency || "EUR",
        status: event.status || "draft",
        organizer_name: event.organizer_name || "",
        organizer_email: event.organizer_email || "",
      });
    }
  }, [event]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Event.update(event.id, form);
    queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
    setSaving(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
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

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange("cover_video_url", file_url);
    setUploadingVideo(false);
    toast.success("Video hochgeladen");
  };



  const DI = ({ label, children }) => (
    <div>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#444", marginBottom: "8px" }}>{label}</label>
      {children}
    </div>
  );
  const darkInput = { background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", color: "#fff", padding: "10px 14px", fontSize: "14px", width: "100%", outline: "none" };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#070707" }}><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#333" }} /></div>;

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: "#070707" }}>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <Link to={createPageUrl(`Dashboard?event_id=${eventId}`)} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4 transition-colors" style={{ color: "#444" }} onMouseEnter={e => e.currentTarget.style.color="#beff00"} onMouseLeave={e => e.currentTarget.style.color="#444"}>
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white tracking-tight">{event?.name || "Veranstaltungsinfos"}</h1>
              <a href={createPageUrl(`EventDetails?event_id=${eventId}`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all" style={{ background: "#0d1a00", color: "#beff00", border: "1px solid #1a2e00" }}>
                <Link2 className="w-3.5 h-3.5" /> Zur Veranstaltung
              </a>
            </div>
          </div>

          <div className="rounded-2xl p-6 space-y-5" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#333" }}>Veranstaltung</p>

            <DI label="Name"><input style={darkInput} value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="z.B. Gala Abend 2026" onFocus={e=>{e.target.style.borderColor="#beff00"}} onBlur={e=>{e.target.style.borderColor="#1e1e1e"}} /></DI>
            <DI label="Untertitel"><input style={darkInput} value={form.subtitle} onChange={e => handleChange("subtitle", e.target.value)} placeholder="z.B. Die exklusive Networking-Gala" onFocus={e=>{e.target.style.borderColor="#beff00"}} onBlur={e=>{e.target.style.borderColor="#1e1e1e"}} /></DI>
            <DI label="Beschreibung">
              <textarea style={{ ...darkInput, resize: "vertical" }} rows={4} value={form.description} onChange={e => handleChange("description", e.target.value)} placeholder="Beschreibung der Veranstaltung…" onFocus={e=>{e.target.style.borderColor="#beff00"}} onBlur={e=>{e.target.style.borderColor="#1e1e1e"}} />
            </DI>
            <div className="grid grid-cols-2 gap-4">
              <DI label="Datum"><input type="date" style={{ ...darkInput, colorScheme: "dark" }} value={form.date} onChange={e => handleChange("date", e.target.value)} onFocus={e=>{e.target.style.borderColor="#beff00"}} onBlur={e=>{e.target.style.borderColor="#1e1e1e"}} /></DI>
              <DI label="Uhrzeit"><input style={darkInput} value={form.time} onChange={e => handleChange("time", e.target.value)} placeholder="19:00" onFocus={e=>{e.target.style.borderColor="#beff00"}} onBlur={e=>{e.target.style.borderColor="#1e1e1e"}} /></DI>
            </div>
            <DI label="Veranstaltungsort"><input style={darkInput} value={form.location} onChange={e => handleChange("location", e.target.value)} placeholder="z.B. Hotel Adlon, Berlin" onFocus={e=>{e.target.style.borderColor="#beff00"}} onBlur={e=>{e.target.style.borderColor="#1e1e1e"}} /></DI>

            {/* Cover image */}
            <DI label="Titelbild">
              {form.cover_image_url ? (
                <div>
                  <div ref={imageRef} className="relative rounded-xl overflow-hidden h-48 cursor-crosshair select-none"
                    style={{ border: "1px solid #1e1e1e" }}
                    onMouseDown={e => { setIsDragging(true); const r=imageRef.current.getBoundingClientRect(); handleChange("cover_image_position",`${Math.round(((e.clientX-r.left)/r.width)*100)}% ${Math.round(((e.clientY-r.top)/r.height)*100)}%`); }}
                    onMouseMove={e => { if(!isDragging)return; const r=imageRef.current.getBoundingClientRect(); handleChange("cover_image_position",`${Math.round(((e.clientX-r.left)/r.width)*100)}% ${Math.round(((e.clientY-r.top)/r.height)*100)}%`); }}
                    onMouseUp={()=>setIsDragging(false)} onMouseLeave={()=>setIsDragging(false)}
                  >
                    <img src={form.cover_image_url} alt="Titelbild" className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: form.cover_image_position }} draggable={false} />
                    {(() => { const [px,py]=(form.cover_image_position||"50% 50%").split(" ").map(v=>parseFloat(v)); return <div className="absolute w-5 h-5 pointer-events-none" style={{ left:`calc(${px}% - 10px)`, top:`calc(${py}% - 10px)` }}><div className="w-full h-full rounded-full border-2 border-white shadow-lg" style={{ background:"rgba(190,255,0,0.4)" }} /></div>; })()}
                    <button onClick={e=>{e.stopPropagation();handleChange("cover_image_url","");}} className="absolute top-2 right-2 rounded-full p-1" style={{ background:"rgba(0,0,0,0.6)", color:"#fff" }}><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs mt-1" style={{ color:"#333" }}>Klicken oder ziehen, um Bildausschnitt zu verschieben</p>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 rounded-xl cursor-pointer transition-all" style={{ border:"2px dashed #1e1e1e" }} onMouseEnter={e=>e.currentTarget.style.borderColor="#beff00"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e1e"}>
                  {uploadingImage ? <Loader2 className="w-6 h-6 animate-spin" style={{color:"#333"}} /> : (<><ImageIcon className="w-8 h-8 mb-2" style={{color:"#2a2a2a"}} /><p className="text-sm" style={{color:"#444"}}>Bild hochladen</p></>)}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </DI>

            {/* Status */}
            <DI label="Event-Status">
              <div className="flex gap-2">
                {[["draft","Entwurf"],["published","Veröffentlicht"],["archived","Archiviert"]].map(([s,l]) => (
                  <button key={s} onClick={() => handleChange("status", s)}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    style={form.status===s ? {background:"#beff00",color:"#070707"} : {background:"#111",color:"#444",border:"1px solid #1e1e1e"}}
                  >{l}</button>
                ))}
              </div>
            </DI>

            {/* Organizer */}
            <div className="pt-4 space-y-4" style={{ borderTop:"1px solid #141414" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#333"}}>Veranstalter</p>
              <div className="grid grid-cols-2 gap-4">
                <DI label="Name"><input style={darkInput} value={form.organizer_name} onChange={e=>handleChange("organizer_name",e.target.value)} placeholder="Max Mustermann" onFocus={e=>{e.target.style.borderColor="#beff00"}} onBlur={e=>{e.target.style.borderColor="#1e1e1e"}} /></DI>
                <DI label="Kontakt-E-Mail"><input type="email" style={darkInput} value={form.organizer_email} onChange={e=>handleChange("organizer_email",e.target.value)} placeholder="kontakt@example.com" onFocus={e=>{e.target.style.borderColor="#beff00"}} onBlur={e=>{e.target.style.borderColor="#1e1e1e"}} /></DI>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              style={savedOk ? {background:"#0d1a00",color:"#beff00",border:"1px solid #1a2e00"} : {background:"#beff00",color:"#070707"}}
              onMouseEnter={e=>{if(!saving&&!savedOk)e.currentTarget.style.boxShadow="0 0 24px rgba(190,255,0,0.4)"}}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <><CheckCircle className="w-4 h-4" />Gespeichert!</> : <><Save className="w-4 h-4" />Speichern</>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
            }