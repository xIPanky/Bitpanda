import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const inputBase = {
  background: "#0d0d0d",
  border: "1px solid #1e1e1e",
  borderRadius: "10px",
  color: "#ffffff",
  padding: "10px 14px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const DarkInput = ({ type = "text", value, onChange, placeholder, required }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    required={required}
    style={inputBase}
    onFocus={(e) => { e.target.style.borderColor = "#beff00"; e.target.style.boxShadow = "0 0 0 2px rgba(190,255,0,0.1)"; }}
    onBlur={(e) => { e.target.style.borderColor = "#1e1e1e"; e.target.style.boxShadow = "none"; }}
  />
);

const DarkTextarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    style={{ ...inputBase, resize: "vertical" }}
    onFocus={(e) => { e.target.style.borderColor = "#beff00"; e.target.style.boxShadow = "0 0 0 2px rgba(190,255,0,0.1)"; }}
    onBlur={(e) => { e.target.style.borderColor = "#1e1e1e"; e.target.style.boxShadow = "none"; }}
  />
);

const DarkSelect = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={onChange}
    style={{ ...inputBase, cursor: "pointer" }}
    onFocus={(e) => { e.target.style.borderColor = "#beff00"; e.target.style.boxShadow = "0 0 0 2px rgba(190,255,0,0.1)"; }}
    onBlur={(e) => { e.target.style.borderColor = "#1e1e1e"; e.target.style.boxShadow = "none"; }}
  >
    {children}
  </select>
);

const FieldLabel = ({ children, required }) => (
  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: "5px" }}>
    {children}{required && <span style={{ color: "#beff00", marginLeft: "4px" }}>*</span>}
  </label>
);

export function TicketRegistration({ event, tier, onComplete, onAbandoned, onBack }) {
  const parsedQuestions = useMemo(() => {
    return event.custom_questions?.map((q) => {
      let text = q, type = "text", options = [], required = false;
      if (q.includes("||")) {
        const parts = q.split("||");
        text = parts[0]; type = parts[1] || "text";
        options = parts[2] ? parts[2].split("~") : [];
        required = parts[3] === "true";
      }
      return { text, type, options, required };
    }) || [];
  }, [event.custom_questions]);

  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", custom_answers: parsedQuestions.map(() => ""), invited_by: "" });
  const [hasPlusOne, setHasPlusOne] = useState(false);
  const [plusOne, setPlusOne] = useState({ first_name: "", last_name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const handleAnswer = (idx, value) => {
    const newAnswers = [...form.custom_answers];
    newAnswers[idx] = value;
    setForm(prev => ({ ...prev, custom_answers: newAnswers }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
        setError("Bitte fülle alle Pflichtfelder aus.");
        setLoading(false);
        return;
      }
      for (let i = 0; i < parsedQuestions.length; i++) {
        if (parsedQuestions[i].required && !form.custom_answers[i]?.trim()) {
          setError(`Bitte beantworte: ${parsedQuestions[i].text}`);
          setLoading(false);
          return;
        }
      }
      if (hasPlusOne && (!plusOne.first_name.trim() || !plusOne.last_name.trim() || !plusOne.email.trim())) {
        setError("Bitte fülle alle Felder der Begleitung aus.");
        setLoading(false);
        return;
      }

      const registration = await base44.entities.Registration.create({
        event_id: event.id,
        ticket_tier_id: tier?.id || "",
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || "",
        custom_answers: form.custom_answers,
        invited_by: form.invited_by || "",
        category: tier?.color || "Standard",
        status: "pending",
      });

      const ticketCode = `${form.first_name[0]?.toUpperCase()}${form.last_name[0]?.toUpperCase()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await base44.entities.Ticket.create({
        event_id: event.id,
        registration_id: registration.id,
        ticket_tier_id: tier?.id || "",
        ticket_code: ticketCode,
        guest_name: `${form.first_name} ${form.last_name}`,
        guest_email: form.email,
        category: tier?.color || "Standard",
        status: "valid",
        email_sent: false,
      });

      if (hasPlusOne) {
        const plusOneReg = await base44.entities.Registration.create({
          event_id: event.id,
          ticket_tier_id: tier?.id || "",
          first_name: plusOne.first_name,
          last_name: plusOne.last_name,
          email: plusOne.email,
          custom_answers: form.custom_answers,
          invited_by: form.invited_by || "",
          category: tier?.color || "Standard",
          status: "pending",
        });
        const plusOneCode = `${plusOne.first_name[0]?.toUpperCase()}${plusOne.last_name[0]?.toUpperCase()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await base44.entities.Ticket.create({
          event_id: event.id,
          registration_id: plusOneReg.id,
          ticket_tier_id: tier?.id || "",
          ticket_code: plusOneCode,
          guest_name: `${plusOne.first_name} ${plusOne.last_name}`,
          guest_email: plusOne.email,
          category: tier?.color || "Standard",
          status: "valid",
          email_sent: false,
        });
      }

      try {
        await base44.integrations.Core.SendEmail({
          to: form.email,
          subject: `Registrierung für ${event.name} eingegangen`,
          body: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#070707;color:#fff;">
            <div style="text-align:center;padding:32px 0;border-bottom:1px solid #1a1a1a;margin-bottom:32px;">
              <p style="color:#beff00;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">REQUEST RECEIVED</p>
              <h1 style="font-size:26px;font-weight:800;color:#fff;margin:0;">${event.name}</h1>
            </div>
            <p style="color:#888;line-height:1.7;">Hallo ${form.first_name},<br/><br/>deine Registrierung für <strong style="color:#fff;">${event.name}</strong> ist eingegangen und wird von unserem Team geprüft.<br/><br/>Du erhältst dein Ticket und weitere Informationen per E-Mail.</p>
            <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;padding:20px;margin:24px 0;">
              <p style="font-size:11px;color:#444;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Status</p>
              <p style="color:#f59e0b;font-weight:600;font-size:14px;">In Prüfung</p>
            </div>
            <p style="color:#555;font-size:12px;">${event.date ? new Date(event.date).toLocaleDateString("de-DE", { day:"numeric", month:"long", year:"numeric" }) : ""}${event.time ? ` · ${event.time}` : ""}${event.location ? ` · ${event.location}` : ""}</p>
          </div>`,
        });
      } catch (emailErr) {
        console.error("Email error:", emailErr);
      }

      base44.analytics.track({ eventName: "registration_submitted", properties: { event_id: event.id, tier_id: tier?.id, has_plus_one: hasPlusOne } });
      toast.success("Registrierung eingegangen!");
      onComplete(registration);
    } catch (err) {
      console.error(err);
      setError("Fehler bei der Registrierung. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {tier && (
        <div className="mb-5 p-4 rounded-2xl flex items-center justify-between" style={{ background: "#0d1a00", border: "1px solid #1a2e00" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "#555" }}>Ausgewähltes Ticket</p>
            <p className="font-bold text-white">{tier.name}</p>
          </div>
          <span className="text-lg font-bold" style={{ color: "#beff00" }}>
            {tier.price === 0 || !tier.price ? "Kostenlos" : `${tier.price} ${event.currency || "EUR"}`}
          </span>
        </div>
      )}

      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#beff00" }}>Guestlist</p>
        <h2 className="text-2xl font-bold text-white">Deine Daten</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm" style={{ background: "#1a0505", border: "1px solid #2a0808", color: "#ef4444" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Vorname</FieldLabel>
            <DarkInput required value={form.first_name} onChange={(e) => handleChange("first_name", e.target.value)} placeholder="Max" />
          </div>
          <div>
            <FieldLabel required>Nachname</FieldLabel>
            <DarkInput required value={form.last_name} onChange={(e) => handleChange("last_name", e.target.value)} placeholder="Mustermann" />
          </div>
        </div>

        <div>
          <FieldLabel required>E-Mail</FieldLabel>
          <DarkInput type="email" required value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="max@example.com" />
        </div>

        <div>
          <FieldLabel>Telefonnummer</FieldLabel>
          <DarkInput type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+49 123 456789" />
        </div>

        {event.invitation_options?.length > 0 && (
          <div>
            <FieldLabel>Wie hast du von dieser Veranstaltung erfahren?</FieldLabel>
            <DarkSelect value={form.invited_by} onChange={(e) => handleChange("invited_by", e.target.value)}>
              <option value="" style={{ background: "#111" }}>-- Bitte wählen --</option>
              {event.invitation_options.map((opt, idx) => (
                <option key={idx} value={opt} style={{ background: "#111" }}>{opt}</option>
              ))}
            </DarkSelect>
          </div>
        )}

        {parsedQuestions.length > 0 && (
          <div className="pt-3 space-y-4" style={{ borderTop: "1px solid #141414" }}>
            {parsedQuestions.map((q, idx) => (
              <div key={idx}>
                <FieldLabel required={q.required}>{q.text}</FieldLabel>
                {q.type === "dropdown" ? (
                  <DarkSelect value={form.custom_answers[idx] || ""} onChange={(e) => handleAnswer(idx, e.target.value)}>
                    <option value="" style={{ background: "#111" }}>-- Bitte wählen --</option>
                    {q.options.map((opt, oi) => (
                      <option key={oi} value={opt} style={{ background: "#111" }}>{opt}</option>
                    ))}
                  </DarkSelect>
                ) : (
                  <DarkTextarea value={form.custom_answers[idx] || ""} onChange={(e) => handleAnswer(idx, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Plus One */}
        <div className="pt-3" style={{ borderTop: "1px solid #141414" }}>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setHasPlusOne(!hasPlusOne)}
              className="w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0"
              style={{ background: hasPlusOne ? "#beff00" : "#111", border: hasPlusOne ? "none" : "1px solid #2a2a2a", cursor: "pointer" }}
            >
              {hasPlusOne && <span style={{ color: "#070707", fontSize: "12px", fontWeight: 900 }}>✓</span>}
            </div>
            <span className="text-sm font-semibold text-white">Ich komme mit einer Begleitung (+1)</span>
          </label>

          {hasPlusOne && (
            <div className="mt-5 p-5 rounded-2xl space-y-4" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#555" }}>Begleitung</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Vorname</FieldLabel>
                  <DarkInput required value={plusOne.first_name} onChange={(e) => setPlusOne(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div>
                  <FieldLabel required>Nachname</FieldLabel>
                  <DarkInput required value={plusOne.last_name} onChange={(e) => setPlusOne(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div>
                <FieldLabel required>E-Mail</FieldLabel>
                <DarkInput type="email" required value={plusOne.email} onChange={(e) => setPlusOne(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => { onAbandoned("back"); onBack(); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "#0d0d0d", color: "#555", border: "1px solid #1a1a1a" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#2a2a2a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#1a1a1a"; }}
          >
            <ChevronLeft className="w-4 h-4" /> Zurück
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: "#beff00", color: "#070707" }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 0 24px rgba(190,255,0,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Wird verarbeitet..." : tier ? "Tickets sichern" : "Registrieren"}
          </button>
        </div>
      </form>
    </div>
  );
}