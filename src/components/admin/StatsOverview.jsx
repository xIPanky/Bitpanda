import React from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle2, Clock, XCircle, Ticket, ScanLine } from "lucide-react";

const cards = [
  { key: "total",     label: "Gesamt",       icon: Users,        accent: "#ffffff" },
  { key: "pending",   label: "Ausstehend",   icon: Clock,        accent: "#f59e0b" },
  { key: "approved",  label: "Freigegeben",  icon: CheckCircle2, accent: "#beff00" },
  { key: "rejected",  label: "Abgelehnt",    icon: XCircle,      accent: "#ef4444" },
  { key: "tickets",   label: "Tickets",      icon: Ticket,       accent: "#8b5cf6" },
  { key: "checkedIn", label: "Eingecheckt",  icon: ScanLine,     accent: "#06b6d4" },
];

export default function StatsOverview({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "#111111", border: "1px solid #1a1a1a" }}
          >
            <div className="flex items-center justify-between">
              <Icon className="w-4 h-4" style={{ color: card.accent }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: card.accent, opacity: 0.6 }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-none">{stats[card.key] ?? 0}</p>
              <p className="text-xs mt-1.5 uppercase tracking-wider font-medium" style={{ color: "#555" }}>{card.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}