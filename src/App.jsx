import React, { useEffect, useRef, useState } from "react";

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

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const refocus = () => inputRef.current?.focus();

    window.addEventListener("click", refocus);
    window.addEventListener("keydown", refocus);

    return () => {
      window.removeEventListener("click", refocus);
      window.removeEventListener("keydown", refocus);
    };
  }, []);

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

      const data = await res.json();

      setMessage(
        data.isWinner
          ? ">> ACCESS GRANTED // JACKPOT UNLOCKED"
          : data.message || ">> ACCESS DENIED"
      );

      setGuess("");

      setTimeout(() => {
        setIsHacking(false);
        inputRef.current?.focus();
      }, 500);
    } catch (error) {
      setIsHacking(false);
      setMessage(">> ERROR");
      setGuess("");
      inputRef.current?.focus();
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

@keyframes pulseGlow {
  0% { text-shadow: 0 0 10px rgba(44,236,154,.3); }
  50% { text-shadow: 0 0 25px rgba(44,236,154,.9); }
  100% { text-shadow: 0 0 10px rgba(44,236,154,.3); }
}

@keyframes blink {
  0%,49% {opacity:1;}
  50%,100% {opacity:0;}
}

@keyframes flash {
  0%{opacity:0}
  30%{opacity:.08}
  100%{opacity:0}
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
              animation: "flash .4s ease-out",
            }}
          />
        )}

        <div style={styles.wrapper}>

          <div style={styles.header}>
            BITPANDA PRESENTS
          </div>

          <div style={styles.prize}>
            WIN {DISPLAY_BALANCE}
          </div>

          <div style={styles.title}>
            CRACK THE WALLET
          </div>

          <div style={styles.wallet}>
            {guess || WALLET_MASK}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>

            <input
              ref={inputRef}
              autoFocus
              value={guess}
              onChange={(e) => setGuess(formatCode(e.target.value))}
              placeholder="BP-XXXX-XXXX-XXXX"
              maxLength={17}
              disabled={isSubmitting}
              style={styles.input}
            />

            <button
              disabled={isSubmitting}
              style={styles.button}
            >
              {isSubmitting ? "VERIFYING..." : "UNLOCK WALLET"}
            </button>

          </form>

          <div style={styles.console}>
            {displayMessage}
            <span style={styles.cursor}>█</span>
          </div>

          <div style={styles.footer}>
            SPONSORED BY BITPANDA
          </div>

        </div>
      </div>
    </>
  );
}

const styles = {

page:{
minHeight:"100vh",
background:`radial-gradient(circle at top, ${DARK_GREEN} 0%, ${BG} 45%)`,
color:TEXT,
fontFamily:"Courier New, monospace",
display:"flex",
alignItems:"center",
justifyContent:"center"
},

wrapper:{
textAlign:"center",
maxWidth:900,
width:"100%",
padding:40
},

header:{
color:BITPANDA_GREEN,
letterSpacing:2,
fontSize:14,
marginBottom:20
},

prize:{
fontSize:90,
fontWeight:900,
color:BITPANDA_GREEN,
animation:"pulseGlow 3s infinite",
marginBottom:10
},

title:{
fontSize:42,
marginBottom:30
},

wallet:{
fontSize:36,
color:BITPANDA_GREEN,
marginBottom:30
},

form:{
display:"grid",
gap:20,
maxWidth:600,
margin:"0 auto"
},

input:{
padding:"22px",
fontSize:28,
textAlign:"center",
border:`2px solid ${BITPANDA_GREEN}`,
background:"#010302",
color:BITPANDA_GREEN
},

button:{
padding:"22px",
fontSize:24,
background:BITPANDA_GREEN,
border:`2px solid ${BITPANDA_GREEN}`,
fontWeight:800,
cursor:"pointer"
},

console:{
marginTop:30,
color:BITPANDA_GREEN,
fontSize:16
},

cursor:{
animation:"blink 1s infinite"
},

footer:{
marginTop:40,
fontSize:12,
color:DIM
}

};

export default App;