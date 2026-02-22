import React from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle2, Clock, XCircle, Ticket, ScanLine } from "lucide-react";

const cards = [
  { key: "total", label: "Gesamt", icon: Users, color: "bg-slate-100 text-slate-600" },
  { key: "pending", label: "Ausstehend", icon: Clock, color: "bg-amber-50 text-amber-600" },
  { key: "approved", label: "Freigegeben", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
  { key: "rejected", label: "Abgelehnt", icon: XCircle, color: "bg-red-50 text-red-500" },
  { key: "tickets", label: "Tickets", icon: Ticket, color: "bg-blue-50 text-blue-600" },
  { key: "checkedIn", label: "Eingecheckt", icon: ScanLine, color: "bg-purple-50 text-purple-600" },
];

export default function StatsOverview({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats[card.key] ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{card.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}