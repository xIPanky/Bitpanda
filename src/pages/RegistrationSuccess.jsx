import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { CheckCircle2, Mail, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export default function RegistrationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { eventId } = state;
  const urlParams = new URLSearchParams(window.location.search);
  const registrationId = urlParams.get("registration_id");
  const eventIdParam = urlParams.get("event_id");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    // Show email confirmation toast
    const timer = setTimeout(() => {
      toast.success("Bestätigung wurde per E-Mail gesendet", { duration: 4000 });
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const { data: registration } = useQuery({
    queryKey: ["registration", registrationId],
    queryFn: () => registrationId ? base44.entities.Registration.filter({ id: registrationId }) : Promise.resolve([]),
    select: (data) => data?.[0],
    enabled: !!registrationId,
  });

  const { data: event } = useQuery({
    queryKey: ["event", eventIdParam],
    queryFn: () => eventIdParam ? base44.entities.Event.filter({ id: eventIdParam }) : Promise.resolve([]),
    select: (data) => data?.[0],
    enabled: !!eventIdParam,
  });

  const isApproved = registration?.status === "approved";
  const isPending = registration?.status === "pending";

  // Step indicator config
  const steps = [
    { label: "Registriert", completed: !!registration },
    { label: "In Prüfung", completed: isApproved },
    { label: "Genehmigt", completed: isApproved },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: reducedMotion ? 0 : 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0.1 : 0.4 } },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: reducedMotion ? 1 : 0.85 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: reducedMotion ? 0.1 : 0.5, ease: "easeOut" },
    },
  };

  const pulseVariants = {
    hidden: { boxShadow: "0 0 0 0 rgba(190, 255, 0, 0)" },
    visible: reducedMotion
      ? { boxShadow: "0 0 0 0 rgba(190, 255, 0, 0)" }
      : {
          boxShadow: [
            "0 0 0 0 rgba(190, 255, 0, 0.4)",
            "0 0 0 12px rgba(190, 255, 0, 0)",
          ],
          transition: { duration: 1.2, ease: "easeOut", delay: 0.3 },
        },
  };

  const stepLineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        duration: reducedMotion ? 0.1 : 0.7,
        ease: "easeOut",
        delay: reducedMotion ? 0 : 0.5,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0.1 : 0.4 } },
    hover: {
      scale: reducedMotion ? 1 : 1.02,
      boxShadow: reducedMotion ? "none" : "0 0 24px rgba(190, 255, 0, 0.3)",
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.98 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#070707" }}>
      <motion.div
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Step Indicator */}
        <motion.div className="mb-12" variants={itemVariants}>
          <div className="flex items-center justify-between relative">
            {steps.map((step, idx) => {
              const isCompleted = step.completed;
              const isCurrent = idx < steps.length - 1 && steps[idx + 1].completed ? true : idx === 0;

              return (
                <React.Fragment key={idx}>
                  {/* Step Circle */}
                  <motion.div
                    className="flex flex-col items-center flex-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reducedMotion ? 0 : 0.1 + idx * 0.1, duration: 0.3 }}
                  >
                    <motion.div
                      className="relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{
                        background: isCompleted ? "#beff00" : "#111",
                        border: isCompleted ? "none" : "1px solid #222",
                        color: isCompleted ? "#070707" : "#555",
                      }}
                      variants={pulseVariants}
                      initial="hidden"
                      animate={isCompleted ? "visible" : "hidden"}
                    >
                      {isCompleted ? (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                          ✓
                        </motion.div>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </motion.div>
                    <span
                      className="text-[10px] font-semibold mt-2 text-center uppercase tracking-wider"
                      style={{ color: isCompleted ? "#beff00" : "#333", transition: "color 0.3s" }}
                    >
                      {step.label}
                    </span>
                  </motion.div>

                  {/* Progress Line */}
                  {idx < steps.length - 1 && (
                    <motion.div
                      className="h-1 flex-1 mx-2 mb-6 rounded-full origin-left"
                      style={{
                        background: isCompleted ? "#beff00" : "#111",
                        transition: "background 0.4s",
                      }}
                      variants={stepLineVariants}
                      initial="hidden"
                      animate={isCompleted ? "visible" : "hidden"}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        {/* Success Icon */}
        <motion.div
          className="flex justify-center mb-8"
          variants={iconVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="relative flex items-center justify-center w-20 h-20 rounded-full"
            style={{ background: "rgba(190, 255, 0, 0.1)", border: "1px solid rgba(190, 255, 0, 0.2)" }}
            variants={pulseVariants}
            initial="hidden"
            animate="visible"
          >
            <CheckCircle2 className="w-12 h-12" style={{ color: "#beff00" }} />
          </motion.div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-3xl md:text-4xl font-bold mb-4 text-center"
          style={{ color: "#ffffff" }}
          variants={itemVariants}
        >
          Registrierung eingegangen
        </motion.h1>

        {/* Body Text */}
        <motion.p
          className="text-center mb-8 leading-relaxed"
          style={{ color: "#888", fontSize: "15px" }}
          variants={itemVariants}
        >
          Vielen Dank für deine Registrierung! Wir überprüfen deine Anmeldung und senden dir alle Details per E-Mail, sobald es genehmigt wurde.
        </motion.p>

        {/* Info Card */}
        <motion.div
          className="rounded-xl p-4 mb-8"
          style={{ background: "rgba(190, 255, 0, 0.05)", border: "1px solid rgba(190, 255, 0, 0.1)" }}
          variants={itemVariants}
        >
          <div className="flex gap-3">
            <Mail className="w-5 h-5 flex-shrink-0" style={{ color: "#beff00" }} />
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: "#beff00" }}>
                {isPending ? "Bestätigung ausstehend" : "E-Mail wird gesendet"}
              </p>
              <p className="text-xs mt-1" style={{ color: "#666" }}>
                {isPending
                  ? "Überprüfe dein Postfach (und Spam-Ordner) auf Updates."
                  : "Du erhältst dein Ticket und alle Details per E-Mail."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          style={{
            background: "#beff00",
            color: "#070707",
            border: "none",
            cursor: "pointer",
          }}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={() => navigate(createPageUrl(`EventDetails?event_id=${eventIdParam || eventId}`))}
        >
          Zur Veranstaltungsseite
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}