import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Loader2, Euro, Tag, Plus, Trash2, ChevronLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TicketManagement() {
  const queryClient = useQueryClient();
  const [savingTiers, setSavingTiers] = useState(false);
  const [savingTiersOk, setSavingTiersOk] = useState(false);
  const [savingCheckout, setSavingCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState("tiers");

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [tiers, setTiers] = useState([]);
  const [checkoutQuestions, setCheckoutQuestions] = useState([]);
  const [savingCheckoutOk, setSavingCheckoutOk] = useState(false);

  const { data: eventArr, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });
  const event = eventArr?.[0];

  const { data: existingTiers, isLoading: tiersLoading } = useQuery({
    queryKey: ["tiers", eventId],
    queryFn: () => base44.entities.TicketTier.filter({ event_id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });

  React.useEffect(() => {
    if (existingTiers?.length) {
      setTiers(existingTiers);
    }
  }, [existingTiers]);

  React.useEffect(() => {
    if (event?.custom_questions) {
      setCheckoutQuestions(event.custom_questions.map((q, idx) => {
        let required = false;
        let text = q;
        let type = "text";
        let options = [];

        // Parse the custom_question format: "text||type||options||required"
        if (q.includes("||")) {
          const parts = q.split("||");
          text = parts[0];
          type = parts[1] || "text";
          options = parts[2] ? parts[2].split("~") : [];
          required = parts[3] === "true";
        }

        return {
          id: idx,
          text,
          required,
          type,
          options
        };
      }));
    }
  }, [event]);

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...tiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setTiers(updatedTiers);
  };

  const handleAddTier = () => {
    const newTier = {
      event_id: eventId,
      name: "",
      description: "",
      price: 0,
      capacity: null,
      sort_order: tiers.length,
      is_visible: true,
      color: "Standard",
    };
    setTiers([...tiers, newTier]);
  };

  const handleRemoveTier = async (index) => {
    const tier = tiers[index];
    if (tier.id) {
      try {
        await base44.entities.TicketTier.delete(tier.id);
        const updated = tiers.filter((_, i) => i !== index);
        setTiers(updated);
        toast.success("Ticketstufe gelöscht");
      } catch (err) {
        toast.error("Fehler beim Löschen");
      }
    } else {
      const updated = tiers.filter((_, i) => i !== index);
      setTiers(updated);
    }
  };

  const handleSaveTiers = async () => {
    setSavingTiers(true);
    setSavingTiersOk(false);
    try {
      for (const tier of tiers) {
        if (tier.id) {
          await base44.entities.TicketTier.update(tier.id, tier);
        } else {
          await base44.entities.TicketTier.create(tier);
        }
      }
      queryClient.invalidateQueries(["tiers", eventId]);
      toast.success("Ticketstufen gespeichert");
      setSavingTiersOk(true);
      setTimeout(() => setSavingTiersOk(false), 2000);
    } catch (err) {
      toast.error("Fehler beim Speichern");
    } finally {
      setSavingTiers(false);
    }
  };

  const addCheckoutQuestion = () => {
    setCheckoutQuestions([...checkoutQuestions, { id: Date.now(), text: "", required: false, type: "text", options: [] }]);
  };

  const updateCheckoutQuestion = (id, field, value) => {
    setCheckoutQuestions(checkoutQuestions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const removeCheckoutQuestion = (id) => {
    setCheckoutQuestions(checkoutQuestions.filter(q => q.id !== id));
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

  const handleSaveCheckout = async () => {
    setSavingCheckout(true);
    setSavingCheckoutOk(false);
    await base44.entities.Event.update(event.id, {
      custom_questions: checkoutQuestions.map(q => {
        const baseFormat = `${q.text}||${q.type}||${(q.options || []).join("~")}||${q.required}`;
        return baseFormat;
      })
    });
    queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    setSavingCheckout(false);
    setSavingCheckoutOk(true);
    setTimeout(() => setSavingCheckoutOk(false), 2000);
    toast.success("Custom Checkout gespeichert");
  };

  if (!eventId) {
    return <div className="p-6 text-center text-slate-500">Event nicht gefunden.</div>;
  }

  if (eventLoading || tiersLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
          <Link to={createPageUrl(`Dashboard?event_id=${eventId}`)} className="text-slate-400 hover:text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ticketing</h1>
            <p className="text-sm text-slate-500 mt-1">{event?.name}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-2 border-b border-slate-200 bg-white rounded-t-2xl px-6 mb-6">
          <button
            onClick={() => setActiveTab("tiers")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "tiers" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Ticketstufen
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
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "tiers" && (
          <div className="bg-white rounded-lg border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-500" />
              Ticketstufen
            </h2>

            <div className="space-y-6">
              {tiers.map((tier, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-slate-700 font-medium">Name *</Label>
                      <Input
                        value={tier.name}
                        onChange={(e) => handleTierChange(index, "name", e.target.value)}
                        className="mt-1"
                        placeholder="z.B. Early Bird"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Preis ({event?.currency})</Label>
                      <Input
                        type="number"
                        value={tier.price || 0}
                        onChange={(e) => handleTierChange(index, "price", parseFloat(e.target.value) || 0)}
                        className="mt-1"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Kapazität</Label>
                      <Input
                        type="number"
                        value={tier.capacity || ""}
                        onChange={(e) => handleTierChange(index, "capacity", e.target.value ? parseInt(e.target.value) : null)}
                        className="mt-1"
                        placeholder="Unbegrenzt"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label className="text-slate-700 font-medium">Beschreibung</Label>
                    <Input
                      value={tier.description || ""}
                      onChange={(e) => handleTierChange(index, "description", e.target.value)}
                      className="mt-1"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-slate-700 font-medium">Kategorie</Label>
                      <select
                        value={tier.color || "Standard"}
                        onChange={(e) => handleTierChange(index, "color", e.target.value)}
                        className="mt-1 w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
                      >
                        <option>Standard</option>
                        <option>VIP</option>
                        <option>Business</option>
                        <option>Presse</option>
                        <option>Speaker</option>
                        <option>Sponsor</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={tier.is_visible !== false}
                          onCheckedChange={(checked) => handleTierChange(index, "is_visible", checked)}
                        />
                        <label className="text-sm text-slate-700">Sichtbar</label>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 w-full"
                    onClick={() => handleRemoveTier(index)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Löschen
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-6 border-dashed"
              onClick={handleAddTier}
            >
              <Plus className="w-4 h-4 mr-2" />
              Neue Ticketstufe
            </Button>

            <div className="flex gap-4 mt-8">
              <Button
                onClick={handleSaveTiers}
                disabled={savingTiers}
                className="flex-1 bg-amber-500 hover:bg-amber-600"
              >
                {savingTiers && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {savingTiers ? "Wird gespeichert..." : "Speichern"}
              </Button>
              {savingTiersOk && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 flex items-center gap-2">
                  Gespeichert ✓
                </motion.div>
              )}
            </div>
          </div>
          )}

          {activeTab === "checkout" && (
          <div className="bg-white rounded-lg border border-slate-200 p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Custom Checkout Fragen</h2>
                <p className="text-xs text-slate-500">Individuelle Fragen die Gäste beim Checkout beantworten müssen.</p>
              </div>
              <Button size="sm" onClick={addCheckoutQuestion} className="gap-2">
                <Plus className="w-4 h-4" />
                Frage hinzufügen
              </Button>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-5">
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
                      <Select value={question.type || "text"} onValueChange={(val) => updateCheckoutQuestion(question.id, "type", val)}>
                        <SelectTrigger className="mt-1 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Textfeld</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
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
                          Option
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

            <div className="flex gap-4">
              <Button onClick={handleSaveCheckout} disabled={savingCheckout} className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 rounded-xl text-sm font-medium">
                {savingCheckout ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <>Custom Checkout speichern</>}
              </Button>
              {savingCheckoutOk && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Gespeichert
                </motion.div>
              )}
            </div>
          </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}