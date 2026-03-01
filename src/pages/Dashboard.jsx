import React, { useState, useMemo, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import StatsOverview from "../components/admin/StatsOverview";
import RegistrationTable from "../components/admin/RegistrationTable";
import ApprovalSuccessOverlay from "../components/admin/ApprovalSuccessOverlay";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Calendar, MapPin, ExternalLink } from "lucide-react";

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

  // EVENT
  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => base44.entities.Event.filter({ id: eventId }),
    enabled: !!eventId,
    select: (data) => data?.[0],
  });

  // REGISTRATIONS
  const { data: registrations = [] } = useQuery({
    queryKey: ["registrations", eventId],
    queryFn: () =>
      eventId
        ? base44.entities.Registration.filter(
            { event_id: eventId },
            "-created_date"
          )
        : base44.entities.Registration.list("-created_date"),
  });

  // TICKETS
  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets", eventId],
    queryFn: () =>
      eventId
        ? base44.entities.Ticket.filter({ event_id: eventId })
        : base44.entities.Ticket.list(),
  });

  // EMAIL SEQUENCES
  const { data: emailSequences = [] } = useQuery({
    queryKey: ["email-sequences", eventId],
    queryFn: () =>
      base44.entities.EmailSequence.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  // EMAIL AUTOMATION (BLOCKS DELETED USERS)
  useEffect(() => {
    if (!event?.date || !emailSequences.length || !registrations.length)
      return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);

    for (const seq of emailSequences) {
      if (!seq.enabled) continue;

      const seqKey = `seq_sent_${seq.id}_${today
        .toISOString()
        .slice(0, 10)}`;

      if (localStorage.getItem(seqKey)) continue;

      let shouldSend = false;

      if (seq.trigger === "reminder_before") {
        const targetDate = new Date(eventDate);
        targetDate.setDate(
          targetDate.getDate() - (seq.days_offset || 3)
        );
        shouldSend = today.getTime() === targetDate.getTime();
      }

      if (seq.trigger === "post_event") {
        const targetDate = new Date(eventDate);
        targetDate.setDate(
          targetDate.getDate() + (seq.days_offset || 1)
        );
        shouldSend = today.getTime() === targetDate.getTime();
      }

      if (shouldSend) {
        const recipients = registrations.filter(
          (r) =>
            r.status !== "deleted" &&
            (seq.send_to === "all"
              ? true
              : r.status === "approved")
        );

        localStorage.setItem(seqKey, "1");

        (async () => {
          for (const reg of recipients) {
            const personalBody = (seq.body || "")
              .replace(/\{\{vorname\}\}/gi, reg.first_name || "")
              .replace(/\{\{nachname\}\}/gi, reg.last_name || "")
              .replace(
                /\{\{name\}\}/gi,
                `${reg.first_name || ""} ${
                  reg.last_name || ""
                }`.trim()
              )
              .replace(/\{\{email\}\}/gi, reg.email || "")
              .replace(
                /\{\{kategorie\}\}/gi,
                reg.category || "Standard"
              );

            await base44.integrations.Core.SendEmail({
              to: reg.email,
              subject: seq.subject,
              body: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;">${personalBody.replace(
                /\n/g,
                "<br/>"
              )}</div>`,
            });
          }
        })();
      }
    }
  }, [event, emailSequences, registrations]);

  // STATS (EXCLUDES DELETED USERS)
  const activeRegistrations = useMemo(
    () => registrations.filter((r) => r.status !== "deleted"),
    [registrations]
  );

  const stats = useMemo(
    () => ({
      total: activeRegistrations.length,
      pending: activeRegistrations.filter(
        (r) => r.status === "pending"
      ).length,
      approved: activeRegistrations.filter(
        (r) => r.status === "approved"
      ).length,
      rejected: activeRegistrations.filter(
        (r) => r.status === "rejected"
      ).length,
      tickets: tickets.length,
      checkedIn: tickets.filter((t) => t.status === "used").length,
    }),
    [activeRegistrations, tickets]
  );

  // FILTER
  const filteredRegistrations = useMemo(() => {
    return activeRegistrations.filter((r) => {
      const statusMatch =
        filterStatus === "all" || r.status === filterStatus;
      const catMatch =
        filterCategory === "all" ||
        r.category === filterCategory;
      return statusMatch && catMatch;
    });
  }, [
    activeRegistrations,
    filterStatus,
    filterCategory,
  ]);

  // HANDLERS
  const handleEdit = async (form) => {
    await base44.entities.Registration.update(form.id, form);
    queryClient.invalidateQueries({
      queryKey: ["registrations", eventId],
    });
  };

  const handleApprove = async (reg) => {
    setProcessingId(reg.id);
    try {
      const result =
        await base44.functions.invoke(
          "approveGuestAndSendTicket",
          { guestId: reg.id }
        );

      if (result.data?.success) {
        showSuccess("Ticket generiert & versendet");
      } else {
        toast.error("Fehler bei der Freigabe");
      }
    } catch (err) {
      toast.error("Serverfehler: " + err.message);
    }

    queryClient.invalidateQueries({
      queryKey: ["registrations", eventId],
    });
    queryClient.invalidateQueries({
      queryKey: ["tickets", eventId],
    });

    setProcessingId(null);
  };

  const handleResendTicket = async (reg) => {
    setProcessingId(reg.id);
    try {
      const result =
        await base44.functions.invoke(
          "resendTicketEmail",
          { guestId: reg.id }
        );

      if (result.data?.success) {
        showSuccess("Ticket erneut versendet");
      } else {
        toast.error("E-Mail konnte nicht versendet werden");
      }
    } catch (err) {
      toast.error("Serverfehler: " + err.message);
    }

    setProcessingId(null);
  };

  const handleReject = async (regId) => {
    setProcessingId(regId);
    await base44.entities.Registration.update(regId, {
      status: "rejected",
    });

    toast.success("Registrierung abgelehnt");

    queryClient.invalidateQueries({
      queryKey: ["registrations", eventId],
    });

    setProcessingId(null);
  };

  const handleCategoryChange = async (regId, category) => {
    await base44.entities.Registration.update(regId, {
      category,
    });

    queryClient.invalidateQueries({
      queryKey: ["registrations", eventId],
    });
  };

  // DSGVO DELETE
  const handleDeleteGuest = async (reg) => {
    if (
      !window.confirm(
        "Gast wirklich DSGVO-konform löschen?"
      )
    )
      return;

    setProcessingId(reg.id);

    try {
      await base44.functions.invoke("deleteGuestGDPR", {
        guestId: reg.id,
      });

      toast.success("Gast DSGVO-konform gelöscht");
    } catch (err) {
      toast.error("Fehler beim Löschen: " + err.message);
    }

    queryClient.invalidateQueries({
      queryKey: ["registrations", eventId],
    });
    queryClient.invalidateQueries({
      queryKey: ["tickets", eventId],
    });

    setProcessingId(null);
  };

  return (
    <div
      className="min-h-screen p-5 md:p-8 space-y-6"
      style={{ background: "#070707" }}
    >
      <ApprovalSuccessOverlay
        show={!!successMessage}
        message={successMessage}
      />

<div className="flex items-start justify-between gap-4">
  <div>
    <Link
      to={createPageUrl("Home")}
      className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest mb-4 transition-colors"
      style={{ color: "#444" }}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Alle Events
    </Link>

    <h1 className="text-2xl font-bold text-white tracking-tight">
      {event?.name || "Dashboard"}
    </h1>

    {event?.date && (
      <div className="flex items-center gap-4 mt-1.5">
        <span className="flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(event.date).toLocaleDateString("de-DE")}
        </span>

        {event.location && (
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            {event.location}
          </span>
        )}
      </div>
    )}
  </div>

  {eventId && (
    <Link
      to={createPageUrl(`Event?event_id=${eventId}`)}
      target="_blank"
      className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:opacity-80"
      style={{
        background: "#111",
        border: "1px solid #1f1f1f",
        color: "white",
      }}
    >
      Event ansehen
      <ExternalLink className="w-3.5 h-3.5" />
    </Link>
  )}
</div>

      <StatsOverview stats={stats} />

      <RegistrationTable
        registrations={filteredRegistrations}
        tickets={tickets}
        event={event}
        onApprove={handleApprove}
        onReject={handleReject}
        onResend={handleResendTicket}
        onCategoryChange={handleCategoryChange}
        onEdit={handleEdit}
        onDelete={handleDeleteGuest}
        processingId={processingId}
        filterStatus={filterStatus}
        filterCategory={filterCategory}
        onFilterStatusChange={setFilterStatus}
        onFilterCategoryChange={setFilterCategory}
      />
    </div>
  );
}