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

  const [tiers, setTiers] = useState([]);
  const [savingTiers, setSavingTiers] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [checkoutQuestions, setCheckoutQuestions] = useState([]);
  const [savingCheckout, setSavingCheckout] = useState(false);

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
      // Load custom checkout questions from custom_questions field
      if (event.custom_questions) {
        setCheckoutQuestions(event.custom_questions.map((q, idx) => ({
          id: idx,
          text: q,
          required: false
        })));
      }
    }
  }, [event]);

  useEffect(() => {
    if (existingTiers?.length) {
      setTiers([...existingTiers].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    }
  }, [existingTiers]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Event.update(event.id, {
      ...form,
      custom_questions: checkoutQuestions.map(q => {
        if (q.type === "dropdown") {
          return `${q.text}||dropdown||${(q.options || []).join("~")}`;
        }
        return q.text;
      })
    });
    queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
    setSaving(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  };

  const addCheckoutQuestion = () => {
    setCheckoutQuestions([...checkoutQuestions, { id: Date.now(), text: "", required: false, type: "text", options: [] }]);
  };

  const updateCheckoutQuestion = (id, field, value) => {
    setCheckoutQuestions(checkoutQuestions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const addCheckoutOption = (questionId) => {
    setCheckoutQuestions(checkoutQuestions.map(q => 
      q.id === questionId ? { ...q, options: [...(q.options || []), ""] } : q
    ));
  };

  const updateCheckoutOption = (questionId, optionIdx, value) => {
    setCheckoutQuestions(checkoutQuestions.map(q => 
      q.id === questionId ? { ...q, options: q.options.map((opt, i) => i === optionIdx ? value : opt) } : q
    ));
  };

  const removeCheckoutOption = (questionId, optionIdx) => {
    setCheckoutQuestions(checkoutQuestions.map(q => 
      q.id === questionId ? { ...q, options: q.options.filter((_, i) => i !== optionIdx) } : q
    ));
  };

  const removeCheckoutQuestion = (id) => {
    setCheckoutQuestions(checkoutQuestions.filter(q => q.id !== id));
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
  const categoryColors = { VIP: "bg-amber-50 text-amber-700", Business: "bg-blue-50 text-blue-700", Presse: "bg-purple-50 text-purple-700", Standard: "bg-slate-50 text-slate-600", Speaker: "bg-emerald-50 text-emerald-700", Sponsor: "bg-pink-50 text-pink-700" };

  const addTier = () => setTiers([...tiers, { _new: true, name: "", description: "", price: 0, color: "Standard", is_visible: true, capacity: "", sort_order: tiers.length }]);

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
    setSavingTiers(true);
    for (let i = 0; i < tiers.length; i++) {
      const tier = { ...tiers[i], event_id: eventId, sort_order: i };
      delete tier._new;
      // Ensure capacity is a number or undefined (not empty string)
      if (tier.capacity === "" || tier.capacity === null) {
        delete tier.capacity;
      } else {
        tier.capacity = Number(tier.capacity);
      }
      if (tier.id) {
        await base44.entities.TicketTier.update(tier.id, tier);
      } else {
        await base44.entities.TicketTier.create(tier);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["tiers", eventId] });
    setSavingTiers(false);
    setSavingTiersOk(true);
    setTimeout(() => setSavingTiersOk(false), 3000);
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
            <div className="flex items-center gap-3 mb-1">
              <Info className="w-6 h-6 text-slate-400" />
              <Link to={createPageUrl(`GuestList?event_id=${eventId}`)} className="text-2xl font-bold text-slate-900 hover:text-slate-600 transition-colors">
                {event?.name || "Veranstaltungsinformationen"}
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200 bg-white rounded-t-2xl px-6 mb-6">
            <button
              onClick={() => setActiveTab("basic")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "basic" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Grundinfos
            </button>
            <button
              onClick={() => setActiveTab("ticketing")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "ticketing" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Ticketing
            </button>
            <button
              onClick={() => setActiveTab("checkout")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "checkout" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Custom Checkout
            </button>
          </div>

          <div className="space-y-6">
            {activeTab === "basic" && (
              <div>
            {/* Veranstaltungsseite Link */}
            {eventId && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="w-5 h-5 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Veranstaltungsseite</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">Link zur öffentlichen Veranstaltungsseite mit allen Informationen.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 font-mono truncate">
                    {`${window.location.origin}${createPageUrl(`EventDetails?event_id=${eventId}`)}`}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${createPageUrl(`EventDetails?event_id=${eventId}`)}`);
                      toast.success("Link kopiert!");
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    Kopieren
                  </Button>
                </div>
              </div>
            )}

            {/* Registrierungslink */}
            {eventId && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="w-5 h-5 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Registrierungslink</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">Diesen Link an Ihre Gäste weitergeben, damit diese sich registrieren können.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 font-mono truncate">
                    {`${window.location.origin}/register?event_id=${eventId}`}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/register?event_id=${eventId}`);
                      toast.success("Link kopiert!");
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    Kopieren
                  </Button>
                </div>
              </div>
            )}

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
              )}

              {activeTab === "ticketing" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Ticketstufen</h3>
                  <Button size="sm" onClick={addTier} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Ticketstufe hinzufügen
                  </Button>
                </div>

                <div className="space-y-3">
                  {tiers.map((tier, idx) => (
                    <div key={tier.id || tier._new} className="border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input value={tier.name} onChange={(e) => updateTier(idx, "name", e.target.value)} placeholder="z.B. Early Bird" className="mt-1 h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Preis ({form.currency})</Label>
                          <Input type="number" value={tier.price || 0} onChange={(e) => updateTier(idx, "price", Number(e.target.value))} className="mt-1 h-9 text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Kapazität (leer = unbegrenzt)</Label>
                          <Input type="number" value={tier.capacity || ""} onChange={(e) => updateTier(idx, "capacity", e.target.value)} placeholder="z.B. 100" className="mt-1 h-9 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Kategorie</Label>
                          <select value={tier.color || "Standard"} onChange={(e) => updateTier(idx, "color", e.target.value)} className="mt-1 w-full h-9 rounded-md border border-slate-200 text-sm px-2">
                            <option value="Standard">Standard</option>
                            <option value="VIP">VIP</option>
                            <option value="Business">Business</option>
                            <option value="Presse">Presse</option>
                            <option value="Speaker">Speaker</option>
                            <option value="Sponsor">Sponsor</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Beschreibung</Label>
                        <Input value={tier.description || ""} onChange={(e) => updateTier(idx, "description", e.target.value)} placeholder="z.B. 20% Rabatt" className="mt-1 h-9 text-sm" />
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <label className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={tier.is_visible !== false} onChange={(e) => updateTier(idx, "is_visible", e.target.checked)} className="rounded" />
                          Sichtbar
                        </label>
                        <Button variant="ghost" size="sm" onClick={() => removeTier(idx)} className="text-red-600 hover:bg-red-50 h-8">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={saveTiers} disabled={savingTiers} className={`w-full h-10 rounded-xl text-sm font-medium transition-all ${savingTiersOk ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"}`}>
                  {savingTiers ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : savingTiersOk ? <>Gespeichert!</> : <>Ticketstufen speichern</>}
                </Button>
              </div>
              )}

              {activeTab === "checkout" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Custom Checkout Fragen</h3>
                    <p className="text-xs text-slate-500 mt-1">Füge individuelle Fragen hinzu, die Gäste während des Checkouts beantworten müssen.</p>
                  </div>
                  <Button size="sm" onClick={addCheckoutQuestion} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Frage hinzufügen
                  </Button>
                </div>

                <div className="space-y-3">
                  {checkoutQuestions.map((question) => (
                    <div key={question.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <Label className="text-xs">Frage</Label>
                          <Input 
                            value={question.text} 
                            onChange={(e) => updateCheckoutQuestion(question.id, "text", e.target.value)} 
                            placeholder="z.B. Diätische Anforderungen?" 
                            className="mt-1 h-9 text-sm" 
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-xs">Typ</Label>
                          <select 
                            value={question.type || "text"} 
                            onChange={(e) => updateCheckoutQuestion(question.id, "type", e.target.value)} 
                            className="mt-1 w-full h-9 rounded-md border border-slate-200 text-sm px-2"
                          >
                            <option value="text">Textfeld</option>
                            <option value="dropdown">Dropdown</option>
                          </select>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeCheckoutQuestion(question.id)} className="text-red-600 hover:bg-red-50 h-8 mt-6">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {question.type === "dropdown" && (
                        <div className="border-t border-slate-200 pt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Optionen</Label>
                            <Button size="sm" variant="ghost" onClick={() => addCheckoutOption(question.id)} className="h-6 text-xs">
                              <Plus className="w-3 h-3 mr-1" />
                              Option hinzufügen
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {(question.options || []).map((option, optIdx) => (
                              <div key={optIdx} className="flex gap-2">
                                <Input 
                                  value={option} 
                                  onChange={(e) => updateCheckoutOption(question.id, optIdx, e.target.value)} 
                                  placeholder="z.B. Vegetarisch" 
                                  className="h-8 text-xs" 
                                />
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeCheckoutOption(question.id, optIdx)} 
                                  className="text-red-600 hover:bg-red-50 h-8"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <label className="flex items-center gap-2 text-xs">
                        <input 
                          type="checkbox" 
                          checked={question.required || false} 
                          onChange={(e) => updateCheckoutQuestion(question.id, "required", e.target.checked)} 
                          className="rounded" 
                        />
                        Pflichtfeld
                      </label>
                    </div>
                  ))}
                </div>

                {checkoutQuestions.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">Keine Fragen hinzugefügt</p>
                  </div>
                )}

                <Button onClick={handleSave} disabled={saving} className={`w-full h-10 rounded-xl text-sm font-medium transition-all ${savedOk ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"}`}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : savedOk ? <>Gespeichert!</> : <>Checkout Fragen speichern</>}
                </Button>
                </div>
                )}
                </div>
                </motion.div>
                </div>
                </div>
                );
                }