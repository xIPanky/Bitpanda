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

    // Generate calendar file (ICS format)
    const generateICSFile = () => {
      const startDate = event_date ? new Date(event_date) : new Date();
      const [hours = '22', minutes = '00'] = (event_time || '22:00').split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const dtStart = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const dtEnd = new Date(startDate.getTime() + 5 * 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Synergy//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event_id}-${Date.now()}@synergy.local
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${event_name}
DESCRIPTION:Deine Registrierung ist eingegangen. Status: In Prüfung
LOCATION:${event_location || 'TBA'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
    };

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin:0; padding:0; background:#070707; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; }
    .btn { display:inline-block; padding:12px 24px; margin:6px 6px 6px 0; border-radius:10px; text-decoration:none; font-size:14px; font-weight:600; text-align:center; border:none; cursor:pointer; }
    .btn-primary { background:#beff00; color:#070707; }
    .btn-primary:hover { background:#d4ff4d; }
    .btn-secondary { background:#1a1a1a; color:#beff00; border:1px solid #beff00; }
    .btn-secondary:hover { background:#2a2a2a; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070707;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#beff00;height:4px;font-size:0;">&nbsp;</td></tr>
        
        <!-- Header -->
        <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #161616;">
          <p style="margin:0 0 8px;color:#beff00;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">✓ Registrierung eingegangen</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.02em;line-height:1.2;">${event_name}</h1>
        </td></tr>
        
        <!-- Main Content -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;color:#ffffff;font-size:15px;line-height:1.6;">Hallo ${first_name},</p>
          <p style="margin:0 0 24px;color:#aaaaaa;font-size:14px;line-height:1.7;">
            deine Registrierung für <strong style="color:#beff00;">${event_name}</strong> ist eingegangen und wird von unserem Team geprüft. Du erhältst dein Ticket und weitere Informationen per E-Mail, sobald deine Registrierung genehmigt wurde.
          </p>
        </td></tr>
        
        <!-- Event Details Card -->
        ${eventDateFormatted || eventLocationStr ? `
        <tr><td style="padding:0 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px;border-right:1px solid #1e1e1e;width:50%;text-align:left;">
                <p style="margin:0 0 6px;color:#666;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Datum & Uhrzeit</p>
                <p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">${eventDateFormatted}${eventTimeStr}</p>
              </td>
              <td style="padding:20px;text-align:left;">
                <p style="margin:0 0 6px;color:#666;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Ort</p>
                <p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">${event_location || 'TBA'}</p>
              </td>
            </tr>
          </table>
        </td></tr>` : ''}
        
        <!-- Status Card -->
        <tr><td style="padding:0 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1a00;border:1px solid #1a2e00;border-radius:12px;">
            <tr><td style="padding:20px;text-align:center;">
              <p style="margin:0 0 6px;color:#666;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Registrierungs-Status</p>
              <p style="margin:0;color:#beff00;font-weight:700;font-size:16px;">⏳ In Prüfung</p>
              <p style="margin:8px 0 0;color:#888;font-size:12px;">Genehmigung in ca. 24 Stunden</p>
            </td></tr>
          </table>
        </td></tr>
        
        <!-- Calendar & Wallet Actions -->
        <tr><td style="padding:24px 40px;">
          <p style="margin:0 0 12px;color:#666;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Event speichern</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="left">
                <a href="webcal://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event_name)}&dates=${new Date(event_date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(new Date(event_date).getTime() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z&location=${encodeURIComponent(event_location || '')}&details=${encodeURIComponent('Registrierungs-Status: In Prüfung')}" class="btn btn-secondary" style="display:inline-block;">📅 Google Calendar</a>
              </td>
            </tr>
            <tr>
              <td align="left" style="padding-top:8px;">
                <a href="data:text/calendar;base64,${btoa(generateICSFile()).replace(/(.{64})/g, '$1\n')}" download="${event_name}.ics" class="btn btn-secondary" style="display:inline-block;">📱 Apple Calendar</a>
              </td>
            </tr>
          </table>
        </td></tr>
        
        <!-- Footer Message -->
        <tr><td style="padding:24px 40px 32px;">
          <p style="margin:0;color:#777;font-size:13px;line-height:1.6;">Wir freuen uns auf dich! Bei Fragen antworte einfach auf diese E-Mail. Das Team von <strong style="color:#beff00;">Synergy</strong></p>
        </td></tr>
        
        <!-- Bottom Bar -->
        <tr><td style="padding:16px 40px;border-top:1px solid #141414;text-align:center;">
          <p style="margin:0;color:#444;font-size:11px;">${event_name} · powered by <strong style="color:#beff00;">Synergy</strong></p>
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