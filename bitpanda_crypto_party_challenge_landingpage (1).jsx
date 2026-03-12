import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const codeLength = 6;
const correctCode = "441337";

function Cursor() {
  return <span className="animate-pulse">_</span>;
}

function CoinBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(24)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.4, 1.2, 1, 0.6],
            x: Math.cos((i / 24) * Math.PI * 2) * 180,
            y: Math.sin((i / 24) * Math.PI * 2) * 180,
          }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-[#7CFF8F]/50 bg-[#7CFF8F]/10 text-[#7CFF8F] shadow-[0_0_25px_rgba(124,255,143,0.35)]"
        >
          ₿
        </motion.div>
      ))}
    </div>
  );
}

function SpinningCoin() {
  return (
    <motion.div
      initial={{ rotateY: 0, scale: 0 }}
      animate={{ rotateY: 1080, scale: [0.3, 1.2, 1] }}
      transition={{ duration: 1.4 }}
      className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-[#7CFF8F]/60 bg-[#7CFF8F]/10 text-6xl text-[#7CFF8F] shadow-[0_0_40px_rgba(124,255,143,0.4)]"
      style={{ transformStyle: "preserve-3d" }}
    >
      ₿
    </motion.div>
  );
}

export default function BitpandaCryptoPartyChallenge() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [showWin, setShowWin] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (status === "success" || status === "error") return;

      if (/^[0-9]$/.test(e.key)) {
        setCode((prev) => {
          if (prev.length >= codeLength) return prev;
          return prev + e.key;
        });
      }

      if (e.key === "Backspace") {
        setCode((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status]);

  useEffect(() => {
    if (code.length !== codeLength) return;

    if (code === correctCode) {
      setStatus("success");
      setShowWin(true);
      return;
    }

    setStatus("error");
    setGlitch(true);

    setTimeout(() => setGlitch(false), 300);

    const t = setTimeout(() => {
      setCode("");
      setStatus("idle");
    }, 1300);

    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    const handleReset = (e) => {
      if (status !== "success") return;
      if (e.key === "Enter") {
        setCode("");
        setShowWin(false);
        setStatus("idle");
      }
    };

    window.addEventListener("keydown", handleReset);
    return () => window.removeEventListener("keydown", handleReset);
  }, [status]);

  return (
    <div
      className="min-h-screen bg-black text-[#7CFF8F] flex items-center justify-center"
      style={{ fontFamily: '"Courier New", monospace' }}
    >
      <style>{`

      body{background:black}

      .crt{
        position:relative;
        padding:70px;
        border:2px solid rgba(124,255,143,0.25);
        border-radius:30px;
        box-shadow:0 0 60px rgba(124,255,143,0.2);
        background:radial-gradient(circle, rgba(124,255,143,0.08), rgba(0,0,0,0.96));
        animation: flickerMain 8s infinite;
      }

      .crt::before{
        animation:scanlineMove 0.12s linear infinite;
        content:"";
        position:absolute;
        inset:0;
        background:repeating-linear-gradient(
          to bottom,
          rgba(124,255,143,0.05),
          rgba(124,255,143,0.05) 2px,
          transparent 2px,
          transparent 4px
        );
        pointer-events:none;
      }

      .crt::after{
        animation:microFlicker 0.25s infinite steps(2,end);
        content:"";
        position:absolute;
        inset:0;
        background:radial-gradient(circle, transparent 40%, rgba(0,0,0,0.5));
        pointer-events:none;
      }

      @keyframes flickerMain{
        0%{opacity:0.96;filter:brightness(0.95)}
        3%{opacity:1;filter:brightness(1.05)}
        6%{opacity:0.92;filter:brightness(0.9)}
        9%{opacity:1}
        14%{opacity:0.95}
        18%{opacity:1}
        24%{opacity:0.9;filter:brightness(0.85)}
        27%{opacity:1.02;filter:brightness(1.08)}
        31%{opacity:0.96}
        37%{opacity:1}
        44%{opacity:0.93}
        50%{opacity:1}
        57%{opacity:0.91}
        63%{opacity:1}
        71%{opacity:0.94}
        79%{opacity:1.03}
        86%{opacity:0.95}
        92%{opacity:1}
        100%{opacity:0.97}
      }

      @keyframes scanlineMove{
        0%{transform:translateY(-2px)}
        100%{transform:translateY(2px)}
      }

      @keyframes microFlicker{
        0%{opacity:0.15}
        20%{opacity:0.05}
        40%{opacity:0.12}
        60%{opacity:0.03}
        80%{opacity:0.1}
        100%{opacity:0.06}
      }
        4%{opacity:0.95}
        7%{opacity:1}
        12%{opacity:0.96}
        19%{opacity:1}
        33%{opacity:0.94}
        41%{opacity:1}
        52%{opacity:0.96}
        63%{opacity:1}
        78%{opacity:0.95}
        88%{opacity:1}
        100%{opacity:0.98}
      }

      .glitch{
        animation: glitchFlash 0.25s;
      }

      @keyframes glitchFlash{
        0%{transform:translateX(0)}
        20%{transform:translateX(-6px)}
        40%{transform:translateX(6px)}
        60%{transform:translateX(-4px)}
        80%{transform:translateX(4px)}
        100%{transform:translateX(0)}
      }

      .digit{
        border:1px solid rgba(124,255,143,0.35);
        width:70px;
        height:70px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:32px;
        letter-spacing:3px;
        box-shadow:0 0 12px rgba(124,255,143,0.25);
      }

      .glow{
        text-shadow:0 0 12px rgba(124,255,143,0.6);
      }

      `}</style>

      <div className={`crt text-center relative ${glitch ? "glitch" : ""}`}>
        {showWin && <CoinBurst />}

        <div className="flex flex-col items-center mb-6">
          <motion.img
            src="/logo.webp"
            alt="Bitpanda"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="w-20 md:w-28 mb-6 drop-shadow-[0_0_20px_rgba(124,255,143,0.6)]"
            style={{ filter: "drop-shadow(0 0 12px #7CFF8F)" }}
          />

          <div className="text-4xl md:text-7xl font-bold tracking-[0.2em] glow whitespace-nowrap">
            WIN 1 FREE BITCOIN
          </div>
        </div>

        <div className="mb-10 text-sm md:text-base opacity-80 glow tracking-[0.18em]">
          ... just guess the code to the wallet
        </div>

        <div className="flex gap-4 justify-center mb-8">
          {Array.from({ length: codeLength }).map((_, i) => (
            <div
              key={i}
              className="digit"
              style={{
                borderColor:
                  status === "error"
                    ? "#ff6b6b"
                    : status === "success"
                    ? "#7CFF8F"
                    : "rgba(124,255,143,0.35)",
              }}
            >
              {code[i] || "_"}
            </div>
          ))}
        </div>

        <div className="text-sm opacity-80 mb-6">
          ENTER CODE <Cursor />
        </div>

        {status === "error" && (
          <div className="text-red-400 text-xl glow">INVALID CODE</div>
        )}

        <AnimatePresence>
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <SpinningCoin />

              <div className="text-3xl glow mb-4">1 BITCOIN WON</div>
              <div className="text-sm opacity-80 glow tracking-[0.2em]">PRESS ENTER TO CONTINUE</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
