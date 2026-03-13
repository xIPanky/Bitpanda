import React, { useEffect, useRef, useState } from "react";

const DISPLAY_BALANCE = "50.000€";

const GREEN = "#2CEC9A";
const RED = "#ff2d2d";
const DARK_GREEN = "#10352d";
const BG = "#030504";
const TEXT = "#b6ffd8";

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

function randomMatrixLine(length = 18) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
    if (i === 1 || i === 5 || i === 9) out += "-";
  }
  return out.slice(0, 17);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function App() {
  const [guess, setGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [message, setMessage] = useState(">> ENTER CODE");
  const [matrixLine1, setMatrixLine1] = useState(randomMatrixLine());
  const [matrixLine2, setMatrixLine2] = useState(randomMatrixLine());
  const [matrixLine3, setMatrixLine3] = useState(randomMatrixLine());
  const [clock, setClock] = useState(new Date());

  const inputRef = useRef(null);

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
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isDecrypting) return;

    const interval = setInterval(() => {
      setMatrixLine1(randomMatrixLine());
      setMatrixLine2(randomMatrixLine());
      setMatrixLine3(randomMatrixLine());
    }, 70);

    return () => clearInterval(interval);
  }, [isDecrypting]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!guess.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setIsDecrypting(true);
      setMessage(">> DECRYPTING ACCESS KEY");

      const fetchPromise = fetch("/functions/submit-attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "guest",
          guess: guess.trim().toUpperCase(),
        }),
      });

      const minimumSuspense = sleep(5000);

      const [res] = await Promise.all([fetchPromise, minimumSuspense]);

      const data = await res.json();

      setIsDecrypting(false);

      if (data.isWinner) {
        setSuccessFlash(true);
        setMessage(">> ACCESS GRANTED // JACKPOT UNLOCKED");
        setTimeout(() => setSuccessFlash(false), 900);
      } else {
        setMessage(">> ACCESS DENIED");
        setErrorFlash(true);
        setTimeout(() => setErrorFlash(false), 900);
      }

      setGuess("");

      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    } catch {
      setIsDecrypting(false);
      setMessage(">> ACCESS DENIED");
      setErrorFlash(true);
      setGuess("");

      setTimeout(() => {
        setErrorFlash(false);
        inputRef.current?.focus();
      }, 900);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: ${BG};
        }

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

        @keyframes glitchRed {
          0% { text-shadow: 0 0 0 transparent; }
          20% { text-shadow: -3px 0 ${RED}, 3px 0 rgba(255,255,255,.15); }
          40% { text-shadow: 3px 0 ${RED}, -3px 0 rgba(255,255,255,.12); }
          60% { text-shadow: -2px 0 ${RED}, 2px 0 rgba(255,255,255,.12); }
          100% { text-shadow: 0 0 0 transparent; }
        }

        @keyframes matrixPulse {
          0% { opacity: .65; }
          50% { opacity: 1; }
          100% { opacity: .65; }
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

        {isDecrypting && (
          <div style={styles.decryptOverlay}>
            <div style={styles.decryptBox}>
              <div style={styles.decryptTitle}>DECRYPTING WALLET ACCESS</div>
              <div style={styles.decryptLine}>{matrixLine1}</div>
              <div style={styles.decryptLine}>{matrixLine2}</div>
              <div style={styles.decryptLine}>{matrixLine3}</div>
              <div style={styles.decryptSub}>MATRIX SCAN IN PROGRESS...</div>
            </div>
          </div>
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
                animation: errorFlash ? "glitchRed .45s linear" : "none",
              }}
            />

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
    maxWidth: 980,
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
    marginBottom: 40,
    color: "#eafff5",
    letterSpacing: 1.4,
  },

  form: {
    display: "grid",
    gap: 20,
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

  decryptOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.86)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15,
    padding: 20,
  },

  decryptBox: {
    width: "100%",
    maxWidth: 820,
    border: `1px solid rgba(44,236,154,.35)`,
    background: "#020403",
    padding: 28,
    boxShadow: `0 0 30px rgba(44,236,154,.14) inset, 0 0 30px rgba(44,236,154,.08)`,
    textAlign: "left",
  },

  decryptTitle: {
    color: GREEN,
    fontSize: 16,
    marginBottom: 18,
    letterSpacing: 1.8,
  },

  decryptLine: {
    color: GREEN,
    fontSize: 30,
    lineHeight: 1.5,
    animation: "matrixPulse .8s infinite",
    wordBreak: "break-all",
  },

  decryptSub: {
    marginTop: 22,
    color: "#cffff0",
    fontSize: 14,
    letterSpacing: 1.2,
  },
};

export default App;