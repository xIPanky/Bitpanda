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
import jsPDF from "jspdf";

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
      
      await base44.entities.Registration.update(guest.id, form);
      
      // Send email with PDF and calendar file if approving
      if (wasApproved) {
        try {
          // Fetch event and ticket data
          const eventList = await base44.entities.Event.list();
          const eventData = eventList?.find(e => e.id === form.event_id);
          const eventName = eventData?.name || "Event";

          const tickets = await base44.entities.Ticket.list();
          const ticket = tickets?.find(t => t.registration_id === guest.id);
          const ticketCode = ticket?.ticket_code || "N/A";
          
          // Generate PDF ticket
          const doc = new jsPDF({ unit: "mm", format: "a5" });
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketCode}`;
          
          doc.setFillColor(15, 23, 42);
          doc.rect(0, 0, 148, 30, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.setFont("helvetica", "bold");
          doc.text("TICKET", 14, 18);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(180, 180, 180);
          doc.text(eventData?.date ? new Date(eventData.date).toLocaleDateString("de-DE") : "", 14, 24);
          
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text(form.email, 14, 45);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text("Dein Ticket-Code", 14, 52);
          
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
          doc.text("CODE", 14, 68);
          doc.setFontSize(20);
          doc.setFont("courier", "bold");
          doc.text(ticketCode, 14, 78);
          
          // Add QR code
          try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketCode}`;
            const img = await new Promise((resolve, reject) => {
              const image = new Image();
              image.crossOrigin = "anonymous";
              image.onload = () => resolve(image);
              image.onerror = () => reject(new Error("Failed to load QR code"));
              image.src = qrUrl;
            });
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const qrImage = canvas.toDataURL("image/png");
            doc.addImage(qrImage, "PNG", 95, 38, 40, 40);
          } catch (qrErr) {
            console.error("QR Code generation failed:", qrErr);
          }
          
          const pdfBlob = doc.output("blob");
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          // Generate calendar file (ICS)
          const startDate = eventData?.date ? new Date(eventData.date + (eventData.time ? `T${eventData.time}` : "T09:00")) : new Date();
          const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

          const formatDate = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

          const icalContent = `BEGIN:VCALENDAR
          VERSION:2.0
          PRODID:-//Ticket Manager//DE
          BEGIN:VEVENT
          UID:${ticketCode}@ticketmanager
          DTSTAMP:${formatDate(new Date())}
          DTSTART:${formatDate(startDate)}
          DTEND:${formatDate(endDate)}
          SUMMARY:${eventName}
          DESCRIPTION:Ticket-Code: ${ticketCode}
          LOCATION:${eventData?.location || ""}
          END:VEVENT
          END:VCALENDAR`;

          const icalBlob = new Blob([icalContent], { type: "text/calendar" });
          const icalUrl = URL.createObjectURL(icalBlob);

          // Create email body
          const emailBody = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h1 style="font-size:24px;color:#0f172a;margin-bottom:24px;">Registrierung bestätigt!</h1>
          <p style="color:#64748b;line-height:1.6;margin-bottom:24px;">Hallo ${form.first_name},</p>
          <p style="color:#64748b;line-height:1.6;margin-bottom:24px;">vielen Dank für deine Anmeldung! Deine Registrierung für <strong>${eventName}</strong> wurde genehmigt.</p>
          <div style="background:#f8fafc;border-radius:16px;padding:24px;margin:24px 0;">
          <h2 style="font-size:16px;color:#0f172a;margin-top:0;">Veranstaltungsdetails</h2>
          <p style="color:#64748b;margin:8px 0;">📅 <strong>${eventData?.date ? new Date(eventData.date).toLocaleDateString("de-DE") : "N/A"}</strong></p>
          ${eventData?.time ? `<p style="color:#64748b;margin:8px 0;">🕐 <strong>${eventData.time}</strong></p>` : ""}
          ${eventData?.location ? `<p style="color:#64748b;margin:8px 0;">📍 <strong>${eventData.location}</strong></p>` : ""}
          </div>
          <div style="background:#f0fdf4;border-radius:16px;padding:24px;margin:24px 0;text-align:center;border:2px solid #dcfce7;">
          <p style="font-size:14px;color:#15803d;margin-bottom:8px;margin-top:0;">Dein Ticket-Code</p>
          <p style="font-size:32px;font-weight:700;color:#0f172a;letter-spacing:2px;margin:0;">${ticketCode}</p>
          </div>
          <p style="color:#64748b;line-height:1.6;margin-top:24px;">Dein Ticket-Code ist dein Eintrittsticket zur Veranstaltung. Bitte bring ihn zur Veranstaltung mit.</p>
          <p style="color:#94a3b8;font-size:13px;margin-top:32px;">Viele Grüße,<br/>Dein Event-Team</p>
          </div>`;

          // Send confirmation email
          await base44.integrations.Core.SendEmail({
            to: form.email,
            subject: `Deine Bestätigung für ${eventName}`,
            body: emailBody,
          });
          
          // Update ticket to mark email as sent
          if (ticket) {
            await base44.entities.Ticket.update(ticket.id, { email_sent: true });
          }
          
          toast.success("Gast genehmigt und E-Mail versendet");
        } catch (emailErr) {
          console.error("Fehler beim Versenden der E-Mail:", emailErr);
          toast.success("Gast genehmigt (E-Mail-Versand fehlgeschlagen)");
        }
      } else {
        toast.success("Gast aktualisiert");
      }
      
      onSave();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Speichern");
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