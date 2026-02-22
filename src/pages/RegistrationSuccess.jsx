import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { CheckCircle, Mail } from "lucide-react";

export default function RegistrationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { eventId, eventName, hasPlusOne } = state;

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