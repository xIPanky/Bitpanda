import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

function buildStartDate(event_date, event_time) {
  // Parse date string as local date to avoid UTC offset issues
  let base;
  if (event_date) {
    const parts = event_date.split('-'); // "YYYY-MM-DD"
    base = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  } else {
    base = new Date();
  }

  const timeParts = (event_time || '22:00').split(':');
  const hours = parseInt(timeParts[0] || '22');
  const minutes = parseInt(timeParts[1] || '0');
  base.setHours(hours, minutes, 0, 0);
  return base;
}

function toICSDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function generateICSFile(event_id, event_name, event_date, event_time, event_location) {
  const startDate = buildStartDate(event_date, event_time);
  const endDate = new Date(startDate.getTime() + 5 * 3600000);

  const dtStart = toICSDate(startDate);
  const dtEnd = toICSDate(endDate);
  const dtstamp = toICSDate(new Date());

  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Synergy//Event Calendar//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nBEGIN:VEVENT\r\nUID:${event_id || 'event'}-${Date.now()}@synergy.local\r\nDTSTAMP:${dtstamp}\r\nDTSTART:${dtStart}\r\nDTEND:${dtEnd}\r\nSUMMARY:${event_name}\r\nDESCRIPTION:Deine Registrierung ist eingegangen. Status: In Prüfung\r\nLOCATION:${event_location || 'TBA'}\r\nSTATUS:CONFIRMED\r\nEND:VEVENT\r\nEND:VCALENDAR`;
}

Deno.serve(async (req) => {
  try {
    const { email, first_name, event_id, event_name, event_date, event_time, event_location } = await req.json();

    if (!email || !first_name || !event_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const eventDateFormatted = event_date
      ? (() => {
          const parts = event_date.split('-');
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
            .toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
        })()
      : '';

    const eventTimeStr = event_time ? ` · ${event_time} Uhr` : '';

    const icsContent = generateICSFile(event_id, event_name, event_date, event_time, event_location);

    // Build Google Calendar link separately
    const startDate = buildStartDate(event_date, event_time);
    const endDate = new Date(startDate.getTime() + 5 * 3600000);
    const gcalDates = `${toICSDate(startDate)}/${toICSDate(endDate)}`;
    const gcalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event_name)}&dates=${gcalDates}&location=${encodeURIComponent(event_location || '')}&details=${encodeURIComponent('Registrierungs-Status: In Prüfung')}`;

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#070707;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070707;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#beff00;height:4px;font-size:0;">&nbsp;</td></tr>
        
        <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #161616;">
          <p style="margin:0 0 8px;color:#beff00;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">✓ Registrierung eingegangen</p>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.02em;line-height:1.2;">${event_name}</h1>
        </td></tr>
        
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;color:#ffffff;font-size:15px;line-height:1.6;">Hallo ${first_name},</p>
          <p style="margin:0 0 24px;color:#aaaaaa;font-size:14px;line-height:1.7;">
            deine Registrierung für <strong style="color:#beff00;">${event_name}</strong> ist eingegangen und wird von unserem Team geprüft. Du erhältst dein Ticket und weitere Informationen per E-Mail, sobald deine Registrierung genehmigt wurde.
          </p>
        </td></tr>
        
        ${eventDateFormatted ? `
        <tr><td style="padding:0 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px;border-right:1px solid #1e1e1e;width:50%;text-align:left;">
                <p style="margin:0 0 6px;color:#666;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Datum &amp; Uhrzeit</p>
                <p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">${eventDateFormatted}${eventTimeStr}</p>
              </td>
              <td style="padding:20px;text-align:left;">
                <p style="margin:0 0 6px;color:#666;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Ort</p>
                <p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">${event_location || 'TBA'}</p>
              </td>
            </tr>
          </table>
        </td></tr>` : ''}
        
        <tr><td style="padding:0 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1a00;border:1px solid #1a2e00;border-radius:12px;">
            <tr><td style="padding:20px;text-align:center;">
              <p style="margin:0 0 6px;color:#666;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Registrierungs-Status</p>
              <p style="margin:0;color:#beff00;font-weight:700;font-size:16px;">⏳ In Prüfung</p>
              <p style="margin:8px 0 0;color:#888;font-size:12px;">Genehmigung in ca. 24 Stunden</p>
            </td></tr>
          </table>
        </td></tr>
        
        <tr><td style="padding:0 40px 32px;">
          <p style="margin:0 0 12px;color:#666;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Event speichern</p>
          <a href="${gcalUrl}" style="display:inline-block;background:#1a1a1a;color:#beff00;border:1px solid #beff00;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">📅 Google Calendar</a>
          <p style="margin:10px 0 0;color:#666;font-size:12px;">Den Apple-/Outlook-Kalender-Eintrag findest du als Anhang dieser E-Mail.</p>
        </td></tr>
        
        <tr><td style="padding:24px 40px 32px;border-top:1px solid #141414;">
          <p style="margin:0;color:#777;font-size:13px;line-height:1.6;">Wir freuen uns auf dich! Bei Fragen antworte einfach auf diese E-Mail. Das Team von <strong style="color:#beff00;">Synergy</strong></p>
        </td></tr>
        
        <tr><td style="padding:16px 40px;border-top:1px solid #141414;text-align:center;">
          <p style="margin:0;color:#444;font-size:11px;">${event_name} · powered by <strong style="color:#beff00;">Synergy</strong></p>
        </td></tr>
        <tr><td style="background:#beff00;height:4px;font-size:0;">&nbsp;</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Convert ICS to base64 for attachment
    const encoder = new TextEncoder();
    const icsBytes = encoder.encode(icsContent);
    let binary = '';
    for (let i = 0; i < icsBytes.length; i++) binary += String.fromCharCode(icsBytes[i]);
    const icsBase64 = btoa(binary);

    console.log(`EMAIL_SEND_START recipient=${email}`);
    const { error } = await resend.emails.send({
      from: 'Synergy <ticket@eventpass.panke-management.com>',
      to: email,
      subject: `Registrierung für ${event_name} eingegangen`,
      html: emailHtml,
      attachments: [
        {
          filename: `${event_name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
          content: icsBase64,
        },
      ],
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