import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { CheckCircle, Mail, Calendar, Download, Smartphone } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

export default function RegistrationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { eventId } = state;
  const urlParams = new URLSearchParams(window.location.search);
  const registrationId = urlParams.get("registration_id");
  const eventIdParam = urlParams.get("event_id");
  
  const { data: registration } = useQuery({
    queryKey: ["registration", registrationId],
    queryFn: () => registrationId ? base44.entities.Registration.filter({ id: registrationId }) : Promise.resolve([]),
    select: (data) => data?.[0],
    enabled: !!registrationId,
  });

  const { data: event } = useQuery({
    queryKey: ["event", eventIdParam],
    queryFn: () => eventIdParam ? base44.entities.Event.filter({ id: eventIdParam }) : Promise.resolve([]),
    select: (data) => data?.[0],
    enabled: !!eventIdParam,
  });

  const { data: tickets } = useQuery({
    queryKey: ["tickets", registrationId],
    queryFn: () => registrationId ? base44.entities.Ticket.filter({ registration_id: registrationId }) : Promise.resolve([]),
    enabled: !!registrationId && registration?.status === "approved",
  });

  const ticket = tickets?.[0];
  const isApproved = registration?.status === "approved";
  const [ticketCode] = useState(ticket?.ticket_code || "");
  const [email] = useState(registration?.email || "");

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
        {!isApproved ? (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
              <Mail className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Registrierung eingegangen</h1>
            <p className="text-lg text-slate-600 mb-8">
              Vielen Dank für deine Registrierung! Wir überprüfen deine Anmeldung.
            </p>
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 text-left">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-slate-900 mb-1">Bestätigung ausstehend</h2>
                  <p className="text-slate-600 text-sm">
                    Sobald deine Anmeldung genehmigt wurde, erhältst du deine Tickets und alle Informationen per E-Mail.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-slate-600 mb-8 text-sm">
              Überprüfe dein Postfach (und Spam-Ordner) auf Updates.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Anmeldung genehmigt!</h1>
            <p className="text-lg text-slate-600 mb-8">
              Deine Registrierung wurde bestätigt. Hier sind deine Tickets!
            </p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-slate-900 mb-4">Ticket-Optionen</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  onClick={handleAddToCalendar}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Zu Kalender</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  onClick={handleDownloadPDF}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Als PDF</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 sm:col-span-2"
                  onClick={handleAddToWallet}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm">Zu Wallet (Apple/Google)</span>
                </Button>
              </div>
            </div>
          </>
        )}

        <Button
          className="bg-slate-900 hover:bg-slate-800 w-full"
          onClick={() => navigate(createPageUrl(`EventDetails?event_id=${eventIdParam || eventId}`))}
        >
          Zur Veranstaltungsseite
        </Button>
      </div>
    </div>
  );
}