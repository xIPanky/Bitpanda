import React, { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Calendar, MapPin, Clock, Loader2, ChevronDown, Star, Users, Zap } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";

const NEON = "#beff00";

function GlowButton({ children, onClick, fullWidth, large }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        background: NEON,
        color: "#070707",
        border: "none",
        borderRadius: "14px",
        padding: large ? "18px 48px" : "14px 36px",
        fontSize: large ? "16px" : "14px",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
        width: fullWidth ? "100%" : "auto",
        transition: "box-shadow 0.2s, transform 0.15s",
        boxShadow: hov ? `0 0 40px rgba(190,255,0,0.55), 0 0 80px rgba(190,255,0,0.2)` : `0 0 20px rgba(190,255,0,0.25)`,
        transform: hov ? "translateY(-2px)" : "none",
      }}
    >
      {children}
    </button>
  );
}

export default function EventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");
  const ctaRef = useRef(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }).then(res => res[0]),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      base44.analytics.track({
        eventName: "event_details_viewed",
        properties: { event_id: eventId, event_name: event.name }
      });
    }
  }, [event, eventId]);

  const scrollToCTA = () => ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const navigateToTickets = () => {
    base44.analytics.track({ eventName: "tickets_cta_clicked", properties: { event_id: eventId, event_name: event?.name } });
    window.location.href = createPageUrl(`EventTicketing?event_id=${eventId}`);
  };

  if (!eventId) return <div style={{ background: "#070707", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontFamily: "sans-serif" }}>Event nicht gefunden.</div>;
  if (isLoading) return <div style={{ background: "#070707", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#333" }} /></div>;
  if (!event) return <div style={{ background: "#070707", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Event nicht gefunden.</div>;

  const formattedDate = event.date ? format(new Date(event.date), "EEEE, dd. MMMM yyyy", { locale: de }) : null;

  return (
    <div style={{ background: "#070707", minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", color: "#fff", overflowX: "hidden" }}>

      {/* ─── HERO ─── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {/* Background */}
        {event.cover_video_url ? (
          <video
            src={event.cover_video_url}
            autoPlay muted loop playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
          />
        ) : event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: event.cover_image_position || "50% 50%", zIndex: 0 }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 40%, rgba(190,255,0,0.07) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(0,50,120,0.12) 0%, transparent 60%), #070707", zIndex: 0 }} />
        )}

        {/* Layered overlays for cinematic depth */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(7,7,7,0.3) 0%, rgba(7,7,7,0.1) 40%, rgba(7,7,7,0.85) 80%, #070707 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(190,255,0,0.04) 0%, transparent 70%)", zIndex: 1 }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "900px", margin: "0 auto", padding: "60px 24px 80px", width: "100%" }}>

          {/* Eyebrow */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", padding: "6px 16px", borderRadius: "100px", background: "rgba(190,255,0,0.08)", border: "1px solid rgba(190,255,0,0.2)" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: NEON, display: "block", boxShadow: `0 0 8px ${NEON}` }} />
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: NEON }}>Invite Only · Exclusive Event</span>
          </motion.div>

          {/* Title */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ fontSize: "clamp(3rem, 10vw, 7rem)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.03em", color: "#fff", marginBottom: "24px", textTransform: "uppercase" }}>
            {event.name}
          </motion.h1>

          {/* Subtitle */}
          {event.subtitle && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "rgba(255,255,255,0.5)", marginBottom: "32px", fontWeight: 400, maxWidth: "560px" }}>
              {event.subtitle}
            </motion.p>
          )}

          {/* Meta row */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "40px" }}>
            {formattedDate && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar style={{ width: "15px", height: "15px", color: NEON, flexShrink: 0 }} />
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{formattedDate}</span>
              </div>
            )}
            {event.time && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock style={{ width: "15px", height: "15px", color: NEON, flexShrink: 0 }} />
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Ab {event.time} Uhr</span>
              </div>
            )}
            {event.location && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin style={{ width: "15px", height: "15px", color: NEON, flexShrink: 0 }} />
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{event.location}</span>
              </div>
            )}
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <GlowButton large onClick={scrollToCTA}>
              Jetzt Registrieren
            </GlowButton>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Limitierte Plätze verfügbar</span>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 2, cursor: "pointer" }}
          onClick={scrollToCTA}>
          <ChevronDown style={{ width: "24px", height: "24px", color: "rgba(255,255,255,0.2)" }} />
        </motion.div>
      </section>

<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
  style={{
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: "24px",
    padding: "42px 36px",
    maxWidth: "900px",
    margin: "70px auto 80px", // ⭐ DAS zentriert den Block
    textAlign: "center",  // ⭐ Text mittig
  }}

>
  <p
    style={{
      fontSize: "18px",
      lineHeight: 1.7,
      color: "#cfcfcf",
      margin: 0,
      whiteSpace: "pre-line",
    }}
  >
    {event.description || "Beschreibung folgt in Kürze."}
  </p>
</motion.div>

{/* ─── EVENT DETAILS — CINEMATIC MODE ─── */}
<section
  style={{
    padding: "20px 24px 20px",
    maxWidth: "900px",
    margin: "0 auto",
  }}
>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    style={{
      position: "relative",
      borderRadius: "30px",
      padding: "32px",
      overflow: "hidden",
      background: "rgba(12,12,12,0.75)",
      border: "1px solid rgba(190,255,0,0.15)",
      backdropFilter: "blur(14px)",
      boxShadow:
        "0 0 60px rgba(190,255,0,0.08), inset 0 0 50px rgba(255,255,255,0.02)",
    }}
  >
    {/* animated neon gradient */}
    <motion.div
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(circle at 20% 0%, rgba(190,255,0,0.12), transparent 60%)",
        backgroundSize: "200% 200%",
        pointerEvents: "none",
      }}
    />

    {/* GRID */}
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
      }}
    >
      {[
        event.date && {
          label: "Datum",
          icon: Calendar,
          value: formattedDate,
        },
        event.time && {
          label: "Einlass",
          icon: Clock,
          value: `Ab ${event.time} Uhr`,
        },
        event.location && {
          label: "Location",
          icon: MapPin,
          value: event.location,
        },
      ]
        .filter(Boolean)
        .map((item, i) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={i}
              whileHover={{
                y: -6,
                scale: 1.02,
              }}
              transition={{ duration: 0.25 }}
              style={{
                position: "relative",
                borderRadius: "18px",
                padding: "22px 20px",
                background:
                  "linear-gradient(180deg,#141414 0%, #0d0d0d 100%)",
                border: "1px solid #1f1f1f",
                boxShadow: "0 0 20px rgba(0,0,0,0.35)",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  "rgba(190,255,0,0.35)";
                e.currentTarget.style.boxShadow =
                  "0 0 40px rgba(190,255,0,0.16)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1f1f1f";
                e.currentTarget.style.boxShadow =
                  "0 0 20px rgba(0,0,0,0.35)";
              }}
            >
              {/* moving glow */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at top left, rgba(190,255,0,0.08), transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "10px",
                    background: "rgba(190,255,0,0.1)",
                    border: "1px solid rgba(190,255,0,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 14px rgba(190,255,0,0.2)",
                  }}
                >
                  <Icon
                    style={{
                      width: "14px",
                      height: "14px",
                      color: NEON,
                    }}
                  />
                </div>

                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#666",
                  }}
                >
                  {item.label}
                </span>
              </div>

              {/* VALUE */}
              <p
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#fff",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {item.value}
              </p>
            </motion.div>
          );
        })}
    </div>
  </motion.div>
</section>

      {/* ─── REGISTRATION CTA ─── */}
      <section ref={ctaRef} style={{ padding: "100px 24px 140px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: NEON, marginBottom: "16px" }}>Guestlist</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: "16px" }}>
            Jetzt auf die<br />Gästeliste setzen
          </h2>
          <p style={{ fontSize: "16px", color: "#555", marginBottom: "24px", lineHeight: 1.6 }}>
            Sichere dir deinen Platz. Limitierte Kapazität.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <GlowButton large onClick={navigateToTickets}>
              Ticket sichern →
            </GlowButton>
            <p style={{ fontSize: "12px", color: "#333", letterSpacing: "0.05em" }}>100% kostenlos · Registrierung dauert 60 Sekunden</p>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: "1px solid #111", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: "11px", color: "#2a2a2a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {event.name} · powered by Synergy
        </p>
      </footer>
    </div>
  );
}