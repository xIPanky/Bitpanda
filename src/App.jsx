import React, { useEffect, useMemo, useRef, useState } from "react";

const DISPLAY_BALANCE = "50.000€";
const GREEN = "#2CEC9A";
const RED = "#ff2d2d";
const WHITE = "#eafff5";
const DIM = "#7fbf9f";
const BG = "#030504";
const DARK_GREEN = "#10352d";

const EMPTY_FORMAT = "BP-____-____-____";

function formatCode(value) {
  const clean = value.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 14);

  const part1 = clean.slice(0, 2);
  const part2 = clean.slice(2, 6);
  const part3 = clean.slice(6, 10);
  const part4 = clean.slice(10, 14);

  let formatted = part1;
  if (part2) formatted += "-" + part2;
  if (part3) formatted += "-" + part3;
  if (part4) formatted += "-" + part4;

  return formatted;
}

function buildFormattedFromRaw(raw) {
  return formatCode(raw || "");
}

function getRawChars(formatted) {
  return (formatted || "").replace(/-/g, "").split("");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomChar() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return chars[Math.floor(Math.random() * chars.length)];
}

function buildMatrixFrames(formattedGuess, resultStatuses) {
  const slots = [];
  const rawChars = getRawChars(formattedGuess);
  let rawIndex = 0;

  for (let i = 0; i < EMPTY_FORMAT.length; i++) {
    const maskChar = EMPTY_FORMAT[i];
    if (maskChar === "-") {
      slots.push({
        type: "separator",
        value: "-",
        finalValue: "-",
        status: "separator",
      });
    } else {
      const finalValue = rawChars[rawIndex] || "_";
      const status = resultStatuses?.[rawIndex] || "empty";
      slots.push({
        type: "char",
        value: "_",
        finalValue,
        status,
      });
      rawIndex++;
    }
  }

  return slots;
}

function App() {
  const [guess, setGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [message, setMessage] = useState(">> ENTER ACCESS CODE");
  const [displaySlots, setDisplaySlots] = useState(() =>
    buildMatrixFrames("", [])
  );
  const inputRef = useRef(null);

  const rawLength = useMemo(() => guess.replace(/-/g, "").length, [guess]);

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
      setDisplaySlots((prev) =>
        prev.map((slot) => {
          if (slot.type === "separator") return slot;
          return {
            ...slot,
            value: randomChar(),
          };
        })
      );
    }, 65);

    return () => clearInterval(interval);
  }, [isDecrypting]);

  async function animateVerification(formattedGuess, resultStatuses) {
    const baseSlots = buildMatrixFrames(formattedGuess, resultStatuses);

    setDisplaySlots(
      baseSlots.map((slot) =>
        slot.type === "separator" ? slot : { ...slot, value: randomChar() }
      )
    );

    await sleep(900);

    for (let i = 0; i < baseSlots.length; i++) {
      const slot = baseSlots[i];

      if (slot.type === "separator") {
        setDisplaySlots((prev) => {
          const next = [...prev];
          next[i] = slot;
          return next;
        });
        continue;
      }

      for (let j = 0; j < 7; j++) {
        setDisplaySlots((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], value: randomChar() };
          return next;
        });
        await sleep(55);
      }

      setDisplaySlots((prev) => {
        const next = [...prev];
        next[i] = {
          ...slot,
          value: slot.finalValue,
        };
        return next;
      });

      await sleep(170);
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

      const request = fetch("/functions/submit-attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guess: submittedGuess,
        }),
      });

      const suspense = sleep(1800);
      const [res] = await Promise.all([request, suspense]);
      const data = await res.json();

      await animateVerification(submittedGuess, data.charResults || []);

      setIsDecrypting(false);

      if (data.isWinner) {
        setSuccessFlash(true);
        setMessage(">> ACCESS GRANTED // JACKPOT UNLOCKED");
        setTimeout(() => setSuccessFlash(false), 1000);
      } else {
        setErrorFlash(true);
        setMessage(">> ACCESS DENIED");
        setTimeout(() => setErrorFlash(false), 1000);
      }

      setTimeout(() => {
        setGuess("");
        setDisplaySlots(buildMatrixFrames("", []));
        inputRef.current?.focus();
      }, 700);
    } catch {
      setIsDecrypting(false);
      setErrorFlash(true);
      setMessage(">> ACCESS DENIED");
      setTimeout(() => setErrorFlash(false), 1000);
      setTimeout(() => {
        setGuess("");
        setDisplaySlots(buildMatrixFrames("", []));
        inputRef.current?.focus();
      }, 700);
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

        @keyframes flashRed {
          0% { opacity: 0; }
          10% { opacity: .12; }
          25% { opacity: .28; }
          40% { opacity: .14; }
          60% { opacity: .26; }
          100% { opacity: 0; }
        }

        @keyframes violentShake {
          0% { transform: translateX(0) scale(1); }
          10% { transform: translateX(-16px) rotate(-1deg) scale(1.01); }
          20% { transform: translateX(14px) rotate(1deg) scale(1.01); }
          30% { transform: translateX(-12px) rotate(-1deg); }
          40% { transform: translateX(12px) rotate(1deg); }
          50% { transform: translateX(-10px); }
          60% { transform: translateX(10px); }
          70% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
          100% { transform: translateX(0) scale(1); }
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
        }
      `}</style>

      <div style={styles.page}>
        {successFlash && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: GREEN,
              opacity: 0.08,
              pointerEvents: "none",
              animation: "flashGreen .8s ease-out",
              zIndex: 20,
            }}
          />
        )}

        {errorFlash && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: RED,
              opacity: 0.16,
              pointerEvents: "none",
              animation: "flashRed .9s ease-out",
              zIndex: 20,
            }}
          />
        )}

        <div
          style={{
            ...styles.wrapper,
            animation: errorFlash ? "violentShake .55s ease-out" : "none",
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
            {displaySlots.map((slot, index) => {
              if (slot.type === "separator") {
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
                    animation: isDecrypting ? "matrixPulse .7s infinite" : "none",
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
                  ? `0 0 20px ${RED}, 0 0 45px rgba(255,45,45,.35)`
                  : `0 0 14px rgba(44,236,154,.28)`,
              }}
            />

            <div style={styles.counter}>
              {rawLength}/14 CHARACTERS
            </div>

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
    color: TEXT,
    fontFamily: "Courier New, monospace",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
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

export default App;