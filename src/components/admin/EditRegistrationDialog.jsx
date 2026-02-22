import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const categories = ["VIP", "Business", "Presse", "Standard", "Speaker", "Sponsor"];

export default function EditRegistrationDialog({ registration, onSave, onClose }) {
  const [form, setForm] = useState({ ...registration });
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrierung bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Vorname</Label>
              <Input value={form.first_name || ""} onChange={(e) => set("first_name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nachname</Label>
              <Input value={form.last_name || ""} onChange={(e) => set("last_name", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>E-Mail</Label>
            <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Telefon</Label>
              <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Firma / Organisation</Label>
              <Input value={form.company || ""} onChange={(e) => set("company", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Kategorie</Label>
            <Select value={form.category || "Standard"} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Eingeladen durch</Label>
            <Input value={form.invited_by || ""} onChange={(e) => set("invited_by", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Anmerkungen</Label>
            <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} className="min-h-[80px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}