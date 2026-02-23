import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function ApprovalSuccessOverlay({ show, message = "Ticket erfolgreich versendet" }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            background: "rgba(7,7,7,0.7)",
            backdropFilter: "blur(6px)",
          }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            style={{
              background: "#0d1a00",
              border: "1px solid rgba(190,255,0,0.35)",
              borderRadius: "24px",
              padding: "48px 56px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              boxShadow: "0 0 60px rgba(190,255,0,0.15), 0 0 120px rgba(190,255,0,0.06)",
            }}
          >
            {/* Glow ring + checkmark */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 18 }}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(190,255,0,0.1)",
                border: "2px solid rgba(190,255,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 32px rgba(190,255,0,0.3)",
              }}
            >
              <CheckCircle2 style={{ width: "40px", height: "40px", color: "#beff00" }} />
            </motion.div>

            {/* Pulse ring */}
            <motion.div
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.8 }}
              transition={{ delay: 0.2, duration: 0.9, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "2px solid rgba(190,255,0,0.4)",
                pointerEvents: "none",
              }}
            />

            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#beff00", fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "8px" }}>
                Erfolg
              </p>
              <p style={{ color: "#ffffff", fontSize: "18px", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
                {message}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}