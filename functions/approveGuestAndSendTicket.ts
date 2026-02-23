import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only check
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { guestId } = await req.json();
    if (!guestId) {
      return Response.json({ error: 'guestId is required' }, { status: 400 });
    }

    // STEP 1: Fetch guest
    console.log('APPROVAL STARTED for guestId:', guestId);
    const registrations = await base44.asServiceRole.entities.Registration.list();
    const guest = registrations.find(r => r.id === guestId);

    if (!guest) {
      return Response.json({ error: 'Guest not found' }, { status: 404 });
    }

    // STEP 2: Update guest status to approved
    await base44.asServiceRole.entities.Registration.update(guestId, { status: 'approved' });

    // STEP 3: Find or create ticket
    const allTickets = await base44.asServiceRole.entities.Ticket.list();
    let ticket = allTickets.find(t => t.registration_id === guestId);

    if (!ticket) {
      const firstName = guest.first_name || '';
      const lastName = guest.last_name || '';
      const ticketCode = `${firstName[0]?.toUpperCase() || 'X'}${lastName[0]?.toUpperCase() || 'X'}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      ticket = await base44.asServiceRole.entities.Ticket.create({
        event_id: guest.event_id,
        registration_id: guestId,
        ticket_tier_id: guest.ticket_tier_id || '',
        ticket_code: ticketCode,
        guest_name: `${firstName} ${lastName}`.trim(),
        guest_email: guest.email,
        category: guest.category || 'Standard',
        status: 'valid',
        email_sent: false,
      });
    }

    console.log('TICKET CREATED:', ticket.ticket_code);

    // STEP 4: Fetch event details for email
    const events = await base44.asServiceRole.entities.Event.list();
    const eventData = events.find(e => e.id === guest.event_id);
    const eventName = eventData?.name || 'Event';
    const eventDate = eventData?.date ? new Date(eventData.date).toLocaleDateString('de-DE') : '';
    const eventTime = eventData?.time || '';
    const eventLocation = eventData?.location || '';

    // STEP 5: Send email
    const emailBody = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;">
      <div style="background:#0f172a;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h1 style="color:#f59e0b;margin:0;font-size:20px;letter-spacing:1px;">TICKET BESTÄTIGT</h1>
      </div>

      <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${guest.first_name},</p>
      <p style="color:#334155;font-size:16px;line-height:1.6;">
        deine Registrierung wurde geprüft und freigegeben.<br/>
        Dein Ticket findest du unten.
      </p>

      <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #e2e8f0;">
        <h2 style="font-size:14px;color:#64748b;margin-top:0;text-transform:uppercase;letter-spacing:1px;">Veranstaltung</h2>
        <p style="font-size:18px;font-weight:700;color:#0f172a;margin:4px 0;">${eventName}</p>
        ${eventDate ? `<p style="color:#64748b;margin:4px 0;">📅 ${eventDate}${eventTime ? ` um ${eventTime}` : ''}</p>` : ''}
        ${eventLocation ? `<p style="color:#64748b;margin:4px 0;">📍 ${eventLocation}</p>` : ''}
      </div>

      <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin:24px 0;text-align:center;border:2px solid #bbf7d0;">
        <p style="font-size:12px;color:#16a34a;text-transform:uppercase;letter-spacing:2px;margin-top:0;">Dein Ticket-Code</p>
        <p style="font-size:36px;font-weight:700;color:#0f172a;letter-spacing:4px;font-family:monospace;margin:8px 0;">${ticket.ticket_code}</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ticket.ticket_code}" 
             alt="QR Code" style="margin-top:16px;border-radius:8px;" width="180" height="180" />
      </div>

      <p style="color:#64748b;font-size:14px;">Zeige diesen Code oder QR-Code beim Einlass vor.</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:32px;">Wir freuen uns auf dich!<br/>Dein Event-Team</p>
    </div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: guest.email,
      subject: `Dein Ticket wurde bestätigt – ${eventName}`,
      body: emailBody,
    });

    console.log('EMAIL SENT to:', guest.email);

    // STEP 6: Mark ticket email as sent
    await base44.asServiceRole.entities.Ticket.update(ticket.id, { email_sent: true });

    return Response.json({
      success: true,
      ticketCode: ticket.ticket_code,
      emailSentTo: guest.email,
    });

  } catch (error) {
    console.error('APPROVAL ERROR:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});