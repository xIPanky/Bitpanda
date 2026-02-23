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

const features = [
  {
    icon: Star,
    title: "Exclusive Guestlist",
    desc: "Jede Registrierung wird persönlich geprüft. Nur handverlesene Gäste erhalten Zugang.",
  },
  {
    icon: Zap,
    title: "Premium Atmosphere",
    desc: "Kuratierte Musik, hochwertige Location und ein Ambiente, das du nicht vergisst.",
  },
  {
    icon: Users,
    title: "Creators & Brands",
    desc: "Brands, Creators und Unternehmer auf Augenhöhe. Networking auf einem anderen Level.",
  },
];

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
        {event.cover_image_url ? (
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

      {/* ─── EXPERIENCE ─── */}
      <section style={{ padding: "120px 24px", maxWidth: "1100px", margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: NEON, marginBottom: "12px" }}>Was dich erwartet</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", marginBottom: "60px", lineHeight: 1.05 }}>
            Eine Nacht,<br />die bleibt.
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "20px", padding: "36px 32px", cursor: "default", transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(190,255,0,0.2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1a"}
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(190,255,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", border: "1px solid rgba(190,255,0,0.12)" }}>
                  <Icon style={{ width: "20px", height: "20px", color: NEON }} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#fff", marginBottom: "10px", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── EVENT DETAILS ─── */}
      <section style={{ padding: "0 24px 120px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "24px", padding: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0" }}>
          {[
            event.date && { label: "Datum", icon: Calendar, value: formattedDate },
            event.time && { label: "Einlass", icon: Clock, value: `Ab ${event.time} Uhr` },
            event.location && { label: "Location", icon: MapPin, value: event.location },
          ].filter(Boolean).map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{ padding: "24px 32px", borderRight: i < arr.length - 1 ? "1px solid #1a1a1a" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Icon style={{ width: "14px", height: "14px", color: NEON }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#444" }}>{item.label}</span>
                </div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>{item.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── VIP MESSAGE ─── */}
      <section style={{ padding: "80px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(190,255,0,0.04) 0%, transparent 70%)" }} />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} style={{ position: "relative", maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ width: "48px", height: "2px", background: NEON, margin: "0 auto 32px", boxShadow: `0 0 12px ${NEON}` }} />
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "20px" }}>
            Dieses Event ist<br /><span style={{ color: NEON }}>Invite Only.</span>
          </h2>
          <p style={{ fontSize: "16px", color: "#555", lineHeight: 1.7, margin: "0 auto", maxWidth: "440px" }}>
            Jede Registrierung wird persönlich geprüft. Nicht jeder kommt rein — aber wenn du hier bist, bist du Teil von etwas Besonderem.
          </p>
          <div style={{ width: "48px", height: "2px", background: NEON, margin: "32px auto 0", boxShadow: `0 0 12px ${NEON}`, opacity: 0.4 }} />
        </motion.div>
      </section>

      {/* ─── REGISTRATION CTA ─── */}
      <section ref={ctaRef} style={{ padding: "100px 24px 140px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: NEON, marginBottom: "16px" }}>Guestlist</p>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: "16px" }}>
            Jetzt auf die<br />Gästeliste setzen
          </h2>
          <p style={{ fontSize: "16px", color: "#555", marginBottom: "48px", lineHeight: 1.6 }}>
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