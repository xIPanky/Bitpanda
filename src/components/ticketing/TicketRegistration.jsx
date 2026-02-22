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
    company: "",
  });
  const [hasPlusOne, setHasPlusOne] = useState(false);
  const [plusOne, setPlusOne] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
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

  const handlePlusOneChange = (field, value) => {
    setPlusOne(prev => ({ ...prev, [field]: value }));
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

        // Validate plus one if enabled
        if (hasPlusOne) {
          if (!plusOne.first_name.trim() || !plusOne.last_name.trim() || !plusOne.email.trim() || !plusOne.company.trim()) {
            setError("Bitte fülle alle Felder der Begleitung aus.");
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
          company: form.company || "",
          custom_answers: form.custom_answers,
          invited_by: form.invited_by || "",
          category: tier?.color || "Standard",
          status: "pending",
        });

        // Create ticket immediately
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

       // Create plus one registration if enabled
       if (hasPlusOne) {
         const plusOneReg = await base44.entities.Registration.create({
           event_id: event.id,
           ticket_tier_id: tier?.id || "",
           first_name: plusOne.first_name,
           last_name: plusOne.last_name,
           email: plusOne.email,
           company: plusOne.company || "",
           custom_answers: form.custom_answers,
           invited_by: form.invited_by || "",
           category: tier?.color || "Standard",
           status: "pending",
         });

         // Create ticket for plus one
         const plusOneTicketCode = `${plusOne.first_name[0]?.toUpperCase()}${plusOne.last_name[0]?.toUpperCase()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
         await base44.entities.Ticket.create({
           event_id: event.id,
           registration_id: plusOneReg.id,
           ticket_tier_id: tier?.id || "",
           ticket_code: plusOneTicketCode,
           guest_name: `${plusOne.first_name} ${plusOne.last_name}`,
           guest_email: plusOne.email,
           category: tier?.color || "Standard",
           status: "valid",
           email_sent: false,
         });
       }

      base44.analytics.track({
        eventName: "registration_submitted",
        properties: {
          event_id: event.id,
          tier_id: tier?.id,
          tier_name: tier?.name,
          has_plus_one: hasPlusOne,
        }
      });

      onComplete(registration);
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

         <div>
           <Label htmlFor="company" className="text-slate-700 font-medium">Unternehmen</Label>
           <Input
             id="company"
             value={form.company}
             onChange={(e) => handleChange("company", e.target.value)}
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

        <div className="border-t border-slate-200 pt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={hasPlusOne}
                onChange={(e) => setHasPlusOne(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer"
              />
              <span className="text-slate-700 font-medium">Ich komme mit einer Begleitung</span>
            </label>

            {hasPlusOne && (
              <div className="mt-4 space-y-4 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plus_one_first_name" className="text-slate-700 font-medium">Vorname *</Label>
                    <Input
                      id="plus_one_first_name"
                      value={plusOne.first_name}
                      onChange={(e) => handlePlusOneChange("first_name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plus_one_last_name" className="text-slate-700 font-medium">Nachname *</Label>
                    <Input
                      id="plus_one_last_name"
                      value={plusOne.last_name}
                      onChange={(e) => handlePlusOneChange("last_name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="plus_one_email" className="text-slate-700 font-medium">E-Mail *</Label>
                  <Input
                    id="plus_one_email"
                    type="email"
                    value={plusOne.email}
                    onChange={(e) => handlePlusOneChange("email", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="plus_one_company" className="text-slate-700 font-medium">Unternehmen *</Label>
                  <Input
                    id="plus_one_company"
                    value={plusOne.company}
                    onChange={(e) => handlePlusOneChange("company", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

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