import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { guestId } = await req.json();
    if (!guestId) {
      return Response.json({ error: 'guestId is required' }, { status: 400 });
    }

    console.log('RESEND STARTED for guestId:', guestId);

    // ── Load guest ──
    const registrations = await base44.asServiceRole.entities.Registration.list();
    const guest = registrations.find(r => r.id === guestId);
    if (!guest) {
      return Response.json({ error: 'Guest not found' }, { status: 404 });
    }
    if (guest.status !== 'approved') {
      return Response.json({ error: 'Guest is not approved yet' }, { status: 400 });
    }

    // ── Validate guest email — ALWAYS use guest.email, never admin ──
    console.log('EMAIL TARGET =', guest.email);
    if (!guest.email || !isValidEmail(guest.email)) {
      return Response.json({ error: 'Guest has no valid email address' }, { status: 400 });
    }
    console.log('GUEST EMAIL FOUND:', guest.email);

    // ── Load ticket ──
    const allTickets = await base44.asServiceRole.entities.Ticket.list();
    const ticket = allTickets.find(t => t.registration_id === guestId);
    if (!ticket) {
      return Response.json({ error: 'No ticket found. Please approve again to regenerate.' }, { status: 404 });
    }

    // ── Load event ──
    const events = await base44.asServiceRole.entities.Event.list();
    const eventData = events.find(e => e.id === guest.event_id);
    const eventName = eventData?.name || 'Event';
    const eventDate = eventData?.date
      ? new Date(eventData.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const eventTime = eventData?.time || '';
    const eventLocation = eventData?.location || '';
    const pdfUrl = ticket.pdf_url || null;

    const emailBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070707;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070707;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:16px;overflow:hidden;">

        <tr><td style="background:#beff00;height:4px;font-size:0;">&nbsp;</td></tr>

        <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #161616;">
          <p style="margin:0 0 8px;color:#beff00;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">TICKET ERNEUT GESENDET</p>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.02em;">${eventName}</h1>
        </td></tr>

        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0 0 12px;color:#cccccc;font-size:15px;line-height:1.6;">Hallo ${guest.first_name},</p>
          <p style="margin:0;color:#888888;font-size:14px;line-height:1.7;">
            hier ist dein Ticket erneut – auf Anfrage nochmals zugesendet.<br>
            Zeige es beim Einlass vor.
          </p>
        </td></tr>

        <tr><td style="padding:24px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 8px;color:#444444;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Ticket-Code</p>
              <p style="margin:0;color:#beff00;font-size:24px;font-weight:700;letter-spacing:6px;font-family:'Courier New',Courier,monospace;">${ticket.ticket_code}</p>
            </td></tr>
          </table>
        </td></tr>

        ${(eventDate || eventLocation) ? `
        <tr><td style="padding:16px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;color:#444444;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Event-Details</p>
              ${eventDate ? `<p style="margin:0 0 6px;color:#888888;font-size:14px;">📅 ${eventDate}${eventTime ? ` · ${eventTime} Uhr` : ''}</p>` : ''}
              ${eventLocation ? `<p style="margin:0;color:#888888;font-size:14px;">📍 ${eventLocation}</p>` : ''}
            </td></tr>
          </table>
        </td></tr>` : ''}

        ${pdfUrl ? `
        <tr><td style="padding:24px 40px 0;text-align:center;">
          <a href="${pdfUrl}" style="display:inline-block;background:#beff00;color:#070707;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
            ↓ Ticket als PDF herunterladen
          </a>
        </td></tr>` : ''}

        <tr><td style="padding:32px 40px 24px;border-top:1px solid #141414;margin-top:32px;">
          <p style="margin:0;color:#2a2a2a;font-size:11px;text-align:center;">${eventName} · powered by Synergy</p>
        </td></tr>

        <tr><td style="background:#beff00;height:4px;font-size:0;">&nbsp;</td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    console.log('EMAIL ATTEMPT (resend) to:', guest.email);
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: guest.email,
      subject: `Dein Ticket (erneut gesendet) – ${eventName}`,
      body: emailBody,
    });
    console.log('EMAIL SENT (resend) to:', guest.email);

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