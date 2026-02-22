import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2 } from "lucide-react";

export default function CreateEventDialog({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    description: "",
    date: "",
    time: "",
    location: "",
    is_paid: false,
    currency: "EUR",
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.date) return;
    setSaving(true);
    const newEvent = await base44.entities.Event.create({
      ...form,
      status: "published",
      registration_open: true,
    });
    onCreated(newEvent);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Neues Event erstellen</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          <div className="space-y-1.5">
            <Label>Event-Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z.B. Summit 2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Untertitel</Label>
            <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="z.B. Die Zukunft der Tech" />
          </div>
          <div className="space-y-1.5">
            <Label>Beschreibung</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Erzähle mehr über dein Event..." className="resize-none h-20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Datum *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Uhrzeit</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ort</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="z.B. Berlin, Tempodrom" />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} className="rounded" />
              <span className="text-sm font-medium text-slate-900">Kostenpflichtiges Event</span>
            </label>
          </div>
          {form.is_paid && (
            <div className="space-y-1.5">
              <Label>Währung</Label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm">
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={onClose} className="flex-1">Abbrechen</Button>
          <Button onClick={handleCreate} disabled={saving || !form.name.trim()} className="flex-1 bg-slate-900 hover:bg-slate-800">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Event erstellen"}
          </Button>
        </div>
      </div>
    </div>
  );
}