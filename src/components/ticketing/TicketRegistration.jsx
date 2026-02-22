import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export function TicketRegistration({ event, tier, onComplete, onAbandoned, onBack }) {
  // Parse custom questions
  const parsedQuestions = useMemo(() => {
    return event.custom_questions?.map((q) => {
      let text = q;
      let type = "text";
      let options = [];
      let required = false;

      if (q.includes("||")) {
        const parts = q.split("||");
        text = parts[0];
        type = parts[1] || "text";
        options = parts[2] ? parts[2].split("~") : [];
        required = parts[3] === "true";
      }

      return { text, type, options, required };
    }) || [];
  }, [event.custom_questions]);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    custom_answers: parsedQuestions.map(() => ""),
    invited_by: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomAnswerChange = (index, value) => {
    const newAnswers = [...form.custom_answers];
    newAnswers[index] = value;
    setForm(prev => ({ ...prev, custom_answers: newAnswers }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
       // Validate required fields
       if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
         setError("Bitte fülle alle erforderlichen Felder aus.");
         setLoading(false);
         return;
       }

       // Validate required custom questions
       for (let i = 0; i < parsedQuestions.length; i++) {
         if (parsedQuestions[i].required && !form.custom_answers[i]?.trim()) {
           setError(`Bitte beantworte: ${parsedQuestions[i].text}`);
           setLoading(false);
           return;
         }
       }

      // Create registration
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
       });

      // Create ticket only if tier exists
      let ticketCode = null;
      if (tier?.id) {
        ticketCode = `${event.id.substring(0, 6)}-${tier.id.substring(0, 6)}-${Date.now().toString(36).toUpperCase()}`;

        await base44.entities.Ticket.create({
          event_id: event.id,
          registration_id: registration.id,
          ticket_tier_id: tier.id,
          ticket_code: ticketCode,
          guest_name: `${form.first_name} ${form.last_name}`,
          guest_email: form.email,
          category: tier.color || "Standard",
          tier_name: tier.name,
          tier_price: tier.price || 0,
        });
      }

      // Send email with ticket
      try {
        const ticketPdfUrl = `${window.location.origin}/ticket-${ticketCode}.pdf`;
        await base44.integrations.Core.SendEmail({
          to: form.email,
          subject: `Dein Ticket: ${event.name}`,
          body: `Hallo ${form.first_name},\n\nVielen Dank für deine Registrierung zu ${event.name}!\n\nDein Ticketcode: ${ticketCode}\n\nWeitere Informationen zur Veranstaltung findest du auf unserer Website.\n\nBis bald!\n\nBeste Grüße`
        });
        toast.success("Bestätigungsmail versendet");
      } catch (emailErr) {
        console.error("Email error:", emailErr);
      }

      base44.analytics.track({
        eventName: "ticket_purchased",
        properties: {
          event_id: event.id,
          tier_id: tier.id,
          tier_name: tier.name,
          price: tier.price || 0,
        }
      });

      onComplete({ ...registration, ticket_code: ticketCode });
    } catch (err) {
      console.error(err);
      setError("Es gab einen Fehler bei der Registrierung. Bitte versuche es später erneut.");
      base44.analytics.track({
        eventName: "ticketing_error",
        properties: {
          event_id: event.id,
          tier_id: tier.id,
          error: err.message,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onAbandoned("registration_form_closed");
    onBack();
  };

  return (
    <div>
      {tier && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <span className="font-semibold">{tier.name}</span> - {tier.price === 0 || !tier.price ? "Kostenlos" : `${tier.price} ${event.currency}`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Deine Daten</h2>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name" className="text-slate-700 font-medium">Vorname *</Label>
            <Input
              id="first_name"
              required
              value={form.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="last_name" className="text-slate-700 font-medium">Nachname *</Label>
            <Input
              id="last_name"
              required
              value={form.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-slate-700 font-medium">E-Mail *</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-slate-700 font-medium">Telefonnummer</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="mt-1"
          />
        </div>

        {event.invitation_options && event.invitation_options.length > 0 && (
          <div>
            <Label htmlFor="invited_by" className="text-slate-700 font-medium">Wie hast du von dieser Veranstaltung erfahren?</Label>
            <select
              id="invited_by"
              value={form.invited_by}
              onChange={(e) => handleChange("invited_by", e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
            >
              <option value="">-- Bitte wählen --</option>
              {event.invitation_options.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )}

        {parsedQuestions.length > 0 && (
          <div className="border-t border-slate-200 pt-6">
            {parsedQuestions.map((question, idx) => (
              <div key={idx} className="mb-4">
                <Label htmlFor={`custom_${idx}`} className="text-slate-700 font-medium">
                  {question.text}
                  {question.required && <span className="text-red-500"> *</span>}
                </Label>
                {question.type === "dropdown" ? (
                  <Select value={form.custom_answers[idx] || ""} onValueChange={(val) => handleCustomAnswerChange(idx, val)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="-- Bitte wählen --" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((opt, optIdx) => (
                        <SelectItem key={optIdx} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Textarea
                    id={`custom_${idx}`}
                    value={form.custom_answers[idx] || ""}
                    onChange={(e) => handleCustomAnswerChange(idx, e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-600"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Wird verarbeitet..." : tier ? "Tickets sichern" : "Registrieren"}
          </Button>
        </div>
      </form>
    </div>
  );
}