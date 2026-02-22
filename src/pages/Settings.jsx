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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <Link to={createPageUrl(`Dashboard?event_id=${eventId}`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <div className="flex items-center gap-3 mb-1">
              <SettingsIcon className="w-6 h-6 text-slate-400" />
              <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
            </div>
            <p className="text-sm text-slate-500 ml-9">{event?.name}</p>
          </div>

          <div className="space-y-6">
            {/* Event Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5">Veranstaltung</h3>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Name der Veranstaltung</Label>
                    <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="z.B. Gala Abend 2026" className="h-12 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Untertitel</Label>
                    <Input value={form.subtitle} onChange={(e) => handleChange("subtitle", e.target.value)} placeholder="z.B. Die exklusive Networking-Gala" className="h-12 border-slate-200" />
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

                  {/* Cover Image */}
                  <div className="space-y-2">
                    <Label>Titelbild</Label>
                    {form.cover_image_url ? (
                      <div className="space-y-1">
                        <div
                          ref={imageRef}
                          className="relative rounded-xl overflow-hidden border border-slate-200 h-48 cursor-crosshair select-none"
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
                          <button onClick={(e) => { e.stopPropagation(); handleChange("cover_image_url", ""); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 pointer-events-auto">
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
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Registration settings */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5">Registrierung</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Registrierung geöffnet</p>
                    <p className="text-xs text-slate-500 mt-0.5">Ob sich Gäste registrieren können</p>
                  </div>
                  <Switch checked={form.registration_open} onCheckedChange={(checked) => handleChange("registration_open", checked)} />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-slate-900 hover:bg-slate-800 rounded-xl text-base font-medium">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />Speichern</>}
              </Button>
            </div>


          </div>
        </motion.div>
      </div>
    </div>
  );
}