import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function TicketSelector({ event, tiers, onSelectTier }) {
  if (!tiers || tiers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Keine Tickets verfügbar.</p>
      </div>
    );
  }

  const visibleTiers = tiers.filter(tier => tier.is_visible !== false);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-8">Wähle dein Ticket</h2>

      <div className="grid gap-4">
        {visibleTiers.map((tier) => {
          const isSoldOut = tier.capacity && tier.capacity <= 0;
          const remaining = tier.capacity ? tier.capacity : null;

          return (
            <div
              key={tier.id}
              className={`border rounded-lg p-6 transition-all ${
                isSoldOut
                  ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                  : "border-slate-200 hover:border-amber-400 hover:shadow-md hover:bg-amber-50/50 cursor-pointer"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
                  {tier.description && (
                    <p className="text-sm text-slate-600 mt-1">{tier.description}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-slate-900">
                    {tier.price === 0 || !tier.price ? (
                      <span className="text-amber-600">Kostenlos</span>
                    ) : (
                      <>
                        {tier.price}
                        <span className="text-sm font-normal text-slate-600 ml-1">
                          {event.currency}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {remaining !== null && (
                <div className="mb-4 text-sm text-slate-600">
                  {remaining > 0 ? (
                    <span className="text-green-600 font-medium">
                      {remaining} Plätze verfügbar
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">Ausverkauft</span>
                  )}
                </div>
              )}

              <Button
                onClick={() => onSelectTier(tier)}
                disabled={isSoldOut}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isSoldOut ? "Ausverkauft" : "Auswählen"}
                {!isSoldOut && <Check className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}