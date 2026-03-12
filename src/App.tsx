import React, { useEffect, useMemo, useState } from "react";

type LeaderboardEntry = {
  name: string;
  bestScore: number;
  bestGuess: string;
  attempts: number;
  lastAt: string;
};

type SubmitResponse = {
  ok: boolean;
  isWinner: boolean;
  message: string;
  matchedChars: number;
  bestPossibleDisplay: string;
  leaderboard: LeaderboardEntry[];
  attemptsLeft?: number;
};

const WALLET_MASK = "BP-7X9A-__Q4-__K8";
const DISPLAY_ADDRESS = "0xB17P...4NDA";
const DISPLAY_BALANCE = "€100 in BTC";
const MAX_ATTEMPTS_PER_PLAYER = 1;

const BITPANDA_GREEN = "#2CEC9A";
const DARK_GREEN = "#10352d";
const PANEL_GREEN = "#0b1814";
const BG = "#030504";
const TEXT = "#b6ffd8";
const DIM = "#72d9a7";

function App() {
  const [name, setName] = useState("");
  const [guess, setGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(">> SYSTEM READY");
  const [matchedChars, setMatchedChars] = useState<number | null>(null);
  const [bestPossibleDisplay, setBestPossibleDisplay] = useState(WALLET_MASK);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [clock, setClock] = useState(new Date());
  const [attemptsUsed, setAttemptsUsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("bitpanda_challenge_name");
    if (saved) setName(saved);

    const lb = localStorage.getItem("bitpanda_challenge_leaderboard");
    if (lb) {
      try {
        setLeaderboard(JSON.parse(lb));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (name) localStorage.setItem("bitpanda_challenge_name", name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem(
      "bitpanda_challenge_leaderboard",
      JSON.stringify(leaderboard)
    );
  }, [leaderboard]);

  const attemptsLeft = useMemo(
    () => Math.max(0, MAX_ATTEMPTS_PER_PLAYER - attemptsUsed),
    [attemptsUsed]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage(">> PLEASE ENTER YOUR NAME");
      return;
    }

    if (!guess.trim()) {
      setMessage(">> PLEASE ENTER A CODE");
      return;
    }

    if (attemptsLeft <= 0) {
      setMessage(">> ACCESS LOCKED // REGISTER AGAIN");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(">> VERIFYING INPUT ...");

      const res = await fetch("/api/submit-attempt", {
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

      const data: SubmitResponse = await res.json();

      setMessage(data.message);
      setMatchedChars(data.matchedChars);
      setBestPossibleDisplay(data.bestPossibleDisplay);
      setLeaderboard(data.leaderboard);

      if (typeof data.attemptsLeft === "number") {
        setAttemptsUsed(MAX_ATTEMPTS_PER_PLAYER - data.attemptsLeft);
      } else {
        setAttemptsUsed(1);
      }

      if (data.isWinner) {
        setMessage(">> ACCESS GRANTED // WIN CONFIRMED");
      }

      setGuess("");
    } catch (error: any) {
      setMessage(`>> ERROR: ${error.message || "UNKNOWN ERROR"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: ${BG};
        }

        @keyframes pulseGlow {
          0% { text-shadow: 0 0 8px rgba(44,236,154,.25), 0 0 18px rgba(44,236,154,.12); }
          50% { text-shadow: 0 0 14px rgba(44,236,154,.55), 0 0 24px rgba(44,236,154,.18); }
          100% { text-shadow: 0 0 8px rgba(44,236,154,.25), 0 0 18px rgba(44,236,154,.12); }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
      `}</style>

      <div style={styles.page}>
        <div style={styles.scanlines} />
        <div style={styles.wrapper}>
          <header style={styles.header}>
            <div>
              <div style={styles.kicker}>BITPANDA PRESENTS</div>
              <h1 style={styles.title}>CRACK THE WALLET</h1>
              <p style={styles.subtitle}>
                Enter your name. You get one shot. Guess the code. Climb the leaderboard.
              </p>
            </div>

            <div style={styles.topRightBox}>
              <div>STATUS: LIVE</div>
              <div>TIME: {clock.toLocaleTimeString("de-DE")}</div>
              <div>SPONSOR: BITPANDA</div>
              <div>MODE: ONE SHOT ONLY</div>
            </div>
          </header>

          <section style={styles.heroGrid}>
            <div style={styles.leftCol}>
              <div style={styles.card}>
                <div style={styles.cardLabel}>LIVE WALLET</div>
                <div style={styles.balance}>{DISPLAY_BALANCE}</div>
                <div style={styles.monoLine}>ADDRESS: {DISPLAY_ADDRESS}</div>
                <div style={styles.walletMask}>KEY: {WALLET_MASK}</div>

                <div style={styles.divider} />

                <div style={styles.hintTitle}>HINTS</div>
                <ul style={styles.hints}>
                  <li>16 characters total</li>
                  <li>Letters and numbers only</li>
                  <li>Some characters are already visible</li>
                  <li>Only one attempt per registration</li>
                </ul>
              </div>

              <div style={styles.card}>
                <div style={styles.cardLabel}>YOUR BEST MATCH</div>
                <div style={styles.bestMatch}>{bestPossibleDisplay}</div>
                <div style={styles.metaRow}>
                  <span>MATCHED CHARS:</span>
                  <strong>{matchedChars ?? 0}</strong>
                </div>
                <div style={styles.metaRow}>
                  <span>ATTEMPTS LEFT:</span>
                  <strong>{attemptsLeft}</strong>
                </div>
              </div>
            </div>

            <div style={styles.centerCol}>
              <div style={styles.formCard}>
                <div style={styles.cardLabel}>
                  ACCESS TERMINAL
                  <span style={styles.cursor}>_</span>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                  <label style={styles.label}>NAME</label>
                  <input
                    style={styles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="YOUR NAME"
                    maxLength={24}
                    disabled={attemptsLeft <= 0 || isSubmitting}
                  />

                  <label style={styles.label}>YOUR CODE</label>
                  <input
                    style={styles.input}
                    value={guess}
                    onChange={(e) => setGuess(e.target.value.toUpperCase())}
                    placeholder="BP-XXXX-XXXX-XXXX"
                    maxLength={19}
                    disabled={attemptsLeft <= 0 || isSubmitting}
                  />

                  <button
                    type="submit"
                    style={{
                      ...styles.button,
                      opacity: isSubmitting || attemptsLeft <= 0 ? 0.65 : 1,
                      cursor:
                        isSubmitting || attemptsLeft <= 0 ? "not-allowed" : "pointer",
                    }}
                    disabled={isSubmitting || attemptsLeft <= 0}
                  >
                    {isSubmitting ? "VERIFYING..." : "SUBMIT GUESS"}
                  </button>
                </form>

                <div style={styles.console}>
                  <div style={styles.consoleTitle}>SYSTEM LOG</div>
                  <div>{message}</div>
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
                      <div key={`${entry.name}-${index}`} style={styles.lbRow}>
                        <span>#{index + 1}</span>
                        <span title={entry.bestGuess}>{entry.name}</span>
                        <span>{entry.bestScore}</span>
                      </div>
                    ))
                  )}
                </div>

                <div style={styles.divider} />

                <div style={styles.smallInfo}>
                  Ranking by highest number of correct characters in the correct
                  position.
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

const styles: Record<string, React.CSSProperties> = {
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
    maxWidth: 1440,
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
    minWidth: 240,
    background: "rgba(0,0,0,0.35)",
    boxShadow: `0 0 14px rgba(44,236,154,.18) inset`,
    lineHeight: 1.8,
    fontSize: 13,
    animation: "fadeUp .75s ease-out",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1.15fr 0.85fr",
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
    transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
  },
  formCard: {
    background: "rgba(0,0,0,0.55)",
    border: `1px solid ${BITPANDA_GREEN}`,
    padding: 22,
    minHeight: "100%",
    boxShadow: `0 0 24px rgba(44,236,154,.15)`,
    animation: "fadeUp .95s ease-out",
    transition: "transform .18s ease, box-shadow .18s ease",
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
  hintTitle: {
    marginBottom: 10,
    color: "#eafff5",
  },
  hints: {
    margin: 0,
    paddingLeft: 18,
    color: DIM,
    lineHeight: 1.8,
    fontSize: 14,
  },
  bestMatch: {
    fontSize: 28,
    color: BITPANDA_GREEN,
    marginBottom: 16,
    wordBreak: "break-all",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    color: DIM,
    marginTop: 8,
    gap: 12,
  },
  form: {
    display: "grid",
    gap: 12,
  },
  label: {
    fontSize: 13,
    color: DIM,
    letterSpacing: 1.4,
  },
  input: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: 0,
    border: `1px solid ${BITPANDA_GREEN}`,
    background: "#010302",
    color: BITPANDA_GREEN,
    outline: "none",
    fontSize: 18,
    fontFamily: "'Courier New', monospace",
  },
  button: {
    marginTop: 6,
    padding: "16px 18px",
    border: `1px solid ${BITPANDA_GREEN}`,
    background: BITPANDA_GREEN,
    color: "#04110b",
    fontWeight: 800,
    fontSize: 16,
    letterSpacing: 1.2,
    boxShadow: `0 0 18px rgba(44,236,154,.22)`,
    transition: "transform .15s ease, box-shadow .15s ease, filter .15s ease",
  },
  console: {
    marginTop: 18,
    padding: 14,
    border: `1px solid rgba(44,236,154,.35)`,
    background: "#020403",
    minHeight: 90,
    color: BITPANDA_GREEN,
    boxShadow: `0 0 10px rgba(44,236,154,.08) inset`,
  },
  consoleTitle: {
    color: DIM,
    marginBottom: 8,
    fontSize: 12,
    letterSpacing: 1.2,
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
  smallInfo: {
    color: DIM,
    fontSize: 12,
    lineHeight: 1.6,
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
