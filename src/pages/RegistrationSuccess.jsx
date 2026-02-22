import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { CheckCircle, Mail, Calendar, Download, Smartphone } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

export default function RegistrationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { eventId, eventName, hasPlusOne } = state;
  const [ticketCode] = useState(new URLSearchParams(window.location.search).get("ticket_code") || "");
  const [email] = useState(new URLSearchParams(window.location.search).get("email") || "");

  const handleAddToCalendar = () => {
    const eventDate = new URLSearchParams(window.location.search).get("event_date");
    const eventTime = new URLSearchParams(window.location.search).get("event_time");
    const eventLocation = new URLSearchParams(window.location.search).get("event_location");
    
    if (!eventDate) {
      toast.error("Event-Datum nicht verfügbar");
      return;
    }

    const startDate = new Date(eventDate + (eventTime ? `T${eventTime}` : "T09:00"));
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Ticket Manager//DE
BEGIN:VEVENT
UID:${ticketCode}@ticketmanager
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
SUMMARY:${eventName || "Event"}
DESCRIPTION:Ticket-Code: ${ticketCode}
LOCATION:${eventLocation || ""}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ical], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName || "event"}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kalender-Datei heruntergeladen");
  };

  const handleDownloadPDF = () => {
    if (!ticketCode) {
      toast.error("Ticket-Code nicht verfügbar");
      return;
    }

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
    doc.text(eventName || "Event", 14, 24);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(email || "", 14, 45);
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
    doc.setTextColor(15, 23, 42);
    doc.text(ticketCode, 14, 78);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      doc.addImage(img, "PNG", 95, 38, 40, 40);
      doc.save(`ticket-${ticketCode}.pdf`);
      toast.success("Ticket-PDF heruntergeladen");
    };
    img.onerror = () => {
      doc.save(`ticket-${ticketCode}.pdf`);
      toast.success("Ticket-PDF heruntergeladen");
    };
    img.src = qrUrl;
  };

  const handleAddToWallet = () => {
    toast.info("Wallet-Feature wird demnächst verfügbar");
    // Future: Implement Apple Wallet und Google Wallet integration
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-4xl font-bold text-slate-900 mb-2">Registrierung bestätigt!</h1>
        
        <p className="text-lg text-slate-600 mb-8">
          Vielen Dank für deine Registrierung{hasPlusOne ? " und die Registrierung deiner Begleitung" : ""}!
        </p>

        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 text-left">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-slate-900 mb-1">Tickets folgen in Kürze</h2>
              <p className="text-slate-600 text-sm">
                Sobald deine Anmeldung bestätigt wurde, erhältst du deine Tickets per E-Mail zugesandt. 
                {hasPlusOne && " Dies gilt auch für deine Begleitung."}
              </p>
            </div>
          </div>
        </div>

        <p className="text-slate-600 mb-6">
          Überprüfe dein Postfach (und Spam-Ordner) auf die Bestätigungs-E-Mail.
        </p>

        <Button
          className="bg-slate-900 hover:bg-slate-800 w-full mb-3"
          onClick={() => {
            if (eventId) {
              navigate(createPageUrl(`EventDetails?event_id=${eventId}`));
            } else {
              navigate(createPageUrl("Home"));
            }
          }}
        >
          Zur Veranstaltungsseite
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(createPageUrl("Home"))}
        >
          Zu meinen Events
        </Button>
      </div>
    </div>
  );
}