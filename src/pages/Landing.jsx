import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Ticket, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function Landing() {

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
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Home"))}
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
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Home"))}
          >
            Einloggen
          </Button>
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
                 <h3 className="text-xl font-bold mb-2">Magic Link versendet!</h3>
                 <p className="text-slate-400 text-sm">Prüfe dein Email-Postfach. Klick auf den Link zum Einloggen und starten.</p>
               </div>
             ) : (
               <>
                 <h2 className="text-2xl font-bold mb-2">Als Veranstalter registrieren</h2>
                 <p className="text-slate-400 text-sm mb-8">Erhalte einen sicheren Magic Link per Email.</p>
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