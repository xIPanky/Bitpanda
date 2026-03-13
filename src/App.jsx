import React, { useEffect, useMemo, useRef, useState } from "react";

const DISPLAY_BALANCE = "50.000€";
const GREEN = "#2CEC9A";
const RED = "#ff4d4f";
const WHITE = "#EAFEF4";
const DIM = "#7FBF9F";
const BG = "#030504";
const DARK_GREEN = "#10352d";
const SLOT_MASK = "BP-____-____-____";

function formatCode(value) {
  const clean = String(value || "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 14);

  const p1 = clean.slice(0, 2);
  const p2 = clean.slice(2, 6);
  const p3 = clean.slice(6, 10);
  const p4 = clean.slice(10, 14);

  let out = p1;
  if (p2) out += "-" + p2;
  if (p3) out += "-" + p3;
  if (p4) out += "-" + p4;
  return out;
}

function rawFromFormatted(value) {
  return String(value || "").replace(/-/g, "");
}

function randomChar() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return chars[Math.floor(Math.random() * chars.length)];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSlots(guess, statuses) {
  const raw = rawFromFormatted(guess).split("");
  const slots = [];
  let rawIndex = 0;

  for (let i = 0; i < SLOT_MASK.length; i++) {
    const c = SLOT_MASK[i];

    if (c === "-") {
      slots.push({
        kind: "separator",
        value: "-",
        status: "separator",
      });
    } else {
      slots.push({
        kind: "char",
        value: raw[rawIndex] || "_",
        status: statuses && statuses[rawIndex] ? statuses[rawIndex] : "idle",
      });
      rawIndex++;
    }
  }

  return slots;
}

export default function App() {
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState(">> ENTER ACCESS CODE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [slots, setSlots] = useState(buildSlots("", []));
  const inputRef = useRef(null);

  const rawLength = useMemo(() => rawFromFormatted(guess).length, [guess]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const refocus = () => {
      if (!isSubmitting) inputRef.current?.focus();
    };

    window.addEventListener("click", refocus);
    window.addEventListener("keydown", refocus);

    return () => {
      window.removeEventListener("click", refocus);
      window.removeEventListener("keydown", refocus);
    };
  }, [isSubmitting]);

  useEffect(() => {
    if (!isDecrypting) return;

    const interval = setInterval(() => {
      setSlots((prev) =>
        prev.map((slot) =>
          slot.kind === "separator"
            ? slot
            : { ...slot, value: randomChar(), status: "scanning" }
        )
      );
    }, 70);

    return () => clearInterval(interval);
  }, [isDecrypting]);

  async function animateReveal(submittedGuess, charResults) {
    const finalSlots = buildSlots(submittedGuess, charResults);

    for (let i = 0; i < finalSlots.length; i++) {
      if (finalSlots[i].kind === "separator") continue;

      for (let j = 0; j < 5; j++) {
        setSlots((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], value: randomChar(), status: "scanning" };
          return next;
        });
        await sleep(35);
      }

      setSlots((prev) => {
        const next = [...prev];
        next[i] = finalSlots[i];
        return next;
      });

      await sleep(70);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!guess.trim() || isSubmitting) return;

    const submittedGuess = guess.trim().toUpperCase();

    try {
      setIsSubmitting(true);
      setIsDecrypting(true);
      setMessage(">> DECRYPTING ACCESS KEY");
      setSlots(buildSlots(submittedGuess, []));

      const request = fetch("/functions/submit-attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guess: submittedGuess,
        }),
      });

      await sleep(2000);

      const res = await request;
      const data = await res.json();

      setIsDecrypting(false);
      await animateReveal(submittedGuess, data.charResults || []);

      if (data.isWinner) {
        setSuccessFlash(true);
        setMessage(">> ACCESS GRANTED // JACKPOT UNLOCKED");
        setTimeout(() => setSuccessFlash(false), 900);
      } else {
        setErrorFlash(true);
        setMessage(">> ACCESS DENIED");
        setTimeout(() => setErrorFlash(false), 1100);
      }

      setTimeout(() => {
        setGuess("");
        setSlots(buildSlots("", []));
        inputRef.current?.focus();
      }, 1200);
    } catch (err) {
      setIsDecrypting(false);
      setErrorFlash(true);
      setMessage(">> ACCESS DENIED");
      setTimeout(() => setErrorFlash(false), 1100);

      setTimeout(() => {
        setGuess("");
        setSlots(buildSlots("", []));
        inputRef.current?.focus();
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${BG}; }

        @keyframes glow {
          0% { text-shadow: 0 0 10px rgba(44,236,154,.3); }
          50% { text-shadow: 0 0 28px rgba(44,236,154,.95), 0 0 44px rgba(44,236,154,.28); }
          100% { text-shadow: 0 0 10px rgba(44,236,154,.3); }
        }

        @keyframes blink {
          0%,49% { opacity: 1; }
          50%,100% { opacity: 0; }
        }

        @keyframes flashGreen {
          0% { opacity: 0; }
          20% { opacity: .16; }
          45% { opacity: .08; }
          100% { opacity: 0; }
        }

        @keyframes errorOverlayIn {
          0% { opacity: 0; backdrop-filter: blur(0px); }
          100% { opacity: 1; backdrop-filter: blur(4px); }
        }

        @keyframes errorPulse {
          0% { transform: scale(1); opacity: .75; }
          50% { transform: scale(1.015); opacity: 1; }
          100% { transform: scale(1); opacity: .75; }
        }

        @keyframes errorGlitch {
          0% { transform: translateX(0); filter: blur(0px); }
          20% { transform: translateX(-6px); filter: blur(.4px); }
          40% { transform: translateX(5px); filter: blur(0px); }
          60% { transform: translateX(-3px); filter: blur(.2px); }
          80% { transform: translateX(2px); filter: blur(0px); }
          100% { transform: translateX(0); filter: blur(0px); }
        }

        @keyframes errorLine {
          0% { transform: translateY(-120%); opacity: 0; }
          20% { opacity: .6; }
          100% { transform: translateY(120vh); opacity: 0; }
        }

        @keyframes errorTextReveal {
          0% { opacity: 0; transform: translateY(10px) scale(.98); letter-spacing: 2px; }
          100% { opacity: 1; transform: translateY(0) scale(1); letter-spacing: 1px; }
        }

        @keyframes matrixPulse {
          0% { opacity: .7; }
          50% { opacity: 1; }
          100% { opacity: .7; }
        }

        @media (max-width: 900px) {
          .prize {
            font-size: 64px !important;
          }

          .title {
            font-size: 34px !important;
          }

          .input-main {
            font-size: 22px !important;
            padding: 20px !important;
          }

          .button-main {
            font-size: 22px !important;
            padding: 20px !important;
          }

          .slot-char {
            width: 38px !important;
            height: 50px !important;
            font-size: 24px !important;
          }

          .slot-sep {
            width: 16px !important;
            font-size: 24px !important;
          }

          .error-title {
            font-size: 32px !important;
          }
        }
      `}</style>

      <div style={styles.page}>
        {successFlash && <div style={styles.greenFlash} />}

        {errorFlash && (
          <div style={styles.errorOverlay}>
            <div style={styles.errorGlow} />
            <div style={styles.errorScanline} />
            <div style={styles.errorModal}>
              <div style={styles.errorLabel}>SECURITY RESPONSE</div>
              <div className="error-title" style={styles.errorTitle}>
                ACCESS DENIED
              </div>
              <div style={styles.errorSub}>INVALID CODE</div>
            </div>
          </div>
        )}

        <div
          style={{
            ...styles.wrapper,
            animation: errorFlash ? "errorGlitch .45s ease-out" : "none",
          }}
        >
          <div style={styles.header}>BITPANDA PRESENTS</div>

          <div className="prize" style={styles.prize}>
            WIN {DISPLAY_BALANCE}
          </div>

          <div className="title" style={styles.title}>
            CRACK THE WALLET
          </div>

          <div style={styles.lengthInfo}>14 CHARACTERS REQUIRED</div>

          <div style={styles.slotRow}>
            {slots.map((slot, index) => {
              if (slot.kind === "separator") {
                return (
                  <div key={index} className="slot-sep" style={styles.slotSep}>
                    -
                  </div>
                );
              }

              const borderColor =
                slot.status === "correct"
                  ? GREEN
                  : slot.status === "wrong"
                  ? RED
                  : "rgba(44,236,154,.25)";

              const textColor =
                slot.status === "correct"
                  ? GREEN
                  : slot.status === "wrong"
                  ? RED
                  : WHITE;

              return (
                <div
                  key={index}
                  className="slot-char"
                  style={{
                    ...styles.slotChar,
                    borderColor,
                    color: textColor,
                    animation:
                      slot.status === "scanning"
                        ? "matrixPulse .7s infinite"
                        : "none",
                  }}
                >
                  {slot.value}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              ref={inputRef}
              autoFocus
              className="input-main"
              value={guess}
              onChange={(e) => setGuess(formatCode(e.target.value))}
              placeholder="ENTER ACCESS CODE"
              maxLength={17}
              disabled={isSubmitting}
              style={{
                ...styles.input,
                borderColor: errorFlash ? RED : GREEN,
                boxShadow: errorFlash
                  ? `0 0 0 1px rgba(255,77,79,.35), 0 0 18px rgba(255,77,79,.18), 0 0 36px rgba(255,77,79,.08)`
                  : `0 0 14px rgba(44,236,154,.28)`,
              }}
            />

            <div style={styles.counter}>{rawLength}/14 CHARACTERS</div>

            <button
              className="button-main"
              disabled={isSubmitting}
              style={{
                ...styles.button,
                opacity: isSubmitting ? 0.78 : 1,
              }}
            >
              {isSubmitting ? "DECRYPTING..." : "UNLOCK WALLET"}
            </button>
          </form>

          <div
            style={{
              ...styles.console,
              color: errorFlash ? RED : GREEN,
            }}
          >
            {message}
            <span style={styles.cursor}>█</span>
          </div>

          <div style={styles.footer}>SPONSORED BY BITPANDA</div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: `radial-gradient(circle at top, ${DARK_GREEN} 0%, ${BG} 45%)`,
    color: WHITE,
    fontFamily: "Courier New, monospace",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  greenFlash: {
    position: "fixed",
    inset: 0,
    background: GREEN,
    opacity: 0.08,
    pointerEvents: "none",
    animation: "flashGreen .8s ease-out",
    zIndex: 20,
  },

  errorOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(8, 8, 10, 0.58)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    pointerEvents: "none",
    animation: "errorOverlayIn .18s ease-out forwards",
  },

  errorGlow: {
    position: "absolute",
    width: "55vw",
    height: "55vw",
    maxWidth: 700,
    maxHeight: 700,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,77,79,.18) 0%, rgba(255,77,79,.08) 30%, rgba(255,77,79,0) 70%)",
    animation: "errorPulse .8s ease-in-out infinite",
    filter: "blur(10px)",
  },

  errorScanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 120,
    background:
      "linear-gradient(to bottom, rgba(255,77,79,0), rgba(255,77,79,.18), rgba(255,77,79,0))",
    animation: "errorLine .65s ease-out",
  },

  errorModal: {
    position: "relative",
    padding: "28px 34px",
    minWidth: 320,
    maxWidth: "80vw",
    border: "1px solid rgba(255,77,79,.25)",
    background: "rgba(12,12,14,.72)",
    boxShadow:
      "0 20px 60px rgba(0,0,0,.35), 0 0 30px rgba(255,77,79,.08) inset",
    backdropFilter: "blur(10px)",
    textAlign: "center",
    animation: "errorTextReveal .22s ease-out forwards",
  },

  errorLabel: {
    color: "rgba(255,255,255,.58)",
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
  },

  errorTitle: {
    color: RED,
    fontSize: 42,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: 1,
    textShadow: "0 0 22px rgba(255,77,79,.18)",
  },

  errorSub: {
    marginTop: 12,
    color: "rgba(255,255,255,.72)",
    fontSize: 14,
    letterSpacing: 1.4,
  },

  wrapper: {
    textAlign: "center",
    maxWidth: 1080,
    width: "100%",
    padding: 40,
    position: "relative",
    zIndex: 2,
  },

  header: {
    color: GREEN,
    letterSpacing: 2,
    fontSize: 14,
    marginBottom: 20,
  },

  prize: {
    fontSize: 92,
    fontWeight: 900,
    color: GREEN,
    animation: "glow 3s infinite",
    marginBottom: 10,
    lineHeight: 0.95,
  },

  title: {
    fontSize: 44,
    marginBottom: 20,
    color: WHITE,
    letterSpacing: 1.4,
  },

  lengthInfo: {
    color: DIM,
    fontSize: 16,
    letterSpacing: 1.3,
    marginBottom: 18,
  },

  slotRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 30,
    flexWrap: "wrap",
  },

  slotChar: {
    width: 48,
    height: 62,
    border: "2px solid rgba(44,236,154,.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 30,
    fontWeight: 700,
    background: "rgba(255,255,255,.02)",
  },

  slotSep: {
    width: 20,
    fontSize: 30,
    color: GREEN,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  form: {
    display: "grid",
    gap: 14,
    maxWidth: 680,
    margin: "0 auto",
  },

  input: {
    padding: "24px",
    fontSize: 30,
    textAlign: "center",
    border: `2px solid ${GREEN}`,
    background: "#010302",
    color: GREEN,
    outline: "none",
    fontFamily: "Courier New, monospace",
  },

  counter: {
    color: DIM,
    fontSize: 14,
    letterSpacing: 1.2,
  },

  button: {
    padding: "24px",
    fontSize: 26,
    background: GREEN,
    border: `2px solid ${GREEN}`,
    color: "#04110b",
    fontWeight: 900,
    cursor: "pointer",
    letterSpacing: 1.2,
  },

  console: {
    marginTop: 30,
    fontSize: 18,
    minHeight: 28,
  },

  cursor: {
    animation: "blink 1s infinite",
  },

  footer: {
    marginTop: 44,
    fontSize: 12,
    opacity: 0.72,
    color: GREEN,
    letterSpacing: 1.2,
  },
};