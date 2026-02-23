import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { guestId } = await req.json();
    if (!guestId) return Response.json({ error: 'guestId is required' }, { status: 400 });

    console.log(`RESEND_START guestId=${guestId}`);

    // ── Load guest ──────────────────────────────────────────────────────────
    const registrations = await base44.asServiceRole.entities.Registration.filter({ id: guestId });
    const guest = registrations?.[0];
    if (!guest) return Response.json({ error: 'GUEST_NOT_FOUND' }, { status: 404 });

    if (!guest.email || !isValidEmail(guest.email)) {
      return Response.json({ error: 'MISSING_GUEST_EMAIL' }, { status: 400 });
    }
    console.log(`EMAIL_RECIPIENT=${guest.email}`);

    // ── Load ticket ─────────────────────────────────────────────────────────
    const allTickets = await base44.asServiceRole.entities.Ticket.filter({ registration_id: guestId });
    const ticket = allTickets?.[0];
    if (!ticket) return Response.json({ error: 'NO_TICKET_FOUND' }, { status: 404 });

    // Hard validate PDF is ready
    if (ticket.generation_status !== 'ready' || !ticket.pdf_url) {
      return Response.json({ error: 'NO_TICKET_READY', detail: `generation_status=${ticket.generation_status} pdf_url=${ticket.pdf_url || 'null'}` }, { status: 400 });
    }

    // ── Load event ──────────────────────────────────────────────────────────
    const events = await base44.asServiceRole.entities.Event.filter({ id: guest.event_id });
    const eventData = events?.[0] || null;
    const eventName = eventData?.name || 'Event';
    const eventDate = eventData?.date
      ? new Date(eventData.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const eventTime = eventData?.time || '';
    const eventLocation = eventData?.location || '';
    const pdfUrl = ticket.pdf_url;

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
        <tr><td style="padding:24px 40px 0;text-align:center;">
          <a href="${pdfUrl}" style="display:inline-block;background:#beff00;color:#070707;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
            ↓ Ticket als PDF herunterladen
          </a>
        </td></tr>
        <tr><td style="padding:24px 40px 24px;border-top:1px solid #141414;margin-top:24px;">
          <p style="margin:0;color:#2a2a2a;font-size:11px;text-align:center;">${eventName} · powered by Synergy</p>
        </td></tr>
        <tr><td style="background:#beff00;height:4px;font-size:0;">&nbsp;</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Fetch PDF as attachment
    console.log(`PDF_FETCH_START url=${pdfUrl}`);
    let pdfBuffer = null;
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
      console.log(`PDF_FETCH_SUCCESS size=${pdfBuffer.length} bytes`);
      
      if (pdfBuffer.length === 0) {
        throw new Error('PDF_EMPTY');
      }
    } catch (fetchErr) {
      console.error(`PDF_FETCH_ERROR: ${fetchErr.message}`);
      return Response.json({ error: `PDF_FETCH_FAILED: ${fetchErr.message}` }, { status: 500 });
    }

    // Send with 2 retries
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await sleep(1000);
      try {
        console.log(`EMAIL_SEND_START recipient=${guest.email} attempt=${attempt + 1}`);
        const { error: resendError } = await resend.emails.send({
          from: 'Synergy <ticket@eventpass.panke-management.com>',
          to: guest.email,
          subject: `Dein Ticket (erneut gesendet) – ${eventName}`,
          html: emailBody,
          attachments: [
            {
              filename: `ticket-${ticket.ticket_code}.pdf`,
              content: pdfBuffer,
            },
          ],
        });
        if (resendError) throw new Error(resendError.message || JSON.stringify(resendError));
        console.log(`EMAIL_SENT_SUCCESS recipient=${guest.email} with_attachment=true`);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        console.error(`EMAIL_FAILED attempt=${attempt + 1} error=${err.message}`);
      }
    }

    if (lastErr) {
      await base44.asServiceRole.entities.Registration.update(guestId, {
        email_sent: false,
        last_email_error: lastErr.message,
      });
      return Response.json({ error: `EMAIL_SEND_FAILED: ${lastErr.message}` }, { status: 500 });
    }

    await base44.asServiceRole.entities.Ticket.update(ticket.id, { email_sent: true });
    await base44.asServiceRole.entities.Registration.update(guestId, {
      email_sent: true,
      last_email_error: null,
    });

    return Response.json({
      success: true,
      ticketCode: ticket.ticket_code,
      emailSentTo: guest.email,
    });

  } catch (error) {
    console.error(`ERROR step=unhandled error=${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});