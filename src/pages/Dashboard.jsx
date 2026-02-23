import React, { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import StatsOverview from "../components/admin/StatsOverview";
import RegistrationTable from "../components/admin/RegistrationTable";
import ApprovalSuccessOverlay from "../components/admin/ApprovalSuccessOverlay";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";


export default function Dashboard() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const queryClient = useQueryClient();

  const showSuccess = useCallback((msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("event_id");

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }),
    enabled: !!eventId,
    select: (data) => data?.[0],
  });

  const { data: registrations } = useQuery({
    queryKey: ["registrations", eventId],
    queryFn: () => eventId
      ? base44.entities.Registration.filter({ event_id: eventId }, "-created_date")
      : base44.entities.Registration.list("-created_date"),
    initialData: [],
  });

  const { data: tickets } = useQuery({
    queryKey: ["tickets", eventId],
    queryFn: () => eventId
      ? base44.entities.Ticket.filter({ event_id: eventId })
      : base44.entities.Ticket.list(),
    initialData: [],
  });

  const { data: tiers } = useQuery({
    queryKey: ["tiers", eventId],
    queryFn: () => base44.entities.TicketTier.filter({ event_id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });

  const { data: emailSequences } = useQuery({
    queryKey: ["email-sequences", eventId],
    queryFn: () => base44.entities.EmailSequence.filter({ event_id: eventId }),
    enabled: !!eventId,
    initialData: [],
  });

  React.useEffect(() => {
    if (!event?.date || !emailSequences.length || !registrations.length) return;
    const today = new Date(); today.setHours(0,0,0,0);
    const eventDate = new Date(event.date); eventDate.setHours(0,0,0,0);

    for (const seq of emailSequences) {
      if (!seq.enabled) continue;
      const seqKey = `seq_sent_${seq.id}_${today.toISOString().slice(0,10)}`;
      if (localStorage.getItem(seqKey)) continue;

      let shouldSend = false;
      if (seq.trigger === "reminder_before") {
        const targetDate = new Date(eventDate);
        targetDate.setDate(targetDate.getDate() - (seq.days_offset || 3));
        shouldSend = today.getTime() === targetDate.getTime();
      } else if (seq.trigger === "post_event") {
        const targetDate = new Date(eventDate);
        targetDate.setDate(targetDate.getDate() + (seq.days_offset || 1));
        shouldSend = today.getTime() === targetDate.getTime();
      }

      if (shouldSend) {
        const recipients = registrations.filter((r) => seq.send_to === "all" ? true : r.status === "approved");
        localStorage.setItem(seqKey, "1");
        (async () => {
          for (const reg of recipients) {
            const personalBody = (seq.body || "")
              .replace(/\{\{vorname\}\}/gi, reg.first_name || "")
              .replace(/\{\{nachname\}\}/gi, reg.last_name || "")
              .replace(/\{\{name\}\}/gi, `${reg.first_name || ""} ${reg.last_name || ""}`.trim())
              .replace(/\{\{email\}\}/gi, reg.email || "")
              .replace(/\{\{kategorie\}\}/gi, reg.category || "Standard");
            await base44.integrations.Core.SendEmail({
              to: reg.email,
              subject: seq.subject,
              body: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;">${personalBody.replace(/\n/g,"<br/>")}</div>`,
            });
          }
        })();
      }
    }
  }, [event, emailSequences, registrations]);

  const stats = useMemo(() => ({
    total: registrations.length,
    pending: registrations.filter((r) => r.status === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
    tickets: tickets.length,
    checkedIn: tickets.filter((t) => t.status === "used").length,
  }), [registrations, tickets]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const statusMatch = filterStatus === "all" || r.status === filterStatus;
      const catMatch = filterCategory === "all" || r.category === filterCategory;
      return statusMatch && catMatch;
    });
  }, [registrations, filterStatus, filterCategory]);

  const handleEdit = async (form) => {
    await base44.entities.Registration.update(form.id, form);
    queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
  };

  const handleApprove = async (reg) => {
    setProcessingId(reg.id);
    try {
      const result = await base44.functions.invoke("approveGuestAndSendTicket", { guestId: reg.id });
      if (result.data?.success) {
        if (result.data.emailSuccess) {
          showSuccess("Ticket erfolgreich versendet");
        } else {
          toast.warning(`${reg.first_name} freigegeben – E-Mail fehlgeschlagen. Bitte erneut senden.`);
        }
      } else {
        toast.error(result.data?.error || "Fehler bei der Freigabe");
      }
    } catch (err) {
      toast.error("Serverfehler: " + err.message);
    }
    queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
    queryClient.invalidateQueries({ queryKey: ["tickets", eventId] });
    setProcessingId(null);
  };

  const handleResendTicket = async (reg) => {
    setProcessingId(reg.id);
    try {
      const result = await base44.functions.invoke("resendTicketEmail", { guestId: reg.id });
      if (result.data?.success) {
        showSuccess("Ticket erfolgreich versendet");
      } else {
        toast.error(result.data?.error || "Fehler beim Senden");
      }
    } catch (err) {
      toast.error("Serverfehler: " + err.message);
    }
    setProcessingId(null);
  };

  const handleReject = async (regId) => {
    setProcessingId(regId);
    await base44.entities.Registration.update(regId, { status: "rejected" });
    queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
    toast.success("Registrierung abgelehnt");
    setProcessingId(null);
  };

  const handleCategoryChange = async (regId, category) => {
    await base44.entities.Registration.update(regId, { category });
    queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
  };

  return (
    <div className="min-h-screen p-5 md:p-8 space-y-6" style={{ background: "#070707" }}>
      <ApprovalSuccessOverlay show={!!successMessage} message={successMessage} />
      <div>
        <Link
          to={createPageUrl("Home")}
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest mb-4 transition-colors"
          style={{ color: "#444" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#beff00"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#444"}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Alle Events
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">{event?.name || "Dashboard"}</h1>
        {event?.date && (
          <div className="flex items-center gap-4 mt-1.5">
            <span className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
              <Calendar className="w-3.5 h-3.5" />
              {new Date(event.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
              {event.time && ` · ${event.time}`}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            )}
          </div>
        )}
      </div>

      <StatsOverview stats={stats} />

      <RegistrationTable
        registrations={filteredRegistrations}
        onApprove={handleApprove}
        onReject={handleReject}
        onResend={handleResendTicket}
        onCategoryChange={handleCategoryChange}
        onEdit={handleEdit}
        processingId={processingId}
        filterStatus={filterStatus}
        filterCategory={filterCategory}
        onFilterStatusChange={setFilterStatus}
        onFilterCategoryChange={setFilterCategory}
      />
    </div>
  );
}