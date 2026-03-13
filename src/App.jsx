import React, { useEffect, useState } from "react";

const WALLET_MASK = "BP-7X9A-__Q4-__K8";
const DISPLAY_ADDRESS = "0xB17P...4NDA";
const DISPLAY_BALANCE = "€100 in BTC";

const BITPANDA_GREEN = "#2CEC9A";
const DARK_GREEN = "#10352d";
const PANEL_GREEN = "#0b1814";
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

function mergeLeaderboard(oldBoard, newBoard) {
  const map = new Map();

  [...oldBoard, ...newBoard].forEach((entry) => {
    if (!entry?.name) return;

    const existing = map.get(entry.name);

    if (!existing) {
      map.set(entry.name, entry);
      return;
    }

    if ((entry.bestScore || 0) > (existing.bestScore || 0)) {
      map.set(entry.name, entry);
      return;
    }

    if (
      (entry.bestScore || 0) === (existing.bestScore || 0) &&
      new Date(entry.lastAt || 0).getTime() > new Date(existing.lastAt || 0).getTime()
    ) {
      map.set(entry.name, entry);
    }
  });

  return [...map.values()]
    .sort((a, b) => {
      if ((b.bestScore || 0) !== (a.bestScore || 0)) {
        return (b.bestScore || 0) - (a.bestScore || 0);
      }
      return new Date(a.lastAt || 0).getTime() - new Date(b.lastAt || 0).getTime();
    })
    .slice(0, 10);
}

function App() {
  const [name, setName] = useState("");
  const [guess, setGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHacking, setIsHacking] = useState(false);
  const [message, setMessage] = useState(">> ENTER YOUR NAME AND GUESS THE CODE");
  const [displayMessage, setDisplayMessage] = useState(">> ENTER YOUR NAME AND GUESS THE CODE");
  const [matchedChars, setMatchedChars] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const lb = localStorage.getItem("bitpanda_challenge_leaderboard");
    if (lb) {
      try {
        setLeaderboard(JSON.parse(lb));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "bitpanda_challenge_leaderboard",
      JSON.stringify(leaderboard)
    );
  }, [leaderboard]);

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

    if (!name.trim()) {
      setMessage(">> PLEASE ENTER YOUR NAME");
      return;
    }

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
          name: name.trim(),
          guess: guess.trim().toUpperCase(),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Request failed");
      }

      const data = await res.json();

      setMessage(data.message);
      setMatchedChars(data.matchedChars);

      const merged = mergeLeaderboard(leaderboard, data.leaderboard || []);
      setLeaderboard(merged);

      if (data.isWinner) {
        setMessage(">> ACCESS GRANTED // WIN CONFIRMED");
      }

      setGuess("");
      setName("");

      setTimeout(() => {
        setIsHacking(false);
      }, 700);
    } catch (error) {
      setIsHacking(false);
      setMessage(">> ERROR: " + (error.message || "UNKNOWN ERROR"));
      setGuess("");
      setName("");
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
          50% { text-shadow: 0 0 14px rgba(44,236,154,.55), 0 0 24px rgba(44,236,154,.18); }
          100% { text-shadow: 0 0 8px rgba(44,236,154,.25), 0 0 18px rgba(44,236,154,.12); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
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

        @media (max-width: 1100px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={styles.page}>
        {isHacking && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "#2CEC9A",
              opacity: 0.06,
              pointerEvents: "none",
              animation: "terminalFlash .5s ease-out",
              zIndex: 5,
            }}
          />
        )}

        <div style={styles.scanlines} />

        <div style={styles.wrapper}>
          <header style={styles.header}>
            <div>
              <div style={styles.kicker}>BITPANDA PRESENTS</div>
              <h1 style={styles.title}>CRACK THE WALLET</h1>
              <p style={styles.subtitle}>
                Guess the hidden code. The closer you get, the higher you rank.
              </p>
            </div>

            <div style={styles.topRightBox}>
              <div>STATUS: LIVE</div>
              <div>TIME: {clock.toLocaleTimeString("de-DE")}</div>
              <div>SPONSOR: BITPANDA</div>
              <div>MODE: ONE SHOT PER NAME</div>
            </div>
          </header>

          <section className="hero-grid" style={styles.heroGrid}>
            <div style={styles.leftCol}>
              <div style={styles.card}>
                <div style={styles.cardLabel}>LIVE WALLET</div>
                <div style={styles.balance}>{DISPLAY_BALANCE}</div>
                <div style={styles.monoLine}>ADDRESS: {DISPLAY_ADDRESS}</div>

                <div
                  style={{
                    ...styles.walletMask,
                    textShadow: isHacking
                      ? "0 0 14px rgba(44,236,154,.7), 0 0 24px rgba(44,236,154,.3)"
                      : styles.walletMask.textShadow,
                  }}
                >
                  KEY: {guess || WALLET_MASK}
                </div>
              </div>
            </div>

            <div style={styles.centerCol}>
              <div style={styles.formCard}>
                <div style={styles.cardLabel}>
                  ACCESS TERMINAL
                  <span style={styles.cursor}>_</span>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.infoTitle}>HOW IT WORKS</div>
                  <div style={styles.infoText}>
                    Enter your name and guess the hidden code. You can type the
                    code without dashes — they will be added automatically.
                    Every correct character in the correct position improves your
                    ranking.
                  </div>

                  <div style={styles.divider} />

                  <div style={styles.infoTitle}>HINTS</div>
                  <ul style={styles.hints}>
                    <li>16 characters total</li>
                    <li>Letters and numbers only</li>
                    <li>Some characters are already visible</li>
                    <li>One attempt per name</li>
                  </ul>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                  <label style={styles.label}>NAME</label>
                  <input
                    style={styles.bigInput}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="YOUR NAME"
                    maxLength={24}
                    disabled={isSubmitting}
                  />

                  <label style={styles.label}>YOUR CODE</label>
                  <input
                    style={{
                      ...styles.bigInput,
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
                      opacity: isSubmitting ? 0.65 : 1,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "VERIFYING..." : "SUBMIT GUESS"}
                  </button>
                </form>

                <div style={styles.console}>
                  <div style={styles.consoleTitle}>SYSTEM LOG</div>
                  <div>
                    {displayMessage}
                    <span style={styles.consoleCursor}>█</span>
                  </div>
                  {matchedChars !== null && (
                    <div style={styles.hitInfo}>LAST RESULT: {matchedChars} HITS</div>
                  )}
                </div>
              </div>
            </div>

            <aside style={styles.rightCol}>
              <div style={styles.card}>
                <div style={styles.cardLabel}>LEADERBOARD</div>

                <div style={styles.lbHeader}>
                  <span>RANK</span>
                  <span>NAME</span>
                  <span>HITS</span>
                </div>

                <div style={styles.lbBody}>
                  {leaderboard.length === 0 ? (
                    <div style={styles.empty}>NO ENTRIES YET</div>
                  ) : (
                    leaderboard.slice(0, 10).map((entry, index) => (
                      <div key={entry.name + "-" + index} style={styles.lbRow}>
                        <span>#{index + 1}</span>
                        <span title={entry.bestGuess}>{entry.name}</span>
                        <span>{entry.bestScore}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </section>

          <footer style={styles.footer}>
            <span>BITPANDA // LIVE EVENT GAMIFICATION</span>
            <span>RETRO TERMINAL MODE ACTIVE</span>
          </footer>
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
    maxWidth: 1500,
    margin: "0 auto",
    padding: "28px 20px 28px",
    position: "relative",
    zIndex: 2,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    animation: "fadeUp .55s ease-out",
  },
  kicker: {
    color: BITPANDA_GREEN,
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 8,
    textShadow: `0 0 8px ${BITPANDA_GREEN}`,
  },
  title: {
    margin: 0,
    fontSize: "clamp(36px, 6vw, 78px)",
    lineHeight: 1,
    color: BITPANDA_GREEN,
    textShadow: `0 0 16px rgba(44,236,154,.45)`,
    animation: "pulseGlow 2.8s ease-in-out infinite",
  },
  subtitle: {
    marginTop: 10,
    color: DIM,
    maxWidth: 680,
    fontSize: 16,
  },
  topRightBox: {
    border: `1px solid ${BITPANDA_GREEN}`,
    padding: 14,
    minWidth: 260,
    background: "rgba(0,0,0,0.35)",
    boxShadow: `0 0 14px rgba(44,236,154,.18) inset`,
    lineHeight: 1.8,
    fontSize: 13,
    animation: "fadeUp .75s ease-out",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1.5fr 0.85fr",
    gap: 18,
  },
  leftCol: {
    display: "grid",
    gap: 18,
  },
  centerCol: {
    display: "grid",
  },
  rightCol: {
    display: "grid",
  },
  card: {
    background: PANEL_GREEN,
    border: `1px solid ${BITPANDA_GREEN}`,
    padding: 18,
    boxShadow: `0 0 18px rgba(44,236,154,.12)`,
    animation: "fadeUp .8s ease-out",
  },
  formCard: {
    background: "rgba(0,0,0,0.55)",
    border: `1px solid ${BITPANDA_GREEN}`,
    padding: 28,
    minHeight: "100%",
    boxShadow: `0 0 24px rgba(44,236,154,.15)`,
    animation: "fadeUp .95s ease-out",
  },
  cardLabel: {
    color: BITPANDA_GREEN,
    marginBottom: 14,
    fontSize: 13,
    letterSpacing: 2,
    textShadow: `0 0 8px rgba(44,236,154,.5)`,
  },
  cursor: {
    display: "inline-block",
    marginLeft: 6,
    animation: "blinkCursor 1s steps(1) infinite",
  },
  balance: {
    fontSize: 34,
    color: "#eafff5",
    marginBottom: 12,
    textShadow: `0 0 10px rgba(44,236,154,.15)`,
  },
  monoLine: {
    fontSize: 15,
    color: DIM,
    marginBottom: 8,
    wordBreak: "break-all",
  },
  walletMask: {
    fontSize: 26,
    color: BITPANDA_GREEN,
    textShadow: `0 0 8px rgba(44,236,154,.35)`,
    marginBottom: 8,
    wordBreak: "break-all",
  },
  divider: {
    height: 1,
    background: "rgba(44,236,154,.22)",
    margin: "16px 0",
  },
  infoBox: {
    padding: 18,
    border: `1px solid rgba(44,236,154,.25)`,
    background: "#06100d",
    marginBottom: 20,
  },
  infoTitle: {
    color: "#eafff5",
    fontSize: 14,
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  infoText: {
    color: DIM,
    lineHeight: 1.7,
    fontSize: 14,
  },
  hints: {
    margin: 0,
    paddingLeft: 18,
    color: DIM,
    lineHeight: 1.8,
    fontSize: 14,
  },
  form: {
    display: "grid",
    gap: 14,
  },
  label: {
    fontSize: 13,
    color: DIM,
    letterSpacing: 1.4,
  },
  bigInput: {
    width: "100%",
    padding: "18px 18px",
    borderRadius: 0,
    border: `1px solid ${BITPANDA_GREEN}`,
    background: "#010302",
    color: BITPANDA_GREEN,
    outline: "none",
    fontSize: 22,
    fontFamily: "'Courier New', monospace",
  },
  button: {
    marginTop: 10,
    padding: "18px 18px",
    border: `1px solid ${BITPANDA_GREEN}`,
    background: BITPANDA_GREEN,
    color: "#04110b",
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: 1.2,
    boxShadow: `0 0 18px rgba(44,236,154,.22)`,
  },
  console: {
    marginTop: 22,
    padding: 16,
    border: `1px solid rgba(44,236,154,.35)`,
    background: "#020403",
    minHeight: 110,
    color: BITPANDA_GREEN,
    boxShadow: `0 0 10px rgba(44,236,154,.08) inset`,
    letterSpacing: 0.4,
    lineHeight: 1.5,
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
  hitInfo: {
    marginTop: 12,
    color: "#eafff5",
    fontSize: 13,
  },
  lbHeader: {
    display: "grid",
    gridTemplateColumns: "56px 1fr 56px",
    gap: 8,
    color: DIM,
    fontSize: 12,
    paddingBottom: 10,
    borderBottom: "1px solid rgba(44,236,154,.18)",
    letterSpacing: 1.2,
  },
  lbBody: {
    marginTop: 10,
    display: "grid",
    gap: 8,
  },
  lbRow: {
    display: "grid",
    gridTemplateColumns: "56px 1fr 56px",
    gap: 8,
    padding: "8px 0",
    borderBottom: "1px dashed rgba(44,236,154,.12)",
    color: "#d6ffea",
    fontSize: 14,
  },
  empty: {
    color: DIM,
    padding: "12px 0",
  },
  footer: {
    marginTop: 20,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    color: "rgba(114,217,167,.8)",
    fontSize: 12,
    borderTop: "1px solid rgba(44,236,154,.18)",
    paddingTop: 14,
    animation: "fadeUp 1.1s ease-out",
  },
};

export default App;