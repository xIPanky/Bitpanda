import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const categoryColors = {
  Standard: "bg-slate-100 text-slate-700",
  VIP: "bg-amber-100 text-amber-700",
  Business: "bg-blue-100 text-blue-700",
  Presse: "bg-purple-100 text-purple-700",
  Speaker: "bg-green-100 text-green-700",
  Sponsor: "bg-red-100 text-red-700",
};

export function TicketSelector({ event, tiers, onSelectTier }) {
  if (!tiers || tiers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Keine Tickets verfügbar.</p>
      </div>
    );
  }

  const visibleTiers = tiers.filter(t => t.is_visible !== false).sort((a, b) => a.sort_order - b.sort_order);

  if (visibleTiers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Keine Tickets verfügbar.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8 text-slate-900">Wähle dein Ticket</h2>
      
      <div className="grid gap-4 mb-8">
        {visibleTiers.map((tier) => {
          const isOutOfStock = tier.capacity && tier.capacity <= 0;
          
          return (
            <button
              key={tier.id}
              onClick={() => !isOutOfStock && onSelectTier(tier)}
              disabled={isOutOfStock}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                isOutOfStock
                  ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-50"
                  : "border-slate-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
                  {tier.description && (
                    <p className="text-sm text-slate-600 mt-1">{tier.description}</p>
                  )}
                </div>
                <Badge className={`${categoryColors[tier.color] || categoryColors.Standard}`}>
                  {tier.color}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {tier.price === 0 || !tier.price ? "Kostenlos" : `${tier.price} ${event.currency}`}
                  </p>
                </div>
                {!isOutOfStock && (
                  <div className="flex items-center gap-2 text-amber-600 font-medium">
                    Auswählen
                    <Check className="w-5 h-5" />
                  </div>
                )}
                {isOutOfStock && (
                  <span className="text-red-600 font-medium">Ausverkauft</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}