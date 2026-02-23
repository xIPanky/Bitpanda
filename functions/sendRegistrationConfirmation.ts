import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, first_name, event_id, event_name, event_date, event_time, event_location } = await req.json();

    if (!email || !first_name || !event_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const eventDateFormatted = event_date
      ? new Date(event_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const eventTimeStr = event_time ? `   ·   ${event_time} Uhr` : '';
    const eventLocationStr = event_location ? `   ·   ${event_location}` : '';

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070707;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070707;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#beff00;height:4px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #161616;">
          <p style="margin:0 0 8px;color:#beff00;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">REQUEST RECEIVED</p>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.02em;">${event_name}</h1>
        </td></tr>
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0 0 12px;color:#cccccc;font-size:15px;line-height:1.6;">Hallo ${first_name},</p>
          <p style="margin:0;color:#888888;font-size:14px;line-height:1.7;">
            deine Registrierung für <strong style="color:#fff;">${event_name}</strong> ist eingegangen und wird von unserem Team geprüft.<br/><br/>
            Du erhältst dein Ticket und weitere Informationen per E-Mail.
          </p>
        </td></tr>
        ${eventDateFormatted || eventLocationStr ? `
        <tr><td style="padding:24px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 8px;color:#444444;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Event-Details</p>
              <p style="margin:0;color:#888888;font-size:14px;"><strong style="color:#fff;">${eventDateFormatted}${eventTimeStr}${eventLocationStr}</strong></p>
            </td></tr>
          </table>
        </td></tr>` : ''}
        <tr><td style="padding:24px 40px 0;">
          <div style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;padding:20px 24px;text-align:center;">
            <p style="margin:0 0 8px;color:#444444;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Status</p>
            <p style="margin:0;color:#beff00;font-weight:600;font-size:14px;">In Prüfung</p>
          </div>
        </td></tr>
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0;color:#555555;font-size:13px;line-height:1.6;">Wir freuen uns auf dich! Bei Fragen antworte einfach auf diese E-Mail.</p>
        </td></tr>
        <tr><td style="padding:24px 40px 24px;border-top:1px solid #141414;margin-top:32px;">
          <p style="margin:0;color:#2a2a2a;font-size:11px;text-align:center;">${event_name} · powered by Synergy</p>
        </td></tr>
        <tr><td style="background:#beff00;height:4px;font-size:0;">&nbsp;</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    console.log(`EMAIL_SEND_START recipient=${email}`);
    const { error } = await resend.emails.send({
      from: 'Synergy <ticket@eventpass.panke-management.com>',
      to: email,
      subject: `Registrierung für ${event_name} eingegangen`,
      html: emailHtml,
    });

    if (error) {
      console.error(`EMAIL_SEND_ERROR: ${error.message}`);
      return Response.json({ error: `Email send failed: ${error.message}` }, { status: 500 });
    }

    console.log(`EMAIL_SENT_SUCCESS recipient=${email}`);
    return Response.json({ success: true });

  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});