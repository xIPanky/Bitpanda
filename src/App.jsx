import React, { useEffect, useState } from "react";

const WALLET_MASK = "BP-7X9A-__Q4-__K8";
const DISPLAY_BALANCE = "50.000€";
const BITPANDA_GREEN = "#2CEC9A";
const DARK_GREEN = "#10352d";
const BG = "#030504";
const TEXT = "#b6ffd8";
const DIM = "#72d9a7";

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

function App() {
  const [guess, setGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHacking, setIsHacking] = useState(false);
  const [message, setMessage] = useState(">> ENTER THE CODE TO UNLOCK THE PRIZE");
  const [displayMessage, setDisplayMessage] = useState(">> ENTER THE CODE TO UNLOCK THE PRIZE");
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let i = 0;
    setDisplayMessage("");

    const text = message;
    const interval = setInterval(() => {
      i++;
      setDisplayMessage(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);

    return () => clearInterval(interval);
  }, [message]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!guess.trim()) {
      setMessage(">> PLEASE ENTER A CODE");
      return;
    }

    try {
      setIsSubmitting(true);
      setIsHacking(true);
      setMessage(">> VERIFYING INPUT ...");

      const res = await fetch("/functions/submit-attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "guest",
          guess: guess.trim().toUpperCase(),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Request failed");
      }

      const data = await res.json();

      setMessage(
        data.isWinner
          ? ">> ACCESS GRANTED // JACKPOT UNLOCKED"
          : data.message || ">> ACCESS DENIED"
      );

      setGuess("");

      setTimeout(() => {
        setIsHacking(false);
      }, 700);
    } catch (error) {
      setIsHacking(false);
      setMessage(">> ERROR: " + (error.message || "UNKNOWN ERROR"));
      setGuess("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${BG}; }

        @keyframes pulseGlow {
          0% { text-shadow: 0 0 8px rgba(44,236,154,.25), 0 0 18px rgba(44,236,154,.12); }
          50% { text-shadow: 0 0 18px rgba(44,236,154,.65), 0 0 32px rgba(44,236,154,.22); }
          100% { text-shadow: 0 0 8px rgba(44,236,154,.25), 0 0 18px rgba(44,236,154,.12); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes blinkCursor {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        @keyframes softFlicker {
          0% { opacity: .97; }
          50% { opacity: 1; }
          100% { opacity: .98; }
        }

        @keyframes terminalFlash {
          0% { opacity: 0; }
          30% { opacity: .08; }
          100% { opacity: 0; }
        }

        @media (max-width: 900px) {
          .main-wrap {
            padding: 28px 16px !important;
          }

          .prize {
            font-size: 64px !important;
          }

          .headline {
            font-size: 34px !important;
          }

          .wallet-line {
            font-size: 24px !important;
          }
        }
      `}</style>

      <div style={styles.page}>
        {isHacking && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: BITPANDA_GREEN,
              opacity: 0.06,
              pointerEvents: "none",
              animation: "terminalFlash .5s ease-out",
              zIndex: 5,
            }}
          />
        )}

        <div style={styles.scanlines} />

        <div className="main-wrap" style={styles.wrapper}>
          <div style={styles.topBar}>
            <div style={styles.brand}>BITPANDA PRESENTS</div>
            <div style={styles.clock}>{clock.toLocaleTimeString("de-DE")}</div>
          </div>

          <main style={styles.centerStage}>
            <div className="prize" style={styles.prize}>
              WIN {DISPLAY_BALANCE}
            </div>

            <div className="headline" style={styles.headline}>
              CRACK THE WALLET
            </div>

            <div style={styles.subline}>
              Enter the hidden code and unlock the prize.
            </div>

            <div
              className="wallet-line"
              style={{
                ...styles.walletLine,
                textShadow: isHacking
                  ? "0 0 14px rgba(44,236,154,.7), 0 0 24px rgba(44,236,154,.3)"
                  : styles.walletLine.textShadow,
              }}
            >
              {guess || WALLET_MASK}
            </div>

            <div style={styles.hintBox}>
              Type the code without dashes — they appear automatically.
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                style={{
                  ...styles.input,
                  boxShadow: isHacking
                    ? "0 0 18px rgba(44,236,154,.45), 0 0 30px rgba(44,236,154,.15)"
                    : "none",
                }}
                value={guess}
                onChange={(e) => setGuess(formatCode(e.target.value))}
                placeholder="BP-XXXX-XXXX-XXXX"
                maxLength={17}
                disabled={isSubmitting}
              />

              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "VERIFYING..." : "UNLOCK WALLET"}
              </button>
            </form>

            <div style={styles.console}>
              <div style={styles.consoleTitle}>SYSTEM LOG</div>
              <div>
                {displayMessage}
                <span style={styles.consoleCursor}>█</span>
              </div>
            </div>

            <div style={styles.footer}>
              <span>SPONSORED BY BITPANDA</span>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: `radial-gradient(circle at top, ${DARK_GREEN} 0%, ${BG} 42%)`,
    color: TEXT,
    fontFamily: "'Courier New', 'Lucida Console', Monaco, monospace",
    position: "relative",
    overflow: "hidden",
    animation: "softFlicker 4.2s ease-in-out infinite",
  },
  scanlines: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    background:
      "repeating-linear-gradient(to bottom, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 2px, transparent 4px)",
    opacity: 0.08,
    mixBlendMode: "screen",
  },
  wrapper: {
    minHeight: "100vh",
    padding: "28px 24px",
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    animation: "fadeUp .45s ease-out",
  },
  brand: {
    color: BITPANDA_GREEN,
    fontSize: 14,
    letterSpacing: 2,
    textShadow: `0 0 8px ${BITPANDA_GREEN}`,
  },
  clock: {
    color: DIM,
    fontSize: 13,
  },
  centerStage: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    maxWidth: 1000,
    margin: "0 auto",
    width: "100%",
    animation: "fadeUp .7s ease-out",
  },
  prize: {
    fontSize: 96,
    fontWeight: 800,
    lineHeight: 0.95,
    color: BITPANDA_GREEN,
    textShadow: `0 0 20px rgba(44,236,154,.45)`,
    animation: "pulseGlow 2.8s ease-in-out infinite",
    marginBottom: 18,
  },
  headline: {
    fontSize: 52,
    fontWeight: 700,
    lineHeight: 1,
    color: "#eafff5",
    marginBottom: 16,
    letterSpacing: 2,
  },
  subline: {
    color: DIM,
    fontSize: 18,
    marginBottom: 30,
    maxWidth: 700,
  },
  walletLine: {
    fontSize: 38,
    color: BITPANDA_GREEN,
    marginBottom: 20,
    textShadow: `0 0 8px rgba(44,236,154,.35)`,
    wordBreak: "break-word",
  },
  hintBox: {
    color: DIM,
    fontSize: 14,
    marginBottom: 26,
  },
  form: {
    width: "100%",
    maxWidth: 720,
    display: "grid",
    gap: 16,
  },
  input: {
    width: "100%",
    padding: "24px 24px",
    borderRadius: 0,
    border: `2px solid ${BITPANDA_GREEN}`,
    background: "#010302",
    color: BITPANDA_GREEN,
    outline: "none",
    fontSize: 30,
    textAlign: "center",
    fontFamily: "'Courier New', monospace",
  },
  button: {
    width: "100%",
    padding: "24px 24px",
    border: `2px solid ${BITPANDA_GREEN}`,
    background: BITPANDA_GREEN,
    color: "#04110b",
    fontWeight: 900,
    fontSize: 26,
    letterSpacing: 1.4,
    boxShadow: `0 0 18px rgba(44,236,154,.22)`,
  },
  console: {
    marginTop: 28,
    width: "100%",
    maxWidth: 720,
    padding: 16,
    border: `1px solid rgba(44,236,154,.35)`,
    background: "#020403",
    minHeight: 96,
    color: BITPANDA_GREEN,
    boxShadow: `0 0 10px rgba(44,236,154,.08) inset`,
    letterSpacing: 0.4,
    lineHeight: 1.5,
    textAlign: "left",
  },
  consoleTitle: {
    color: DIM,
    marginBottom: 8,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  consoleCursor: {
    display: "inline-block",
    marginLeft: 4,
    animation: "blinkCursor 1s steps(1) infinite",
  },
  footer: {
    marginTop: 28,
    color: "rgba(114,217,167,.8)",
    fontSize: 12,
    letterSpacing: 1.2,
  },
};

export default App;