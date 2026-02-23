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

  const ticketCode = ticket?.ticket_code || "";
  const isApproved = registration?.status === "approved";
  const eventName = event?.name || "Event";

  const handleAddToCalendar = () => {
    if (!event?.date) {
      toast.error("Event-Datum nicht verfügbar");
      return;
    }

    const startDate = new Date(event.date + (event.time ? `T${event.time}` : "T09:00"));
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const ical = `BEGIN:VCALENDAR
  VERSION:2.0
  PRODID:-//Ticket Manager//DE
  BEGIN:VEVENT
  UID:${ticketCode}@ticketmanager
  DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
  DTSTART:${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
  DTEND:${endDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
  SUMMARY:${eventName}
  DESCRIPTION:Ticket-Code: ${ticketCode}
  LOCATION:${event.location || ""}
  END:VEVENT
  END:VCALENDAR`;

    const blob = new Blob([ical], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kalender-Datei heruntergeladen");
  };

  const handleDownloadPDF = async () => {
    if (!ticketCode) {
      toast.error("Ticket-Code nicht verfügbar");
      return;
    }

    try {
      const doc = new jsPDF({ unit: "mm", format: "a5" });
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketCode}`;

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 148, 105, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("TICKET", 14, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 180);
      doc.text(eventName, 14, 24);
      doc.setFontSize(8);
      doc.text(event?.date ? new Date(event.date).toLocaleDateString("de-DE") : "", 14, 29);

      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      doc.text(`${registration?.first_name} ${registration?.last_name}`, 14, 40);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text("CODE", 14, 52);
      doc.setFontSize(14);
      doc.setFont("courier", "bold");
      doc.text(ticketCode, 14, 60);

      // QR Code
      try {
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error("QR failed"));
          image.src = qrUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const qrImage = canvas.toDataURL("image/png");
        doc.addImage(qrImage, "PNG", 95, 35, 40, 40);
      } catch (e) {
        console.log("QR Code skipped");
      }

      doc.save(`ticket-${ticketCode}.pdf`);
      toast.success("Ticket-PDF heruntergeladen");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Download");
    }
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
             <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
               <CheckCircle className="w-10 h-10 text-green-600" />
             </div>
             <h1 className="text-4xl font-bold text-slate-900 mb-2">In Prüfung</h1>
             <p className="text-lg text-slate-600 mb-8">
               Deine Registrierung ist eingegangen und wird überprüft.
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