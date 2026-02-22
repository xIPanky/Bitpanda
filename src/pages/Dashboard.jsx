import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import StatsOverview from "../components/admin/StatsOverview";
import RegistrationTable from "../components/admin/RegistrationTable";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

function generateTicketCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const pick = () => letters.charAt(Math.floor(Math.random() * letters.length));
  const a = pick(), b = pick(), c = pick();
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${a}${b}${c}-${suffix}`;
}

export default function Dashboard() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const queryClient = useQueryClient();

  // Get event_id from URL
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

  // Auto-trigger reminder & post-event emails on dashboard load
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
        const recipients = registrations.filter((r) =>
          seq.send_to === "all" ? true : r.status === "approved"
        );
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
              body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;">${personalBody.replace(/\n/g,"<br/>")}<hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;"/><p style="color:#94a3b8;font-size:12px;">${event?.name || ""}</p></div>`,
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
    const ticketCode = generateTicketCode();
    const me = await base44.auth.me();

    // Find tier if selected
    const tier = tiers.find((t) => t.id === reg.ticket_tier_id);

    await base44.entities.Registration.update(reg.id, {
      status: "approved",
      approved_by: me?.email || "Admin",
    });

    await base44.entities.Ticket.create({
      event_id: eventId || reg.event_id,
      registration_id: reg.id,
      ticket_tier_id: reg.ticket_tier_id || null,
      ticket_code: ticketCode,
      guest_name: `${reg.first_name} ${reg.last_name}`,
      guest_email: reg.email,
      category: reg.category || "Standard",
      tier_name: tier?.name || null,
      tier_price: tier?.price || null,
      status: "valid",
      email_sent: false,
    });

    const ticketUrl = `${window.location.origin}/ticket?code=${ticketCode}`;

    // Check for custom confirmation sequence
    const confirmSeq = emailSequences.find((s) => s.trigger === "on_registration" && s.enabled);
    if (confirmSeq) {
      const personalBody = (confirmSeq.body || "")
        .replace(/\{\{vorname\}\}/gi, reg.first_name || "")
        .replace(/\{\{nachname\}\}/gi, reg.last_name || "")
        .replace(/\{\{name\}\}/gi, `${reg.first_name || ""} ${reg.last_name || ""}`.trim())
        .replace(/\{\{email\}\}/gi, reg.email || "")
        .replace(/\{\{kategorie\}\}/gi, reg.category || "Standard");
      await base44.integrations.Core.SendEmail({
        to: reg.email,
        subject: confirmSeq.subject,
        body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;">${personalBody.replace(/\n/g,"<br/>")}<div style="background:#f8fafc;border-radius:16px;padding:24px;margin:24px 0;text-align:center;"><p style="font-size:14px;color:#94a3b8;margin-bottom:8px;">Ihr Ticket-Code</p><p style="font-size:32px;font-weight:700;color:#0f172a;letter-spacing:2px;">${ticketCode}</p></div><p style="color:#64748b;"><a href="${ticketUrl}" style="color:#d97706;font-weight:600;">Ticket online ansehen →</a></p>${event?.date ? `<p style="color:#94a3b8;font-size:13px;margin-top:24px;">📅 ${new Date(event.date).toLocaleDateString("de-DE",{day:"numeric",month:"long",year:"numeric"})}${event.time ? ` um ${event.time} Uhr` : ""}${event.location ? ` · 📍 ${event.location}` : ""}</p>` : ""}</div>`,
      });
    } else {
      await base44.integrations.Core.SendEmail({
        to: reg.email,
        subject: `Ihr Ticket: ${event?.name || "Veranstaltung"}`,
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <h1 style="font-size: 24px; color: #0f172a;">Ihre Registrierung wurde freigegeben!</h1>
            <p style="color: #64748b; line-height: 1.6;">
              Hallo ${reg.first_name},<br/><br/>
              Ihre Anmeldung für <strong>${event?.name || "die Veranstaltung"}</strong> wurde bestätigt.
              ${tier ? `<br/>Ticketstufe: <strong>${tier.name}</strong>${tier.price > 0 ? ` (${tier.price} ${event?.currency || "EUR"})` : ""}` : ""}
            </p>
            <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="font-size: 14px; color: #94a3b8; margin-bottom: 8px;">Ihr Ticket-Code</p>
              <p style="font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 2px;">${ticketCode}</p>
            </div>
            <p style="color: #64748b;">
              <a href="${ticketUrl}" style="color: #d97706; font-weight: 600;">Ticket online ansehen →</a>
            </p>
            ${event?.date ? `<p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">📅 ${new Date(event.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}${event.time ? ` um ${event.time} Uhr` : ""}${event.location ? ` · 📍 ${event.location}` : ""}</p>` : ""}
          </div>
        `,
      });
    }

    const createdTickets = await base44.entities.Ticket.filter({ ticket_code: ticketCode });
    if (createdTickets.length > 0) {
      await base44.entities.Ticket.update(createdTickets[0].id, { email_sent: true });
    }

    queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
    queryClient.invalidateQueries({ queryKey: ["tickets", eventId] });
    toast.success(`${reg.first_name} ${reg.last_name} freigegeben – Ticket gesendet!`);
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
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link to={createPageUrl("Home")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Alle Events
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{event?.name || "Dashboard"}</h1>
          {event?.date && <p className="text-sm text-slate-500 mt-0.5">{new Date(event.date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}{event.location ? ` · ${event.location}` : ""}</p>}
        </div>

        <StatsOverview stats={stats} />

        <RegistrationTable
          registrations={filteredRegistrations}
          onApprove={handleApprove}
          onReject={handleReject}
          onCategoryChange={handleCategoryChange}
          onEdit={handleEdit}
          processingId={processingId}
          filterStatus={filterStatus}
          filterCategory={filterCategory}
          onFilterStatusChange={setFilterStatus}
          onFilterCategoryChange={setFilterCategory}
        />
      </div>
    </div>
  );
}