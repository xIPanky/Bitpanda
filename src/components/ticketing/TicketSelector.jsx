import React from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";

const categoryStyle = {
  VIP:      { bg: "#1a1200", text: "#f59e0b", border: "#2a1e00" },
  Business: { bg: "#0a0f1a", text: "#60a5fa", border: "#0f1a2e" },
  Standard: { bg: "#111",    text: "#888",    border: "#1e1e1e" },
  Speaker:  { bg: "#0a1a0d", text: "#34d399", border: "#0f2e14" },
  Sponsor:  { bg: "#1a0a12", text: "#f472b6", border: "#2e0f1e" },
  Presse:   { bg: "#120a1a", text: "#a78bfa", border: "#1e0f2e" },
};

export function TicketSelector({ event, tiers, onSelectTier }) {
  const visible = tiers.filter(t => t.is_visible !== false);

  return (
    <div>
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#beff00" }}>Guestlist Access</p>
        <h2 className="text-3xl font-bold text-white">Ticket auswählen</h2>
        <p className="text-sm mt-2" style={{ color: "#444" }}>Wähle deine Zugangskategorie für {event.name}</p>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
          <Zap className="w-8 h-8 mx-auto mb-3" style={{ color: "#1a1a1a" }} />
          <p className="text-sm" style={{ color: "#333" }}>Keine Tickets verfügbar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((tier, i) => {
            const isSoldOut = tier.capacity !== undefined && tier.capacity !== null && tier.capacity <= 0;
            const cat = categoryStyle[tier.color] || categoryStyle.Standard;

            return (
              <motion.button
                key={tier.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                disabled={isSoldOut}
                onClick={() => !isSoldOut && onSelectTier(tier)}
                className="w-full rounded-2xl p-5 text-left transition-all group disabled:opacity-40"
                style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
                onMouseEnter={(e) => { if (!isSoldOut) { e.currentTarget.style.borderColor = "#beff00"; e.currentTarget.style.boxShadow = "0 0 20px rgba(190,255,0,0.05)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-white">{tier.name}</span>
                      {tier.color && tier.color !== "Standard" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider" style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>
                          {tier.color}
                        </span>
                      )}
                      {isSoldOut && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider" style={{ background: "#1a0505", color: "#ef4444", border: "1px solid #2a0808" }}>
                          Ausverkauft
                        </span>
                      )}
                    </div>
                    {tier.description && (
                      <p className="text-xs leading-relaxed" style={{ color: "#555" }}>{tier.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: tier.price === 0 || !tier.price ? "#beff00" : "#fff" }}>
                        {tier.price === 0 || !tier.price ? "Kostenlos" : `${tier.price} ${event.currency || "EUR"}`}
                      </p>
                    </div>
                    {!isSoldOut && (
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ background: "#111", border: "1px solid #1a1a1a" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#beff00"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#111"; }}
                      >
                        <ArrowRight className="w-4 h-4 text-white group-hover:text-black" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}