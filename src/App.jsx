import React, { useEffect, useMemo, useRef, useState } from "react";
import bitpandaLogo from "./assets/bitpanda-logo.webp";

const DISPLAY_BALANCE = "50.000€";
const GREEN = "#2CEC9A";
const RED = "#ff4d4f";
const GOLD = "#f7d774";
const WHITE = "#EAFEF4";
const DIM = "#7FBF9F";
const BG = "#030504";
const DARK_GREEN = "#10352d";

function formatCode(value) {
  const clean = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
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

function buildDisplayString(value) {
  const raw = rawFromFormatted(value);
  const p1 = raw.slice(0, 2).padEnd(2, "_");
  const p2 = raw.slice(2, 6).padEnd(4, "_");
  const p3 = raw.slice(6, 10).padEnd(4, "_");
  const p4 = raw.slice(10, 14).padEnd(4, "_");
  return `${p1}-${p2}-${p3}-${p4}`;
}

function Confetti({ count = 48 }) {
  const pieces = Array.from({ length: count }, (_, i) => i);

  return (
    <div style={styles.confettiLayer}>
      {pieces.map((i) => {
        const left = `${(i * 97) % 100}%`;
        const duration = `${3.8 + (i % 7) * 0.45}s`;
        const delay = `${(i % 9) * 0.18}s`;
        const rotate = `${(i * 29) % 360}deg`;
        const width = 8 + (i % 5) * 4;
        const height = 12 + (i % 4) * 6;
        const color =
          i % 3 === 0 ? GREEN : i % 3 === 1 ? GOLD : "rgba(255,255,255,.85)";

        return (
          <div
            key={i}
            style={{
              ...styles.confettiPiece,
              left,
              width,
              height,
              background: color,
              animationDuration: duration,
              animationDelay: delay,
              transform: `rotate(${rotate})`,
            }}
          />
        );
      })}
    </div>
  );
}

function MatrixRain() {
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    function buildColumns() {
      const amount = Math.floor(window.innerWidth / 28);
      const cols = [];

      for (let i = 0; i < amount; i++) {
        cols.push({
          x: i * 28,
          y: Math.random() * window.innerHeight,
          speed: 2 + Math.random() * 4,
          value: randomChar(),
          opacity: 0.25 + Math.random() * 0.45,
        });
      }

      setColumns(cols);
    }

    buildColumns();
    window.addEventListener("resize", buildColumns);

    return () => {
      window.removeEventListener("resize", buildColumns);
    };
  }, []);

  useEffect(() => {
    if (!columns.length) return;

    const interval = setInterval(() => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          y: col.y > window.innerHeight + 40 ? -80 : col.y + col.speed,
          value: randomChar(),
        }))
      );
    }, 55);

    return () => clearInterval(interval);
  }, [columns.length]);

  return (
    <div style={styles.matrixLayer}>
      {columns.map((col, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: col.x,
            top: col.y,
            color: GREEN,
            fontSize: 20,
            opacity: col.opacity,
            fontFamily: "Courier New, monospace",
            textShadow: "0 0 10px rgba(44,236,154,.6)",
            pointerEvents: "none",
          }}
        >
          {col.value}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState(">> ENTER ACCESS CODE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [displayCode, setDisplayCode] = useState("__-____-____-____");
  const [matchCount, setMatchCount] = useState(null);
  const [winnerLocked, setWinnerLocked] = useState(false);
  const [winnerJustFound, setWinnerJustFound] = useState(false);
  const inputRef = useRef(null);

  const rawLength = useMemo(() => rawFromFormatted(guess).length, [guess]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    async function loadState() {
      try {
        const res = await fetch("/functions/submit-attempt");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.winnerLocked) {
          setWinnerLocked(true);
          setMessage(">> JACKPOT ALREADY CLAIMED");
        }
      } catch {}
    }

    loadState();
  }, []);

  useEffect(() => {
    const refocus = () => {
      if (!isSubmitting && !winnerLocked) inputRef.current?.focus();
    };

    window.addEventListener("click", refocus);
    window.addEventListener("keydown", refocus);

    return () => {
      window.removeEventListener("click", refocus);
      window.removeEventListener("keydown", refocus);
    };
  }, [isSubmitting, winnerLocked]);

  useEffect(() => {
    if (!isDecrypting) return;

    const interval = setInterval(() => {
      setDisplayCode(() => {
        const chars = Array.from({ length: 14 }, () => randomChar());
        return `${chars.slice(0, 2).join("")}-${chars.slice(2, 6).join("")}-${chars
          .slice(6, 10)
          .join("")}-${chars.slice(10, 14).join("")}`;
      });
    }, 70);

    return () => clearInterval(interval);
  }, [isDecrypting]);

  async function animateFinalCode(submittedGuess) {
    const finalDisplay = buildDisplayString(submittedGuess);
    const chars = finalDisplay.split("");

    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === "-") continue;

      for (let j = 0; j < 10; j++) {
        setDisplayCode((prev) => {
          const arr = prev.split("");
          arr[i] = randomChar();
          return arr.join("");
        });
        await sleep(30);
      }

      setDisplayCode((prev) => {
        const arr = prev.split("");
        arr[i] = chars[i];
        return arr.join("");
      });

      await sleep(90);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!guess.trim() || isSubmitting || winnerLocked) return;

    const submittedGuess = guess.trim();

    try {
      setIsSubmitting(true);
      setIsDecrypting(true);
      setMatchCount(null);
      setMessage(">> DECRYPTING ACCESS KEY");
      setDisplayCode(buildDisplayString(submittedGuess));

      const request = fetch("/functions/submit-attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guess: submittedGuess,
        }),
      });

      await sleep(1000);

      const res = await request;
      const data = await res.json();

      if (data?.winnerLocked && !data?.isWinner) {
        setIsDecrypting(false);
        setWinnerLocked(true);
        setMessage(">> JACKPOT ALREADY CLAIMED");
        return;
      }

      await animateFinalCode(submittedGuess);
      setIsDecrypting(false);

      if (data.isWinner) {
        setSuccessFlash(true);
        setMessage(">> ACCESS GRANTED // JACKPOT UNLOCKED");
        setWinnerLocked(true);
        setWinnerJustFound(true);
        setTimeout(() => setSuccessFlash(false), 900);
        return;
      }

      setMatchCount(data.matchedChars ?? 0);
      setErrorFlash(true);
      setMessage(`>> ${data.matchedChars ?? 0} / 14 MATCHES`);
      setTimeout(() => setErrorFlash(false), 3500);

      setTimeout(() => {
        setGuess("");
        setDisplayCode("__-____-____-____");
        setMatchCount(null);
        inputRef.current?.focus();
      }, 3800);
    } catch {
      setIsDecrypting(false);
      setErrorFlash(true);
      setMessage(">> ACCESS DENIED");
      setTimeout(() => setErrorFlash(false), 3500);

      setTimeout(() => {
        setGuess("");
        setDisplayCode("__-____-____-____");
        setMatchCount(null);
        inputRef.current?.focus();
      }, 3800);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (winnerLocked) {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={styles.winPage}>
          <MatrixRain />
          <Confetti />
          <div style={styles.winGlowA} />
          <div style={styles.winGlowB} />

          <div style={styles.winWrap}>
            <a
              href="https://www.bitpanda.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={bitpandaLogo} alt="Bitpanda" style={styles.winLogo} />
            </a>

            <div style={styles.winTopLine}>
              {winnerJustFound ? "ACCESS GRANTED" : "JACKPOT CLAIMED"}
            </div>

            <div style={styles.winAmount}>€50.000</div>

            <div style={styles.bitcoinStage}>
              <div style={styles.bitcoinHalo} />
              <div style={styles.bitcoinCoin}>₿</div>
              <div style={styles.bitcoinRing} />
              <div style={styles.bitcoinRing2} />
            </div>

            <div style={styles.winHeadline}>
              {winnerJustFound ? "WALLET UNLOCKED" : "WINNER FOUND"}
            </div>

            <div style={styles.winSub}>
              {winnerJustFound
                ? "THE JACKPOT HAS BEEN SECURED"
                : "THE FINAL PRIZE HAS ALREADY BEEN CLAIMED"}
            </div>

            <div style={styles.winFooter}>{">>> SPONSORED BY BITPANDA"}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>

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
              <div style={styles.errorSub}>
                {matchCount !== null ? `${matchCount} / 14 MATCHES` : "INVALID CODE"}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            ...styles.wrapper,
            animation: errorFlash ? "errorGlitch .45s ease-out" : "none",
          }}
        >
          <div style={styles.header}>
            <a
              href="https://www.bitpanda.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={bitpandaLogo} alt="Bitpanda" style={styles.logo} />
            </a>
          </div>

          <div className="prize" style={styles.prize}>
            WIN {DISPLAY_BALANCE}
          </div>

          <div className="title" style={styles.title}>
            CRACK THE WALLET
          </div>

          <div style={styles.inputHintWrap}>
            <div style={styles.inputHintMain}>Enter 14 characters</div>
            <div style={styles.inputHintSub}>Letters and numbers</div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              ref={inputRef}
              autoFocus
              className="input-main"
              value={isDecrypting ? displayCode : guess}
              onChange={(e) => {
                if (!isDecrypting) {
                  setGuess(formatCode(e.target.value));
                }
              }}
              placeholder="ENTER ACCESS CODE"
              maxLength={17}
              disabled={isSubmitting || winnerLocked}
              style={{
                ...styles.input,
                borderColor: errorFlash ? RED : GREEN,
                boxShadow: errorFlash
                  ? `0 0 0 1px rgba(255,77,79,.35), 0 0 18px rgba(255,77,79,.18), 0 0 36px rgba(255,77,79,.08)`
                  : isDecrypting
                  ? `0 0 24px rgba(44,236,154,.35), 0 0 50px rgba(44,236,154,.12)`
                  : `0 0 14px rgba(44,236,154,.28)`,
                letterSpacing: "2px",
              }}
            />

            <div style={styles.counter}>{rawLength}/14 CHARACTERS</div>

            <button
              className="button-main"
              disabled={isSubmitting || winnerLocked}
              style={{
                ...styles.button,
                opacity: isSubmitting || winnerLocked ? 0.78 : 1,
                transform: isSubmitting ? "scale(.995)" : "scale(1)",
                filter: isSubmitting ? "saturate(.9)" : "none",
              }}
            >
              {isSubmitting ? "Decrypting..." : "Unlock Wallet"}
            </button>
          </form>

          <div style={{ ...styles.console, color: GREEN }}>
            {">>> SPONSORED BY BITPANDA"}
            <span style={styles.cursor}>█</span>
          </div>
        </div>
      </div>
    </>
  );
}

const globalStyles = `
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

  @keyframes goldPulse {
    0% { transform: scale(1); box-shadow: 0 0 30px rgba(247,215,116,.18); }
    50% { transform: scale(1.03); box-shadow: 0 0 80px rgba(247,215,116,.35), 0 0 140px rgba(247,215,116,.15); }
    100% { transform: scale(1); box-shadow: 0 0 30px rgba(247,215,116,.18); }
  }

  @keyframes coinFloat {
    0% { transform: translateY(0px) rotateY(0deg); }
    50% { transform: translateY(-18px) rotateY(180deg); }
    100% { transform: translateY(0px) rotateY(360deg); }
  }

  @keyframes ringRotate {
    0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: .8; }
    100% { transform: translate(-50%, -50%) rotate(360deg) scale(1.05); opacity: 1; }
  }

  @keyframes confettiFall {
    0% { transform: translateY(-12vh) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    100% { transform: translateY(115vh) rotate(720deg); opacity: .95; }
  }

  @media (max-width: 900px) {
    .prize { font-size: 64px !important; }
    .title { font-size: 34px !important; }
    .input-main { font-size: 22px !important; padding: 20px !important; }
    .button-main { font-size: 22px !important; padding: 20px !important; }
    .error-title { font-size: 32px !important; }
  }
`;

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
    marginBottom: 16,
    display: "flex",
    justifyContent: "center",
  },

  logo: {
    width: 220,
    height: 220,
    objectFit: "contain",
    display: "block",
    margin: "0 auto",
    filter: "drop-shadow(0 0 10px rgba(44,236,154,.18))",
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
    marginBottom: 18,
    color: WHITE,
    letterSpacing: 1.4,
  },

  inputHintWrap: {
    marginBottom: 18,
  },

  inputHintMain: {
    color: WHITE,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.2,
    marginBottom: 4,
  },

  inputHintSub: {
    color: DIM,
    fontSize: 14,
    letterSpacing: 0.6,
  },

  form: {
    display: "grid",
    gap: 14,
    maxWidth: 680,
    margin: "0 auto",
  },

  input: {
    padding: "28px",
    fontSize: 34,
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
    padding: "22px 28px",
    fontSize: 24,
    background:
      "linear-gradient(180deg, rgba(44,236,154,1) 0%, rgba(31,201,130,1) 100%)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#04110b",
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: 0.6,
    borderRadius: 18,
    boxShadow:
      "0 12px 30px rgba(44,236,154,.18), inset 0 1px 0 rgba(255,255,255,.28)",
    transition: "transform .18s ease, box-shadow .18s ease, filter .18s ease",
  },

  console: {
    marginTop: 30,
    fontSize: 18,
    minHeight: 28,
  },

  cursor: {
    animation: "blink 1s infinite",
  },

  winPage: {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(circle at 50% 20%, rgba(247,215,116,.12) 0%, rgba(44,236,154,.08) 25%, #030504 65%)",
    color: WHITE,
    fontFamily: "Courier New, monospace",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  matrixLayer: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 0,
  },

  confettiLayer: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 3,
  },

  confettiPiece: {
    position: "absolute",
    top: "-10vh",
    borderRadius: 2,
    animationName: "confettiFall",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },

  winGlowA: {
    position: "absolute",
    width: 900,
    height: 900,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(247,215,116,.18) 0%, rgba(247,215,116,.05) 35%, rgba(247,215,116,0) 70%)",
    filter: "blur(18px)",
    animation: "goldPulse 3.6s ease-in-out infinite",
    zIndex: 1,
  },

  winGlowB: {
    position: "absolute",
    width: 700,
    height: 700,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(44,236,154,.14) 0%, rgba(44,236,154,.04) 35%, rgba(44,236,154,0) 70%)",
    filter: "blur(18px)",
    animation: "goldPulse 4.4s ease-in-out infinite",
    zIndex: 1,
  },

  winWrap: {
    position: "relative",
    zIndex: 4,
    textAlign: "center",
    padding: "40px 24px",
    maxWidth: 980,
    width: "100%",
  },

  winLogo: {
    width: 260,
    height: 260,
    objectFit: "contain",
    display: "block",
    margin: "0 auto 22px",
    filter: "drop-shadow(0 0 12px rgba(44,236,154,.2))",
  },

  winTopLine: {
    color: GOLD,
    fontSize: 22,
    letterSpacing: 2,
    marginBottom: 16,
  },

  winAmount: {
    fontSize: "clamp(72px, 10vw, 150px)",
    lineHeight: 0.9,
    fontWeight: 900,
    color: GOLD,
    textShadow:
      "0 0 18px rgba(247,215,116,.28), 0 0 60px rgba(247,215,116,.18)",
    marginBottom: 28,
  },

  bitcoinStage: {
    position: "relative",
    width: 260,
    height: 260,
    margin: "0 auto 34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  bitcoinHalo: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(247,215,116,.28) 0%, rgba(247,215,116,.08) 40%, rgba(247,215,116,0) 72%)",
    filter: "blur(10px)",
    animation: "goldPulse 3s ease-in-out infinite",
  },

  bitcoinCoin: {
    position: "relative",
    width: 150,
    height: 150,
    borderRadius: "50%",
    background:
      "linear-gradient(145deg, #fff0b3 0%, #f7d774 30%, #d79f18 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 74,
    fontWeight: 900,
    color: "#3a2500",
    boxShadow:
      "0 20px 60px rgba(0,0,0,.35), inset 0 2px 12px rgba(255,255,255,.35), inset 0 -6px 14px rgba(0,0,0,.18)",
    animation: "coinFloat 4s ease-in-out infinite",
    overflow: "hidden",
  },

  bitcoinRing: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 210,
    height: 210,
    borderRadius: "50%",
    border: "1px solid rgba(247,215,116,.35)",
    transform: "translate(-50%, -50%)",
    animation: "ringRotate 8s linear infinite",
  },

  bitcoinRing2: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 250,
    height: 250,
    borderRadius: "50%",
    border: "1px solid rgba(44,236,154,.22)",
    transform: "translate(-50%, -50%)",
    animation: "ringRotate 12s linear infinite reverse",
  },

  winHeadline: {
    fontSize: "clamp(34px, 5vw, 62px)",
    fontWeight: 800,
    color: WHITE,
    letterSpacing: 2,
    marginBottom: 14,
  },

  winSub: {
    color: "rgba(255,255,255,.78)",
    fontSize: 18,
    letterSpacing: 1.4,
  },

  winFooter: {
    marginTop: 36,
    color: GREEN,
    opacity: 0.78,
    fontSize: 12,
    letterSpacing: 2,
  },
};