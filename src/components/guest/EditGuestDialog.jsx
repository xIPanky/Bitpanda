import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EditGuestDialog({ guest, open, onOpenChange, onSave }) {
  const [form, setForm] = useState(guest || {});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const wasApproved = guest?.status !== "approved" && form.status === "approved";

      if (wasApproved) {
        // Server-side workflow: approve + create ticket + send email
        await base44.functions.invoke('approveGuestAndSendTicket', { guestId: guest.id });
        // Save other form changes (category, notes, etc.) - status is handled by backend
        const { status, ...otherChanges } = form;
        await base44.entities.Registration.update(guest.id, otherChanges);
        toast.success("Gast genehmigt und Ticket per E-Mail versendet");
      } else {
        await base44.entities.Registration.update(guest.id, form);
        toast.success("Gast aktualisiert");
      }

      onSave();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Fehler: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gast bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Vorname</Label>
              <Input
                value={form.first_name || ""}
                onChange={(e) => handleChange("first_name", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Nachname</Label>
              <Input
                value={form.last_name || ""}
                onChange={(e) => handleChange("last_name", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">E-Mail</Label>
            <Input
              type="email"
              value={form.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Telefon</Label>
            <Input
              value={form.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Eingeladen von</Label>
            <Input
              value={form.invited_by || ""}
              onChange={(e) => handleChange("invited_by", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Kategorie</Label>
            <Select value={form.category || "Standard"} onValueChange={(val) => handleChange("category", val)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["VIP", "Business", "Presse", "Standard", "Speaker", "Sponsor"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Status</Label>
            <Select value={form.status || "pending"} onValueChange={(val) => handleChange("status", val)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="approved">Freigegeben</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Anmerkungen</Label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-slate-900">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Speichert..." : "Speichern"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}