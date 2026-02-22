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
    // Store the request as an OrganizerRequest entity
    await base44.entities.OrganizerRequest.create({
      full_name: form.full_name,
      email: form.email,
      status: "pending",
    });
    setSent(true);
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
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="bg-amber-400 text-slate-900 hover:bg-amber-300 font-semibold px-8 h-12"
              onClick={() => document.getElementById("signup").scrollIntoView({ behavior: "smooth" })}
            >
              Jetzt starten <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent h-12 px-8"
              onClick={() => base44.auth.redirectToLogin()}
            >
              Einloggen
            </Button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-24"
        >
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Sign-up form */}
      <div id="signup" className="border-t border-white/5 py-24 px-6">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-10"
          >
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Anfrage gesendet!</h3>
                <p className="text-slate-400 text-sm">Wir melden uns in Kürze bei dir.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2">Zugang anfordern</h2>
                <p className="text-slate-400 text-sm mb-8">Als Veranstalter beitreten und Events professionell managen.</p>
                <form onSubmit={handleRequest} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Name</Label>
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Max Mustermann" className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">E-Mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="max@beispiel.de" className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-11" />
                  </div>
                  <Button type="submit" disabled={sending || !form.email || !form.full_name} className="w-full h-11 bg-amber-400 text-slate-900 hover:bg-amber-300 font-semibold mt-2">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Zugang anfragen"}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Ticket Manager · Alle Rechte vorbehalten
      </footer>
    </div>
  );
}