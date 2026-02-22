import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function RegistrationForm({ eventSettings, onSubmit, isSubmitting, isSuccess }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    plus_one: false,
    plus_one_name: "",
    plus_one_phone: "",
    plus_one_company: "",
    plus_one_custom_answer_1: "",
    plus_one_custom_answer_2: "",
    custom_answer_1: "",
    custom_answer_2: "",
    notes: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 px-6"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">
          Registrierung erfolgreich!
        </h2>
        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
          Vielen Dank für Ihre Anmeldung. Sie erhalten eine E-Mail, sobald Ihre
          Registrierung freigegeben wurde.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Vorname *</Label>
          <Input
            required
            value={form.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
            placeholder="Max"
            className="h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Nachname *</Label>
          <Input
            required
            value={form.last_name}
            onChange={(e) => handleChange("last_name", e.target.value)}
            placeholder="Mustermann"
            className="h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">E-Mail *</Label>
          <Input
            required
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="max@beispiel.de"
            className="h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Telefon</Label>
          <Input
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+49 123 456789"
            className="h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Company */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Firma / Organisation / Creator</Label>
        <Input
          value={form.company}
          onChange={(e) => handleChange("company", e.target.value)}
          placeholder="Firmenname oder Creator-Name"
          className="h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
        />
      </div>

      {/* Custom Questions */}
      {eventSettings?.custom_question_1 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            {eventSettings.custom_question_1}
          </Label>
          <Textarea
            value={form.custom_answer_1}
            onChange={(e) => handleChange("custom_answer_1", e.target.value)}
            className="min-h-[80px] border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
            placeholder="Ihre Antwort..."
          />
        </div>
      )}
      {eventSettings?.custom_question_2 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            {eventSettings.custom_question_2}
          </Label>
          <Textarea
            value={form.custom_answer_2}
            onChange={(e) => handleChange("custom_answer_2", e.target.value)}
            className="min-h-[80px] border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
            placeholder="Ihre Antwort..."
          />
        </div>
      )}

      {/* Plus One */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="plus_one"
            checked={form.plus_one}
            onCheckedChange={(checked) => handleChange("plus_one", checked)}
            className="border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
          />
          <Label htmlFor="plus_one" className="text-sm font-medium text-slate-700 cursor-pointer">
            Ich bringe eine Begleitperson mit
          </Label>
        </div>
        {form.plus_one && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-5 pl-7 border-l-2 border-amber-200 ml-2"
          >
            <p className="text-sm font-semibold text-slate-700 pt-1">Angaben zur Begleitperson</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Vorname *</Label>
                <Input
                  required
                  value={form.plus_one_name}
                  onChange={(e) => handleChange("plus_one_name", e.target.value)}
                  placeholder="Vorname"
                  className="h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Telefon</Label>
                <Input
                  value={form.plus_one_phone}
                  onChange={(e) => handleChange("plus_one_phone", e.target.value)}
                  placeholder="+49 123 456789"
                  className="h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Firma / Organisation / Creator</Label>
              <Input
                value={form.plus_one_company}
                onChange={(e) => handleChange("plus_one_company", e.target.value)}
                placeholder="Firmenname oder Creator-Name"
                className="h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            {eventSettings?.custom_question_1 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  {eventSettings.custom_question_1}
                </Label>
                <Textarea
                  value={form.plus_one_custom_answer_1}
                  onChange={(e) => handleChange("plus_one_custom_answer_1", e.target.value)}
                  className="min-h-[80px] border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                  placeholder="Antwort der Begleitperson..."
                />
              </div>
            )}
            {eventSettings?.custom_question_2 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  {eventSettings.custom_question_2}
                </Label>
                <Textarea
                  value={form.plus_one_custom_answer_2}
                  onChange={(e) => handleChange("plus_one_custom_answer_2", e.target.value)}
                  className="min-h-[80px] border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                  placeholder="Antwort der Begleitperson..."
                />
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Zusätzliche Anmerkungen</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          className="min-h-[80px] border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
          placeholder="Gibt es etwas, das wir wissen sollten?"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white text-base font-medium rounded-xl transition-all duration-200"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Registrierung absenden
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
}