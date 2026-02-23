import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Loader2, Euro, Tag, Plus, Trash2, ChevronLeft, CheckCircle, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function TicketManagement() {
  const queryClient = useQueryClient();
  const [savingTiers, setSavingTiers] = useState(false);
  const [savingTiersOk, setSavingTiersOk] = useState(false);
  const [savingCheckout, setSavingCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState("tiers");

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const [tiers, setTiers] = useState([]);
  const [checkoutQuestions, setCheckoutQuestions] = useState([]);
  const [savingCheckoutOk, setSavingCheckoutOk] = useState(false);

  const { data: eventArr, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });
  const event = eventArr?.[0];

  const { data: existingTiers, isLoading: tiersLoading } = useQuery({
    queryKey: ["tiers", eventId],
    queryFn: () => base44.entities.TicketTier.filter({ event_id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });

  React.useEffect(() => {
    if (existingTiers?.length) {
      setTiers(existingTiers);
    }
  }, [existingTiers]);

  React.useEffect(() => {
    if (event?.custom_questions) {
      setCheckoutQuestions(event.custom_questions.map((q, idx) => {
        let required = false;
        let text = q;
        let type = "text";
        let options = [];

        // Parse the custom_question format: "text||type||options||required"
        if (q.includes("||")) {
          const parts = q.split("||");
          text = parts[0];
          type = parts[1] || "text";
          options = parts[2] ? parts[2].split("~") : [];
          required = parts[3] === "true";
        }

        return {
          id: idx,
          text,
          required,
          type,
          options
        };
      }));
    }
  }, [event]);

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...tiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setTiers(updatedTiers);
  };

  const handleAddTier = () => {
    const newTier = {
      event_id: eventId,
      name: "",
      description: "",
      price: 0,
      capacity: null,
      sort_order: tiers.length,
      is_visible: true,
      color: "Standard",
    };
    setTiers([...tiers, newTier]);
  };

  const handleRemoveTier = async (index) => {
    const tier = tiers[index];
    if (tier.id) {
      try {
        await base44.entities.TicketTier.delete(tier.id);
        const updated = tiers.filter((_, i) => i !== index);
        setTiers(updated);
        toast.success("Ticketstufe gelöscht");
      } catch (err) {
        toast.error("Fehler beim Löschen");
      }
    } else {
      const updated = tiers.filter((_, i) => i !== index);
      setTiers(updated);
    }
  };

  const handleSaveTiers = async () => {
    setSavingTiers(true);
    setSavingTiersOk(false);
    try {
      for (const tier of tiers) {
        if (tier.id) {
          await base44.entities.TicketTier.update(tier.id, tier);
        } else {
          await base44.entities.TicketTier.create(tier);
        }
      }
      queryClient.invalidateQueries(["tiers", eventId]);
      toast.success("Ticketstufen gespeichert");
      setSavingTiersOk(true);
      setTimeout(() => setSavingTiersOk(false), 2000);
    } catch (err) {
      toast.error("Fehler beim Speichern");
    } finally {
      setSavingTiers(false);
    }
  };

  const addCheckoutQuestion = () => {
    setCheckoutQuestions([...checkoutQuestions, { id: Date.now(), text: "", required: false, type: "text", options: [] }]);
  };

  const updateCheckoutQuestion = (id, field, value) => {
    setCheckoutQuestions(checkoutQuestions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const removeCheckoutQuestion = (id) => {
    setCheckoutQuestions(checkoutQuestions.filter(q => q.id !== id));
  };

  const addCheckoutOption = (questionId) => {
    setCheckoutQuestions(checkoutQuestions.map(q => 
      q.id === questionId ? { ...q, options: [...(q.options || []), ""] } : q
    ));
  };

  const updateCheckoutOption = (questionId, optionIdx, value) => {
    setCheckoutQuestions(checkoutQuestions.map(q => 
      q.id === questionId ? { ...q, options: q.options.map((opt, i) => i === optionIdx ? value : opt) } : q
    ));
  };

  const removeCheckoutOption = (questionId, optionIdx) => {
    setCheckoutQuestions(checkoutQuestions.map(q => 
      q.id === questionId ? { ...q, options: q.options.filter((_, i) => i !== optionIdx) } : q
    ));
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;

    const items = Array.from(checkoutQuestions);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);
    setCheckoutQuestions(items);
  };

  const handleSaveCheckout = async () => {
    setSavingCheckout(true);
    setSavingCheckoutOk(false);
    await base44.entities.Event.update(event.id, {
      custom_questions: checkoutQuestions.map(q => {
        const baseFormat = `${q.text}||${q.type}||${(q.options || []).join("~")}||${q.required}`;
        return baseFormat;
      })
    });
    queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    setSavingCheckout(false);
    setSavingCheckoutOk(true);
    setTimeout(() => setSavingCheckoutOk(false), 2000);
    toast.success("Custom Checkout gespeichert");
  };

  const di = { background:"#111", border:"1px solid #1e1e1e", borderRadius:"10px", color:"#fff", padding:"10px 14px", fontSize:"13px", width:"100%", outline:"none" };
  const onF = e => e.target.style.borderColor="#beff00";
  const onB = e => e.target.style.borderColor="#1e1e1e";
  const DI = ({ label, children }) => (
    <div>
      <label style={{ display:"block", fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#444", marginBottom:"6px" }}>{label}</label>
      {children}
    </div>
  );

  if (!eventId) return <div className="p-6 text-center" style={{color:"#555"}}>Event nicht gefunden.</div>;
  if (eventLoading || tiersLoading) return <div className="flex items-center justify-center min-h-screen" style={{background:"#070707"}}><Loader2 className="w-6 h-6 animate-spin" style={{color:"#333"}} /></div>;

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background:"#070707" }}>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <Link to={createPageUrl(`Dashboard?event_id=${eventId}`)} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4 transition-colors" style={{color:"#444"}} onMouseEnter={e=>e.currentTarget.style.color="#beff00"} onMouseLeave={e=>e.currentTarget.style.color="#444"}>
            <ChevronLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ticketing</h1>
          <p className="text-xs mt-0.5 uppercase tracking-widest" style={{color:"#444"}}>{event?.name}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{background:"#0d0d0d",border:"1px solid #1a1a1a"}}>
          {[["tiers","Ticketstufen"],["checkout","Custom Checkout"]].map(([id,label])=>(
            <button key={id} onClick={()=>setActiveTab(id)} className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
              style={activeTab===id?{background:"#beff00",color:"#070707"}:{color:"#444"}}
            >{label}</button>
          ))}
        </div>

        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
          {activeTab === "tiers" && (
            <div className="rounded-2xl p-6 space-y-5" style={{background:"#0d0d0d",border:"1px solid #1a1a1a"}}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{color:"#333"}}>Ticketstufen</p>
              <div className="space-y-4">
                {tiers.map((tier, index) => (
                  <div key={index} className="rounded-xl p-5 space-y-4" style={{background:"#111",border:"1px solid #1a1a1a"}}>
                    <div className="grid grid-cols-3 gap-4">
                      <DI label="Name *"><input style={di} value={tier.name} onChange={e=>handleTierChange(index,"name",e.target.value)} placeholder="Early Bird" onFocus={onF} onBlur={onB} /></DI>
                      <DI label={`Preis (${event?.currency})`}><input type="number" style={di} value={tier.price||0} onChange={e=>handleTierChange(index,"price",parseFloat(e.target.value)||0)} min="0" onFocus={onF} onBlur={onB} /></DI>
                      <DI label="Kapazität"><input type="number" style={di} value={tier.capacity||""} onChange={e=>handleTierChange(index,"capacity",e.target.value?parseInt(e.target.value):null)} placeholder="∞" onFocus={onF} onBlur={onB} /></DI>
                    </div>
                    <DI label="Beschreibung"><input style={di} value={tier.description||""} onChange={e=>handleTierChange(index,"description",e.target.value)} placeholder="Optional" onFocus={onF} onBlur={onB} /></DI>
                    <div className="grid grid-cols-2 gap-4">
                      <DI label="Kategorie">
                        <select style={{...di,cursor:"pointer"}} value={tier.color||"Standard"} onChange={e=>handleTierChange(index,"color",e.target.value)} onFocus={onF} onBlur={onB}>
                          {["Standard","VIP","Business","Presse","Speaker","Sponsor"].map(c=><option key={c} value={c} style={{background:"#111"}}>{c}</option>)}
                        </select>
                      </DI>
                      <div className="flex items-end pb-0.5">
                        <div className="flex items-center gap-3">
                          <Switch checked={tier.is_visible!==false} onCheckedChange={c=>handleTierChange(index,"is_visible",c)} />
                          <span className="text-sm text-white">Sichtbar</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={()=>handleRemoveTier(index)} className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all" style={{background:"#1a0505",color:"#ef4444",border:"1px solid #2a0808"}}>
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Löschen
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleAddTier} className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all" style={{background:"transparent",color:"#444",border:"2px dashed #1e1e1e"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#beff00";e.currentTarget.style.color="#beff00";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e1e1e";e.currentTarget.style.color="#444";}}
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Neue Ticketstufe
              </button>
              <button onClick={handleSaveTiers} disabled={savingTiers} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                style={{background:"#beff00",color:"#070707"}}
                onMouseEnter={e=>{if(!savingTiers)e.currentTarget.style.boxShadow="0 0 24px rgba(190,255,0,0.4)"}}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
              >
                {savingTiers ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />{savingTiersOk?"Gespeichert!":"Ticketstufen speichern"}</>}
              </button>
            </div>
          )}

          {activeTab === "checkout" && (
            <div className="rounded-2xl p-6 space-y-5" style={{background:"#0d0d0d",border:"1px solid #1a1a1a"}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Custom Checkout Fragen</p>
                  <p className="text-xs mt-0.5" style={{color:"#444"}}>Individuelle Fragen beim Checkout</p>
                </div>
                <button onClick={addCheckoutQuestion} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all" style={{background:"#0d1a00",color:"#beff00",border:"1px solid #1a2e00"}}>
                  <Plus className="w-3.5 h-3.5" /> Frage hinzufügen
                </button>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="checkout-questions">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {checkoutQuestions.map((question, index) => (
                        <Draggable key={question.id} draggableId={String(question.id)} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} className="rounded-xl p-4 space-y-3" style={{background:snapshot.isDragging?"#161616":"#111",border:"1px solid #1e1e1e"}}>
                              <div className="flex gap-3 items-start">
                                <div {...provided.dragHandleProps} className="mt-2 cursor-grab">
                                  <GripVertical className="w-4 h-4" style={{color:"#333"}} />
                                </div>
                                <div className="flex-1">
                                  <DI label="Frage"><input style={di} value={question.text} onChange={e=>updateCheckoutQuestion(question.id,"text",e.target.value)} placeholder="z.B. Diätische Anforderungen?" onFocus={onF} onBlur={onB} /></DI>
                                </div>
                                <div className="w-32">
                                  <DI label="Typ">
                                    <select style={{...di,cursor:"pointer"}} value={question.type||"text"} onChange={e=>updateCheckoutQuestion(question.id,"type",e.target.value)} onFocus={onF} onBlur={onB}>
                                      <option value="text" style={{background:"#111"}}>Textfeld</option>
                                      <option value="dropdown" style={{background:"#111"}}>Dropdown</option>
                                    </select>
                                  </DI>
                                </div>
                                <button onClick={()=>removeCheckoutQuestion(question.id)} className="mt-6 p-1.5 rounded-lg transition-all" style={{color:"#ef4444"}}
                                  onMouseEnter={e=>e.currentTarget.style.background="#1a0505"}
                                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                                ><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                              {question.type === "dropdown" && (
                                <div className="pt-3 space-y-2" style={{borderTop:"1px solid #1e1e1e"}}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-widest" style={{color:"#444"}}>Optionen</span>
                                    <button onClick={()=>addCheckoutOption(question.id)} className="text-xs px-2 py-1 rounded-lg transition-all" style={{color:"#beff00",background:"#0d1a00",border:"1px solid #1a2e00"}}>+ Option</button>
                                  </div>
                                  {(question.options||[]).map((opt,oi)=>(
                                    <div key={oi} className="flex gap-2">
                                      <input style={di} value={opt} onChange={e=>updateCheckoutOption(question.id,oi,e.target.value)} placeholder="z.B. Vegetarisch" onFocus={onF} onBlur={onB} />
                                      <button onClick={()=>removeCheckoutOption(question.id,oi)} className="p-2 rounded-lg" style={{color:"#ef4444",background:"#1a0505"}}><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                                <input type="checkbox" checked={question.required||false} onChange={e=>updateCheckoutQuestion(question.id,"required",e.target.checked)} />
                                Pflichtfeld
                              </label>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {checkoutQuestions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs uppercase tracking-widest" style={{color:"#2a2a2a"}}>Keine Fragen hinzugefügt</p>
                </div>
              )}

              <button onClick={handleSaveCheckout} disabled={savingCheckout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                style={{background:"#beff00",color:"#070707"}}
                onMouseEnter={e=>{if(!savingCheckout)e.currentTarget.style.boxShadow="0 0 24px rgba(190,255,0,0.4)"}}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}
              >
                {savingCheckout ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />{savingCheckoutOk?"Gespeichert!":"Custom Checkout speichern"}</>}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}