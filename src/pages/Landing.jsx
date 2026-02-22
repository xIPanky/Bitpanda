import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
// OrganizerRequest entity used for storing access requests
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Ticket, CheckCircle2, ArrowRight, Users, BarChart2, Mail, Loader2, Zap, Shield, Globe } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Users, title: "Gästeverwaltung", desc: "Registrierungen annehmen, Kategorien verwalten und Tickets versenden" },
  { icon: BarChart2, title: "Live-Dashboard", desc: "Echtzeit-Statistiken über Anmeldungen, Check-ins und mehr" },
  { icon: Mail, title: "E-Mail Marketing", desc: "Personalisierte E-Mails direkt an deine Teilnehmer" },
  { icon: Zap, title: "QR-Scanner", desc: "Schneller Check-in mit integriertem QR-Code-Scanner" },
  { icon: Shield, title: "Mehrere Ticketstufen", desc: "VIP, Early Bird, Standard – inklusive Preise und Kontingente" },
  { icon: Globe, title: "Öffentliche Registrierungsseite", desc: "Deine eigene Anmeldeseite, bereit zum Teilen" },
];

export default function Landing() {
  const [form, setForm] = useState({ email: "", full_name: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!form.email || !form.full_name) return;
    setSending(true);
    try {
      // Invite the organizer with Magic Link
      await base44.users.inviteUser(form.email, "user");
      setSent(true);
      toast.success("Magic Link wurde per Email gesendet!");
    } catch (error) {
      toast.error("Fehler beim Versenden des Links");
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-slate-900" />
            </div>
            <span className="font-bold text-lg">Ticket Manager</span>
          </div>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            onClick={() => base44.auth.redirectToLogin()}
          >
            Anmelden
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1.5 text-amber-400 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Die All-in-One Plattform für Veranstaltungen
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Deine Events.<br />
            <span className="text-amber-400">Professionell gemanagt.</span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            Von der Anmeldung bis zum Check-in – alles in einem Tool.
            Erstelle Events, verwalte Gästelisten und versende Tickets in Minuten.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent h-12 px-8"
            onClick={() => base44.auth.redirectToLogin()}
          >
            Einloggen
          </Button>
        </motion.div>

      </div>



      <footer className="border-t border-white/5 px-6 py-8 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Ticket Manager · Alle Rechte vorbehalten
      </footer>
    </div>
  );
}