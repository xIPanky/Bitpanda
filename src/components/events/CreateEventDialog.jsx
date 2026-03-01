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
    end_time: "",
    location: "",
    is_paid: false,
    currency: "EUR",
    organizer_name: "",
    organizer_email: "",
    primary_color: "#111111",
    secondary_color: "#ffffff",
    accent_color: "#ff2e63",
    theme_mode: "dark",
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name erforderlich";
    if (!form.date) newErrors.date = "Datum erforderlich";
    if (!form.time) newErrors.time = "Startzeit erforderlich";
    if (!form.end_time) newErrors.end_time = "Endzeit erforderlich";
    if (!form.location.trim()) newErrors.location = "Ort erforderlich";
    if (!form.organizer_name.trim())
      newErrors.organizer_name = "Veranstalter erforderlich";

    if (!form.organizer_email.trim()) {
      newErrors.organizer_email = "E-Mail erforderlich";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.organizer_email)) {
        newErrors.organizer_email = "Ungültige E-Mail";
      }
    }

    if (
      form.time &&
      form.end_time &&
      form.end_time <= form.time
    ) {
      newErrors.end_time = "Endzeit muss nach Startzeit liegen";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      const newEvent = await base44.entities.Event.create({
        ...form,
        status: "published",
        registration_open: true,
      });

      onCreated(newEvent);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const errorText = (field) =>
    errors[field] && (
      <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
    );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Neues Event erstellen
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">

          {/* NAME */}
          <div>
            <Label>Event-Name *</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            {errorText("name")}
          </div>

          {/* DATUM / ZEIT */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Datum *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
              />
              {errorText("date")}
            </div>

            <div>
              <Label>Startzeit *</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm({ ...form, time: e.target.value })
                }
              />
              {errorText("time")}
            </div>

            <div>
              <Label>Endzeit *</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) =>
                  setForm({ ...form, end_time: e.target.value })
                }
              />
              {errorText("end_time")}
            </div>
          </div>

          {/* ORT */}
          <div>
            <Label>Ort *</Label>
            <Input
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />
            {errorText("location")}
          </div>

          {/* ORGANIZER */}
          <div>
            <Label>Veranstalter *</Label>
            <Input
              value={form.organizer_name}
              onChange={(e) =>
                setForm({ ...form, organizer_name: e.target.value })
              }
            />
            {errorText("organizer_name")}
          </div>

          <div>
            <Label>E-Mail *</Label>
            <Input
              type="email"
              value={form.organizer_email}
              onChange={(e) =>
                setForm({ ...form, organizer_email: e.target.value })
              }
            />
            {errorText("organizer_email")}
          </div>

          {/* PAID */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_paid}
              onChange={(e) =>
                setForm({ ...form, is_paid: e.target.checked })
              }
            />
            <span className="text-sm font-medium text-slate-900">
              Kostenpflichtiges Event
            </span>
          </div>

          {form.is_paid && (
            <div>
              <Label>Währung</Label>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm({ ...form, currency: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Abbrechen
          </Button>

          <Button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 bg-slate-900 hover:bg-slate-800"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Event erstellen"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}