import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Euro, Tag, Plus, Trash2, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TicketManagement() {
  const queryClient = useQueryClient();
  const [savingTiers, setSavingTiers] = useState(false);
  const [savingTiersOk, setSavingTiersOk] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [tiers, setTiers] = useState([]);

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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
        </motion.div>
      </div>
    </div>
  );
}