import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { guestId } = await req.json();
    if (!guestId) {
      return Response.json({ error: 'guestId is required' }, { status: 400 });
    }

    console.log('RESEND STARTED for guestId:', guestId);

    // Fetch guest
    const registrations = await base44.asServiceRole.entities.Registration.list();
    const guest = registrations.find(r => r.id === guestId);
    if (!guest) {
      return Response.json({ error: 'Guest not found' }, { status: 404 });
    }

    if (guest.status !== 'approved') {
      return Response.json({ error: 'Guest is not approved' }, { status: 400 });
    }

    // Find existing ticket
    const allTickets = await base44.asServiceRole.entities.Ticket.list();
    const ticket = allTickets.find(t => t.registration_id === guestId);
    if (!ticket) {
      return Response.json({ error: 'No ticket found for this guest. Please approve again.' }, { status: 404 });
    }

    // Fetch event
    const events = await base44.asServiceRole.entities.Event.list();
    const eventData = events.find(e => e.id === guest.event_id);
    const eventName = eventData?.name || 'Event';
    const eventDate = eventData?.date
      ? new Date(eventData.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const eventTime = eventData?.time || '';
    const eventLocation = eventData?.location || '';

    const emailBody = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#070707;color:#ffffff;">

      <div style="text-align:center;padding:32px 0;border-bottom:1px solid #1a1a1a;margin-bottom:32px;">
        <p style="color:#beff00;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">TICKET RESENT</p>
        <h1 style="font-size:28px;font-weight:800;color:#fff;margin:0;letter-spacing:-0.02em;">${eventName}</h1>
      </div>

      <p style="color:#888;line-height:1.7;font-size:15px;">Hallo ${guest.first_name},</p>
      <p style="color:#888;line-height:1.7;font-size:15px;">
        hier ist dein Ticket nochmals – auf Anfrage erneut zugesendet.
      </p>

      <div style="background:#0d1a00;border:1px solid #1a2e00;border-radius:16px;padding:32px 24px;margin:28px 0;text-align:center;">
        <p style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Dein Ticket-Code</p>
        <p style="font-size:36px;font-weight:700;color:#beff00;letter-spacing:4px;font-family:monospace;margin:0 0 20px;">${ticket.ticket_code}</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ticket.ticket_code}&bgcolor=0d1a00&color=beff00"
             alt="QR Code" style="border-radius:8px;" width="160" height="160" />
      </div>

      ${(eventDate || eventLocation) ? `
      <div style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;padding:20px 24px;margin:24px 0;">
        <p style="font-size:10px;color:#444;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Event-Details</p>
        ${eventDate ? `<p style="color:#888;font-size:14px;margin:4px 0;">📅 ${eventDate}${eventTime ? ` · ${eventTime} Uhr` : ''}</p>` : ''}
        ${eventLocation ? `<p style="color:#888;font-size:14px;margin:4px 0;">📍 ${eventLocation}</p>` : ''}
      </div>` : ''}

      <p style="color:#555;font-size:13px;line-height:1.6;margin-top:28px;">
        Zeige diesen Code oder QR-Code beim Einlass vor.
      </p>

      <p style="color:#2a2a2a;font-size:11px;margin-top:40px;border-top:1px solid #141414;padding-top:20px;text-align:center;">
        ${eventName} · powered by Synergy
      </p>
    </div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: guest.email,
      subject: `Dein Ticket (erneut gesendet) – ${eventName}`,
      body: emailBody,
    });

    console.log('RESEND EMAIL SENT to:', guest.email);

    // Update email_sent flag
    await base44.asServiceRole.entities.Ticket.update(ticket.id, { email_sent: true });

    return Response.json({
      success: true,
      ticketCode: ticket.ticket_code,
      emailSentTo: guest.email,
    });

  } catch (error) {
    console.error('RESEND ERROR:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});