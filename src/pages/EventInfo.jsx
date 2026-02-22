import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Info, ImageIcon, X, ArrowLeft, Euro, Tag, Plus, CheckCircle, Link2, Copy, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EventInfo() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [savingTiersOk, setSavingTiersOk] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = React.useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [form, setForm] = useState({
    name: "", subtitle: "", description: "", date: "", time: "", location: "",
    cover_image_url: "", cover_image_position: "50% 50%",
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



  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <Link to={createPageUrl(`Dashboard?event_id=${eventId}`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <div className="flex items-center gap-3 mb-1 justify-between">
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-slate-400" />
                <h1 className="text-2xl font-bold text-slate-900">
                  {event?.name || "Veranstaltungsinformationen"}
                </h1>
              </div>
              <a href={createPageUrl(`EventDetails?event_id=${eventId}`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-sm font-medium">
                <Link2 className="w-4 h-4" /> Zur Veranstaltung
              </a>
            </div>
          </div>



          <div className="space-y-6">
            {/* Basis-Infos */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-5">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Veranstaltung</h3>

              <div className="space-y-2">
                <Label>Name der Veranstaltung</Label>
                <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="z.B. Gala Abend 2026" className="h-12 border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>Untertitel</Label>
                <Input value={form.subtitle} onChange={(e) => handleChange("subtitle", e.target.value)} placeholder="z.B. Die exklusive Networking-Gala" className="h-12 border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Beschreibung der Veranstaltung…"
                  rows={4}
                  className="w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <Input type="date" value={form.date} onChange={(e) => handleChange("date", e.target.value)} className="h-12 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Uhrzeit</Label>
                  <Input value={form.time} onChange={(e) => handleChange("time", e.target.value)} placeholder="19:00" className="h-12 border-slate-200" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Veranstaltungsort</Label>
                <Input value={form.location} onChange={(e) => handleChange("location", e.target.value)} placeholder="z.B. Hotel Adlon, Berlin" className="h-12 border-slate-200" />
              </div>

              {/* Titelbild */}
              <div className="space-y-2">
                <Label>Titelbild</Label>
                {form.cover_image_url ? (
                  <div className="space-y-1">
                    <div
                      ref={imageRef}
                      className="relative rounded-xl overflow-hidden border border-slate-200 h-48 cursor-crosshair select-none group"
                      onMouseDown={(e) => {
                        setIsDragging(true);
                        const rect = imageRef.current.getBoundingClientRect();
                        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                        handleChange("cover_image_position", `${x}% ${y}%`);
                      }}
                      onMouseMove={(e) => {
                        if (!isDragging) return;
                        const rect = imageRef.current.getBoundingClientRect();
                        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                        handleChange("cover_image_position", `${x}% ${y}%`);
                      }}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseLeave={() => setIsDragging(false)}
                    >
                      <img src={form.cover_image_url} alt="Titelbild" className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: form.cover_image_position }} draggable={false} />
                      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                      {(() => {
                        const [px, py] = (form.cover_image_position || "50% 50%").split(" ").map(v => parseFloat(v));
                        return <div className="absolute w-5 h-5 pointer-events-none" style={{ left: `calc(${px}% - 10px)`, top: `calc(${py}% - 10px)` }}><div className="w-full h-full rounded-full border-2 border-white shadow-lg bg-white/30" /></div>;
                      })()}
                      <Link
                        to={createPageUrl(`GuestList?event_id=${eventId}`)}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto bg-black/20"
                      >
                        <span className="bg-white/90 text-slate-800 text-sm font-medium px-4 py-2 rounded-full shadow">Zum Event</span>
                      </Link>
                      <button onClick={(e) => { e.stopPropagation(); handleChange("cover_image_url", ""); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 pointer-events-auto z-10">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">Klicken oder ziehen, um den Bildausschnitt zu verschieben</p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                    {uploadingImage ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : (<><ImageIcon className="w-8 h-8 text-slate-300 mb-2" /><p className="text-sm text-slate-500">Bild hochladen</p><p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP</p></>)}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Event-Status</Label>
                <div className="flex gap-2">
                  {["draft", "published", "archived"].map((s) => (
                    <button key={s} onClick={() => handleChange("status", s)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${form.status === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                      {s === "draft" ? "Entwurf" : s === "published" ? "Veröffentlicht" : "Archiviert"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Organizer */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="text-sm font-semibold text-slate-700">Veranstalter</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name des Veranstalters</Label>
                    <Input value={form.organizer_name} onChange={(e) => handleChange("organizer_name", e.target.value)} placeholder="z.B. Max Mustermann" className="h-10 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kontakt-E-Mail</Label>
                    <Input type="email" value={form.organizer_email} onChange={(e) => handleChange("organizer_email", e.target.value)} placeholder="kontakt@example.com" className="h-10 border-slate-200" />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className={`w-full h-12 rounded-xl text-base font-medium transition-all ${savedOk ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"}`}>
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : savedOk ? <><CheckCircle className="w-5 h-5 mr-2" />Gespeichert!</> : <><Save className="w-5 h-5 mr-2" />Speichern</>}
              </Button>
              </div>
              </div>
            </motion.div>
            </div>
            </div>
            );
            }