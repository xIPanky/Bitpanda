import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import StatsOverview from "../components/admin/StatsOverview";
import RegistrationTable from "../components/admin/RegistrationTable";

// 3 random letters repeated for fast scanning recognition
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

  const { data: registrations } = useQuery({
    queryKey: ["registrations"],
    queryFn: () => base44.entities.Registration.list("-created_date"),
    initialData: [],
  });

  const { data: tickets } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.Ticket.list(),
    initialData: [],
  });

  const { data: eventSettingsArr } = useQuery({
    queryKey: ["eventSettings"],
    queryFn: () => base44.entities.EventSettings.list(),
    initialData: [],
  });
  const eventSettings = eventSettingsArr?.[0];

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
    queryClient.invalidateQueries({ queryKey: ["registrations"] });
  };

  const handleApprove = async (reg) => {
    setProcessingId(reg.id);
    const ticketCode = generateTicketCode();
    const me = await base44.auth.me();

    await base44.entities.Registration.update(reg.id, { status: "approved", approved_by: me?.email || "Admin" });

    await base44.entities.Ticket.create({
      registration_id: reg.id,
      ticket_code: ticketCode,
      guest_name: `${reg.first_name} ${reg.last_name}`,
      guest_email: reg.email,
      category: reg.category || "Standard",
      status: "valid",
      email_sent: false,
    });

    // Send ticket email
    const ticketUrl = `${window.location.origin}/ticket?code=${ticketCode}`;
    await base44.integrations.Core.SendEmail({
      to: reg.email,
      subject: `Ihr Ticket: ${eventSettings?.event_name || "Veranstaltung"}`,
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h1 style="font-size: 24px; color: #0f172a;">Ihre Registrierung wurde freigegeben!</h1>
          <p style="color: #64748b; line-height: 1.6;">
            Hallo ${reg.first_name},<br/><br/>
            Ihre Anmeldung für <strong>${eventSettings?.event_name || "die Veranstaltung"}</strong> wurde bestätigt.
          </p>
          <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="font-size: 14px; color: #94a3b8; margin-bottom: 8px;">Ihr Ticket-Code</p>
            <p style="font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 2px;">${ticketCode}</p>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 8px;">Kategorie: ${reg.category || "Standard"}</p>
          </div>
          <p style="color: #64748b; line-height: 1.6;">
            Zeigen Sie Ihren Ticket-Code oder den QR-Code am Eingang vor.<br/>
            <a href="${ticketUrl}" style="color: #d97706; text-decoration: none; font-weight: 600;">Ticket online ansehen →</a>
          </p>
          ${eventSettings?.event_date ? `<p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">📅 ${new Date(eventSettings.event_date).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}${eventSettings.event_time ? ` um ${eventSettings.event_time} Uhr` : ""}${eventSettings.event_location ? ` · 📍 ${eventSettings.event_location}` : ""}</p>` : ""}
        </div>
      `,
    });

    const createdTickets = await base44.entities.Ticket.filter({ ticket_code: ticketCode });
    if (createdTickets.length > 0) {
      await base44.entities.Ticket.update(createdTickets[0].id, { email_sent: true });
    }

    queryClient.invalidateQueries({ queryKey: ["registrations"] });
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    toast.success(`${reg.first_name} ${reg.last_name} freigegeben – Ticket gesendet!`);
    setProcessingId(null);
  };

  const handleReject = async (regId) => {
    setProcessingId(regId);
    await base44.entities.Registration.update(regId, { status: "rejected" });
    queryClient.invalidateQueries({ queryKey: ["registrations"] });
    toast.success("Registrierung abgelehnt");
    setProcessingId(null);
  };

  const handleCategoryChange = async (regId, category) => {
    await base44.entities.Registration.update(regId, { category });
    queryClient.invalidateQueries({ queryKey: ["registrations"] });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Verwalten Sie Ihre Gästeregistrierungen und Tickets
          </p>
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