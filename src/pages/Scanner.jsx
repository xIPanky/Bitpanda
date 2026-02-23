import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Search, CheckCircle2, XCircle, AlertTriangle, Loader2, RotateCcw, Camera } from "lucide-react";
import { toast } from "sonner";
import QRScanner from "../components/scanner/QRScanner";

export default function Scanner() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

  const handleScan = async (scanCode) => {
    const trimmed = (scanCode || code).trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);

    const tickets = await base44.entities.Ticket.filter({ ticket_code: trimmed });

    if (!tickets || tickets.length === 0) {
      setResult({ type: "error", message: "Ticket nicht gefunden", ticket: null });
      setLoading(false);
      return;
    }

    const ticket = tickets[0];

    if (ticket.status === "used") {
      setResult({
        type: "warning",
        message: `Bereits eingecheckt am ${new Date(ticket.checked_in_at).toLocaleString("de-DE")}`,
        ticket,
      });
      setLoading(false);
      return;
    }

    if (ticket.status === "cancelled") {
      setResult({ type: "error", message: "Ticket wurde storniert", ticket });
      setLoading(false);
      return;
    }

    // Valid ticket – check in
    await base44.entities.Ticket.update(ticket.id, {
      status: "used",
      checked_in_at: new Date().toISOString(),
    });

    // Load registration for full details
    let registration = null;
    if (ticket.registration_id) {
      const regs = await base44.entities.Registration.filter({ id: ticket.registration_id });
      registration = regs?.[0] || null;
    }

    setResult({
      type: "success",
      message: "Check-in erfolgreich!",
      ticket: { ...ticket, status: "used" },
      registration,
    });
    toast.success("Gast eingecheckt!");
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  const handleQRScan = (scannedCode) => {
    setShowCamera(false);
    setCode(scannedCode.trim());
    handleScan(scannedCode.trim());
  };

  const reset = () => {
    setResult(null);
    setCode("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const resultConfig = {
    success: { border:"#1a2e00", bg:"#0d1a00", iconBg:"#162600", iconColor:"#beff00", icon:CheckCircle2 },
    warning: { border:"#2a2000", bg:"#1a1500", iconBg:"#221900", iconColor:"#f59e0b", icon:AlertTriangle },
    error:   { border:"#2a0808", bg:"#1a0505", iconBg:"#220808", iconColor:"#ef4444", icon:XCircle },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:"#070707" }}>
      {showCamera && <QRScanner onScan={handleQRScan} onClose={() => setShowCamera(false)} />}
      <div className="w-full max-w-lg">
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{background:"#0d1a00",border:"1px solid #1a2e00"}}>
            <ScanLine className="w-8 h-8" style={{color:"#beff00"}} />
          </div>
          <h1 className="text-2xl font-bold text-white">Ticket Scanner</h1>
          <p className="text-sm mt-1" style={{color:"#444"}}>QR-Code scannen oder Ticket-Code eingeben</p>
        </motion.div>

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="p-5 mb-5 rounded-2xl" style={{background:"#0d0d0d",border:"1px solid #1a1a1a"}}>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              value={code}
              onChange={e=>setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="ABC-123"
              autoFocus
              className="flex-1 h-14 text-lg font-mono tracking-wider text-center rounded-xl outline-none"
              style={{background:"#111",border:"1px solid #1e1e1e",color:"#beff00"}}
              onFocus={e=>e.target.style.borderColor="#beff00"}
              onBlur={e=>e.target.style.borderColor="#1e1e1e"}
            />
            <button onClick={()=>setShowCamera(true)} className="h-14 px-4 rounded-xl transition-all" style={{background:"#111",border:"1px solid #1e1e1e",color:"#555"}}
              onMouseEnter={e=>{e.currentTarget.style.color="#beff00";e.currentTarget.style.borderColor="#beff00";}}
              onMouseLeave={e=>{e.currentTarget.style.color="#555";e.currentTarget.style.borderColor="#1e1e1e";}}
            >
              <Camera className="w-5 h-5" />
            </button>
            <button onClick={()=>handleScan()} disabled={loading||!code.trim()} className="h-14 px-6 rounded-xl transition-all disabled:opacity-40"
              style={{background:"#beff00",color:"#070707"}}
              onMouseEnter={e=>{if(!loading&&code.trim())e.currentTarget.style.boxShadow="0 0 20px rgba(190,255,0,0.4)"}}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {result && (() => {
            const rc = resultConfig[result.type];
            const RIcon = rc.icon;
            return (
              <motion.div key={result.type} initial={{opacity:0,y:20,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-20,scale:0.95}} transition={{type:"spring",stiffness:300,damping:25}}
                className="rounded-2xl p-8" style={{background:rc.bg,border:`1px solid ${rc.border}`}}
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{background:rc.iconBg}}>
                    <RIcon className="w-8 h-8" style={{color:rc.iconColor}} />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{result.message}</h2>
                  {result.ticket && (
                    <div className="mt-6 rounded-xl p-5 text-left space-y-3" style={{background:"rgba(0,0,0,0.3)"}}>
                      {result.type==="success"&&result.registration ? (
                        <>
                          <div className="text-center pb-3 mb-1" style={{borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
                            <p className="text-xl font-bold text-white">{result.registration.first_name} {result.registration.last_name}</p>
                          </div>
                          {[["Kategorie",result.ticket.category],["Code",result.ticket.ticket_code]].map(([k,v])=>(
                            <div key={k} className="flex justify-between"><span className="text-sm" style={{color:"rgba(255,255,255,0.4)"}}>{k}</span><span className="text-sm font-semibold text-white font-mono">{v}</span></div>
                          ))}
                        </>
                      ) : (
                        <>
                          {[["Gast",result.ticket.guest_name],["Kategorie",result.ticket.category],["Code",result.ticket.ticket_code]].map(([k,v])=>(
                            <div key={k} className="flex justify-between"><span className="text-sm" style={{color:"rgba(255,255,255,0.4)"}}>{k}</span><span className="text-sm font-semibold text-white">{v}</span></div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                  <button onClick={reset} className="mt-6 inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
                    style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.1)"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.15)";e.currentTarget.style.color="#fff";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.color="rgba(255,255,255,0.6)";}}
                  >
                    <RotateCcw className="w-4 h-4" /> Nächsten Gast scannen
                  </button>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}