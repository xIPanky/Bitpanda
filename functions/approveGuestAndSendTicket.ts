import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';
import { Resend } from 'npm:resend@4.0.0';

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateTicketCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const pick = () => letters.charAt(Math.floor(Math.random() * letters.length));
  return `${pick()}${pick()}${pick()}-${Math.floor(100 + Math.random() * 900)}`;
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── PDF Generation ────────────────────────────────────────────────────────────

async function buildPdfFile(guest, ticket, eventData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const NEON  = [190, 255, 0];
  const BLACK = [7, 7, 7];
  const WHITE = [255, 255, 255];
  const GRAY  = [90, 90, 90];
  const DARK  = [17, 17, 17];
  const DARKGREEN = [13, 26, 0];
  const W = 210;
  const H = 297;

  // Background
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, W, H, 'F');

  // Top neon bar
  doc.setFillColor(...NEON);
  doc.rect(0, 0, W, 4, 'F');

  // Event name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...WHITE);
  doc.text((eventData?.name || 'EVENT').toUpperCase(), W / 2, 36, { align: 'center' });

  // Subtitle
  doc.setFontSize(9);
  doc.setTextColor(...NEON);
  doc.text('OFFICIAL TICKET  ·  INVITE ONLY', W / 2, 46, { align: 'center' });

  // Divider
  doc.setDrawColor(...NEON);
  doc.setLineWidth(0.3);
  doc.line(20, 52, W - 20, 52);

  // Guest name
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text((ticket.guest_name || '').toUpperCase(), W / 2, 68, { align: 'center' });

  // Category badge
  const cat = (ticket.category || 'Standard').toUpperCase();
  doc.setFontSize(7.5);
  const catW = doc.getTextWidth(cat) + 14;
  doc.setFillColor(...NEON);
  doc.roundedRect((W - catW) / 2, 73, catW, 8, 2, 2, 'F');
  doc.setTextColor(...BLACK);
  doc.text(cat, W / 2, 79, { align: 'center' });

  // Event details card
  doc.setFillColor(...DARK);
  doc.roundedRect(20, 90, W - 40, 44, 4, 4, 'F');

  let detailY = 103;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  if (eventData?.date) {
    const d = new Date(eventData.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setTextColor(...GRAY);
    doc.text('DATUM', 30, detailY - 5);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(d + (eventData.time ? `   ·   ${eventData.time} Uhr` : ''), 30, detailY + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    detailY += 16;
  }
  if (eventData?.location) {
    doc.setTextColor(...GRAY);
    doc.text('ORT', 30, detailY - 5);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(eventData.location, 30, detailY + 3);
  }

  // Ticket code + QR card
  doc.setFillColor(...DARKGREEN);
  doc.roundedRect(20, 144, W - 40, 80, 4, 4, 'F');
  doc.setDrawColor(...NEON);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, 144, W - 40, 80, 4, 4, 'S');

  // "TICKET CODE" label
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('TICKET CODE', W / 2, 156, { align: 'center' });

  // Code value
  doc.setFontSize(24);
  doc.setTextColor(...NEON);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.ticket_code || '', W / 2, 168, { align: 'center' });

  // QR code (hosted service, neon on dark)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticket.ticket_code)}&bgcolor=0d1a00&color=beff00&format=png&margin=2`;
  try {
    const qrResp = await fetch(qrUrl);
    if (qrResp.ok) {
      const qrBuf = await qrResp.arrayBuffer();
      const qrArr = new Uint8Array(qrBuf);
      let binary = '';
      for (let i = 0; i < qrArr.length; i++) binary += String.fromCharCode(qrArr[i]);
      const qrBase64 = btoa(binary);
      doc.addImage(`data:image/png;base64,${qrBase64}`, 'PNG', W / 2 - 22, 174, 44, 44);
    }
  } catch (_e) {
    // QR fetch failed — skip, ticket still valid
  }

  // "SCAN FOR ENTRY" label
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('SCAN FOR ENTRY', W / 2, 225, { align: 'center' });

  // Divider
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.3);
  doc.line(20, 236, W - 20, 236);

  // Footer disclaimer
  doc.setFontSize(7.5);
  doc.setTextColor(55, 55, 55);
  doc.text('Dieses Ticket ist nicht übertragbar und nur mit gültigem Lichtbildausweis gültig.', W / 2, 245, { align: 'center' });
  doc.setFontSize(7);
  doc.text(`${eventData?.name || 'SYNERGY'} · powered by Synergy Guestlist Platform`, W / 2, 252, { align: 'center' });

  // Bottom neon bar
  doc.setFillColor(...NEON);
  doc.rect(0, H - 4, W, 4, 'F');

  // Convert to File
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1];
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

  const filename = `ticket-${ticket.ticket_code}.pdf`;
  const file = new File([bytes], filename, { type: 'application/pdf' });
  return { file, filename, bytes: bytes.length };
}

// ── Upload with retries ───────────────────────────────────────────────────────

async function uploadWithRetry(base44, file, maxAttempts = 3) {
  const delays = [0, 500, 1200];
  let lastError = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(delays[attempt]);
    try {
      console.log(`UPLOAD_ATTEMPT attempt=${attempt + 1} filename=${file.name}`);
      const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      const url = result?.file_url || null;
      if (!url) throw new Error('UploadFile returned no file_url');
      return url;
    } catch (err) {
      lastError = err;
      console.error(`UPLOAD_FAILED attempt=${attempt + 1} error=${err.message}`);
    }
  }
  throw new Error(`PDF_UPLOAD_FAILED after ${maxAttempts} attempts: ${lastError?.message}`);
}

// ── Email with retry (Resend) — v2 ───────────────────────────────────────────

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

async function sendEmailWithRetry(_base44, to, subject, body, pdfUrl, ticketCode, icsContent, maxAttempts = 2) {
  const delays = [0, 1000];
  let lastError = null;
  let attachments = [];
  let attachmentStatus = 'NONE';

  console.log(`EMAIL_START recipient=${to}`);

  // STEP 1: Try to load and attach PDF (non-fatal if fails)
  console.log(`PDF_FOUND url=${pdfUrl ? 'yes' : 'no'}`);
  if (pdfUrl) {
    try {
      console.log(`PDF_FETCH_START url=${pdfUrl}`);
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) throw new Error('PDF_EMPTY');
      
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfBase64 = btoa(String.fromCharCode.apply(null, uint8Array));
      
      console.log(`PDF_FETCH_SUCCESS size=${arrayBuffer.byteLength} bytes`);
      
      attachments.push({
        filename: `SYNERGY-Ticket.pdf`,
        content: pdfBase64,
      });
      attachmentStatus = 'PDF_READY';
    } catch (fetchErr) {
      console.error(`ATTACHMENT_FAILED type=PDF error=${fetchErr.message}`);
      attachmentStatus = 'PDF_FAILED';
    }
  }

  // STEP 2: Try to add ICS calendar file (non-fatal if fails)
  if (icsContent) {
    try {
      const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));
      attachments.push({
        filename: `event.ics`,
        content: icsBase64,
      });
      console.log(`ATTACHMENT_READY type=ICS`);
    } catch (icsErr) {
      console.error(`ATTACHMENT_FAILED type=ICS error=${icsErr.message}`);
    }
  }

  // STEP 3: Send email (WITH or WITHOUT attachments)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(delays[attempt]);
    try {
      console.log(`EMAIL_SEND_START recipient=${to} attempt=${attempt + 1} attachments=${attachments.length}`);
      
      const sendPayload = {
        from: 'Synergy <ticket@eventpass.panke-management.com>',
        to,
        subject,
        html: body,
      };

      if (attachments.length > 0) {
        sendPayload.attachments = attachments;
      }

      const { error } = await resend.emails.send(sendPayload);
      if (error) throw new Error(error.message || JSON.stringify(error));
      
      console.log(`EMAIL_SEND_SUCCESS recipient=${to} attachments=${attachments.length} status=${attachmentStatus}`);
      return;
    } catch (err) {
      lastError = err;
      console.error(`EMAIL_SEND_ERROR attempt=${attempt + 1} error=${err.message}`);
    }
  }

  // STEP 4: Fallback to basic email if all else fails
  console.log(`EMAIL_FALLBACK_START recipient=${to}`);
  try {
    const { error } = await resend.emails.send({
      from: 'Synergy <ticket@eventpass.panke-management.com>',
      to,
      subject: 'Dein Ticket ist bestätigt',
      html: `<p>Hallo,</p><p>Dein Ticket wurde bestätigt. Falls der Anhang in der vorherigen Email fehlt, nutze bitte den Download-Link im System.</p>`,
    });
    if (error) throw new Error(error.message || JSON.stringify(error));
    console.log(`EMAIL_FALLBACK_SUCCESS recipient=${to}`);
    return;
  } catch (fallbackErr) {
    console.error(`EMAIL_FALLBACK_FAILED error=${fallbackErr.message}`);
    throw new Error(`EMAIL_SEND_FAILED: ${lastError?.message || fallbackErr.message}`);
  }
}

// ── ICS Calendar File Generation ─────────────────────────────────────────

// ── ICS Calendar File Generation (FIXED & STABLE) ─────────────────────────

function generateICSFile(eventData) {
  const eventName = eventData?.name || 'Event';
  const eventDateRaw = eventData?.date;
  const eventTime = eventData?.time || '09:00';
  const eventLocation = eventData?.location || '';

  if (!eventDateRaw) return null;

  // ── SAFE DATE PARSING ───────────────────────────────────────────
  const baseDate = new Date(eventDateRaw);
  if (isNaN(baseDate.getTime())) {
    console.error('ICS_ERROR: Invalid event date', eventDateRaw);
    return null;
  }

  // Parse time safely
  const [hours, minutes] = eventTime.split(':').map(n => Number(n));

  baseDate.setHours(hours || 0);
  baseDate.setMinutes(minutes || 0);
  baseDate.setSeconds(0);
  baseDate.setMilliseconds(0);

  const startDate = new Date(baseDate);

  // Default duration = 2 hours
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  // ── FORMAT WITHOUT UTC SHIFT (NO "Z") ───────────────────────────
  const pad = (n) => String(n).padStart(2, '0');

  const formatDateTime = (date) => {
    return (
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      'T' +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  };

  const uid = `${eventName.replace(/\s+/g, '-')}-${Date.now()}@synergy.event`;

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SYNERGY//Event Calendar//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDateTime(new Date())}
DTSTART:${formatDateTime(startDate)}
DTEND:${formatDateTime(endDate)}
SUMMARY:${eventName}
LOCATION:${eventLocation}
DESCRIPTION:Du bist dabei – wir sehen uns auf einem unvergesslichen Event!
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  return ics;
}

// ── Email template (Premium design) ───────────────────────────────────────

function buildApprovalEmail(guest, eventData) {
  const eventName = eventData?.name || 'Event';
  const eventDate = eventData?.date
    ? new Date(eventData.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const eventTime = eventData?.time || '';
  const eventLocation = eventData?.location || '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#070707;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070707;padding:20px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:20px;overflow:hidden;">
        
        <!-- Header Neon Bar -->
        <tr><td style="background:#beff00;height:6px;font-size:0;">&nbsp;</td></tr>
        
        <!-- Hero Section -->
        <tr><td style="padding:48px 40px 32px;text-align:center;border-bottom:1px solid #161616;">
          <p style="margin:0 0 12px;color:#beff00;font-size:11px;font-weight:800;letter-spacing:5px;text-transform:uppercase;">Du bist dabei</p>
          <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:900;letter-spacing:-0.02em;line-height:1.2;">${eventName}</h1>
          <p style="margin:12px 0 0;color:#888;font-size:14px;">Deine Anmeldung wurde bestätigt</p>
        </td></tr>
        
        <!-- Main Copy -->
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0 0 4px;color:#cccccc;font-size:16px;line-height:1.6;">Hallo ${guest.first_name},</p>
          <p style="margin:8px 0 0;color:#999999;font-size:14px;line-height:1.8;">
            deine Registrierung wurde geprüft und freigegeben. Mach dich bereit für eine Nacht voller Energie, Musik und besonderer Momente. Dein Ticket befindet sich im Anhang dieser E-Mail.
          </p>
        </td></tr>
        
        <!-- Event Details Card -->
        ${eventDate || eventLocation ? `
        <tr><td style="padding:28px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;border-radius:14px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 16px;color:#666;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:3px;">Event-Details</p>
              ${eventDate ? `<p style="margin:0 0 8px;color:#fff;font-size:15px;font-weight:600;">📅 ${eventDate}${eventTime ? ` · ${eventTime} Uhr` : ''}</p>` : ''}
              ${eventLocation ? `<p style="margin:0;color:#fff;font-size:15px;font-weight:600;">📍 ${eventLocation}</p>` : ''}
            </td></tr>
          </table>
        </td></tr>` : ''}
        
        <!-- Action Buttons -->
        <tr><td style="padding:32px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:33.33%;padding:0 6px 12px 0;">
                <a href="#" style="display:block;background:#1a1a1a;border:1px solid #2a2a2a;color:#beff00;text-decoration:none;padding:16px 12px;border-radius:10px;text-align:center;font-weight:700;font-size:12px;line-height:1.4;text-transform:uppercase;letter-spacing:1px;">
                  📅<br>Kalender
                </a>
              </td>
              <td style="width:33.33%;padding:0 6px 12px 6px;">
                <a href="#" style="display:block;background:#1a1a1a;border:1px solid #2a2a2a;color:#beff00;text-decoration:none;padding:16px 12px;border-radius:10px;text-align:center;font-weight:700;font-size:12px;line-height:1.4;text-transform:uppercase;letter-spacing:1px;">
                  📱<br>Wallet
                </a>
              </td>
              <td style="width:33.33%;padding:0 0 12px 6px;">
                <a href="#" style="display:block;background:#beff00;border:1px solid #beff00;color:#070707;text-decoration:none;padding:16px 12px;border-radius:10px;text-align:center;font-weight:800;font-size:12px;line-height:1.4;text-transform:uppercase;letter-spacing:1px;">
                  🎟️<br>Ticket
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
        
        <!-- Footer Message -->
        <tr><td style="padding:28px 40px;text-align:center;border-top:1px solid #141414;margin-top:8px;">
          <p style="margin:0;color:#666;font-size:12px;line-height:1.6;">
            Fragen? Antworte einfach auf diese E-Mail.<br>
            <span style="color:#444;font-size:11px;">powered by Synergy</span>
          </p>
        </td></tr>
        
        <!-- Footer Neon Bar -->
        <tr><td style="background:#beff00;height:6px;font-size:0;">&nbsp;</td></tr>
        
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { guestId } = await req.json();
    if (!guestId) return Response.json({ error: 'guestId is required' }, { status: 400 });

    // ── STEP 1: Load guest ──────────────────────────────────────────────────
    console.log(`APPROVE_START guestId=${guestId}`);
    let guest = null;
    try {
      // Try filter first, fall back to full list scan
      const byFilter = await base44.asServiceRole.entities.Registration.filter({ id: guestId });
      guest = byFilter?.[0] || null;
      if (!guest) {
        console.log(`GUEST_FILTER_EMPTY — falling back to list scan`);
        const allRegs = await base44.asServiceRole.entities.Registration.list();
        guest = allRegs.find(r => r.id === guestId) || null;
      }
    } catch (loadErr) {
      console.error(`GUEST_LOAD_ERROR: ${loadErr.message}`);
      const allRegs = await base44.asServiceRole.entities.Registration.list();
      guest = allRegs.find(r => r.id === guestId) || null;
    }
    console.log(`GUEST_LOADED found=${!!guest} id=${guest?.id || 'null'}`);
    if (!guest) return Response.json({ error: 'GUEST_NOT_FOUND' }, { status: 404 });

    if (!guest.email || !isValidEmail(guest.email)) {
      return Response.json({ error: 'MISSING_GUEST_EMAIL' }, { status: 400 });
    }
    console.log(`GUEST_EMAIL guest.email=${guest.email}`);

    // ── STEP 2: Approve ─────────────────────────────────────────────────────
    await base44.asServiceRole.entities.Registration.update(guestId, {
      status: 'approved',
      approved_by: user.email,
      approved_at: new Date().toISOString(),
    });
    console.log(`APPROVED guestId=${guestId}`);

    // ── STEP 3: Ensure single ticket ────────────────────────────────────────
    console.log(`TICKET_LOOKUP_START registration_id=${guestId}`);
    let existingTickets = [];
    try {
      existingTickets = await base44.asServiceRole.entities.Ticket.filter({ registration_id: guestId }) || [];
    } catch (e) {
      console.error(`TICKET_LOOKUP_FILTER_ERROR: ${e.message} — falling back to list scan`);
      const all = await base44.asServiceRole.entities.Ticket.list();
      existingTickets = all.filter(t => t.registration_id === guestId);
    }
    let ticket = existingTickets[0] || null;
    console.log(`TICKET_LOOKUP_DONE existing=${!!ticket} id=${ticket?.id || 'null'}`);

    if (!ticket) {
      let tierName = null, tierPrice = null;
      if (guest.ticket_tier_id) {
        try {
          const tiers = await base44.asServiceRole.entities.TicketTier.filter({ id: guest.ticket_tier_id });
          const tier = tiers?.[0];
          tierName = tier?.name || null;
          tierPrice = tier?.price ?? null;
        } catch (_e) { /* non-fatal */ }
      }

      const code = generateTicketCode();
      const ticketPayload = {
        event_id: guest.event_id,
        registration_id: guestId,
        ticket_tier_id: guest.ticket_tier_id || null,
        ticket_code: code,
        guest_name: `${guest.first_name} ${guest.last_name}`.trim(),
        guest_email: guest.email,
        category: guest.category || 'Standard',
        tier_name: tierName,
        tier_price: tierPrice,
        status: 'valid',
        email_sent: false,
        generation_status: 'creating',
        generated_at: new Date().toISOString(),
      };

      console.log(`ABOUT_TO_CREATE_TICKET code=${code} registration_id=${guestId} event_id=${guest.event_id}`);
      ticket = await base44.asServiceRole.entities.Ticket.create(ticketPayload);
      console.log(`TICKET_CREATED_SUCCESSFULLY ticketId=${ticket?.id} code=${ticket?.ticket_code}`);

      if (!ticket?.id) {
        console.error(`TICKET_CREATION_FAILED — create() returned no id`);
        return Response.json({ error: 'TICKET_CREATION_FAILED' }, { status: 500 });
      }

      // Verify by reloading
      let verified = null;
      try {
        const verifyList = await base44.asServiceRole.entities.Ticket.filter({ registration_id: guestId });
        verified = verifyList?.[0] || null;
      } catch (_e) {
        const all = await base44.asServiceRole.entities.Ticket.list();
        verified = all.find(t => t.registration_id === guestId) || null;
      }
      if (!verified?.id) {
        console.error(`TICKET_VERIFICATION_FAILED — not found after create`);
        return Response.json({ error: 'TICKET_CREATION_FAILED_VERIFY' }, { status: 500 });
      }
      ticket = verified;
      console.log(`TICKET_VERIFIED ticketId=${ticket.id}`);

      // Link ticket to registration
      await base44.asServiceRole.entities.Registration.update(guestId, { ticket_id: ticket.id });
      console.log(`TICKET_ID_SAVED_TO_GUEST ticket_id=${ticket.id} guestId=${guestId}`);
    } else {
      console.log(`TICKET_EXISTS ticketId=${ticket.id} code=${ticket.ticket_code} — reusing`);
    }

    // ── STEP 4: Reuse PDF if already ready, else (re)generate ───────────────
    let pdfUrl = null;

    if (ticket.generation_status === 'ready' && ticket.pdf_url) {
      pdfUrl = ticket.pdf_url;
      console.log(`PDF_REUSE pdf_url=${pdfUrl}`);
    } else {
      // (Re)generate PDF
      const events = await base44.asServiceRole.entities.Event.filter({ id: guest.event_id });
      const eventData = events?.[0] || null;

      console.log(`PDF_CREATE_START ticket_code=${ticket.ticket_code}`);
      const { file, filename, bytes } = await buildPdfFile(guest, ticket, eventData);
      console.log(`PDF_CREATE_DONE bytes=${bytes}`);

      // Upload with retries
      console.log(`UPLOAD_START filename=${filename}`);
      try {
        pdfUrl = await uploadWithRetry(base44, file);
      } catch (uploadErr) {
        console.error(`ERROR step=upload error=${uploadErr.message}`);
        await base44.asServiceRole.entities.Ticket.update(ticket.id, {
          generation_status: 'failed',
          ticket_generated: false,
          last_generation_error: uploadErr.message,
        });
        await base44.asServiceRole.entities.Registration.update(guestId, { ticket_generated: false });
        return Response.json({ error: 'PDF_UPLOAD_FAILED_NO_URL', detail: uploadErr.message }, { status: 500 });
      }

      console.log(`UPLOAD_DONE pdf_url=${pdfUrl}`);

      // Persist PDF url — HARD VALIDATE
      if (!pdfUrl) {
        const msg = 'PDF_UPLOAD_FAILED_NO_URL';
        await base44.asServiceRole.entities.Ticket.update(ticket.id, {
          generation_status: 'failed',
          ticket_generated: false,
          last_generation_error: msg,
        });
        await base44.asServiceRole.entities.Registration.update(guestId, { ticket_generated: false });
        return Response.json({ error: msg }, { status: 500 });
      }

      await base44.asServiceRole.entities.Ticket.update(ticket.id, {
        pdf_url: pdfUrl,
        pdf_filename: filename,
        generation_status: 'ready',
        ticket_generated: true,
        last_generation_error: null,
      });
      await base44.asServiceRole.entities.Registration.update(guestId, { ticket_generated: true });
      console.log(`PDF_URL_SAVED pdf_url=${pdfUrl}`);

      // Reload fresh ticket data for email
      const refreshed = await base44.asServiceRole.entities.Ticket.filter({ registration_id: guestId });
      if (refreshed?.[0]) ticket = refreshed[0];
    }

    // ── STEP 5: Load event for email ────────────────────────────────────────
    const eventsForEmail = await base44.asServiceRole.entities.Event.filter({ id: guest.event_id });
    const eventData = eventsForEmail?.[0] || null;
    const eventName = eventData?.name || 'Event';

    // ── STEP 6: Send email ──────────────────────────────────────────────────
    // HARD RULE: never send if pdf_url missing
    if (!pdfUrl) {
      return Response.json({ error: 'EMAIL_BLOCKED_NO_PDF' }, { status: 500 });
    }

    console.log(`EMAIL_BUILD_STARTED recipient=${guest.email}`);
    const emailBody = buildApprovalEmail(guest, eventData);
    const icsContent = generateICSFile(eventData);
    console.log(`PDF_ATTACHED size=${pdfUrl ? 'yes' : 'no'}`);
    if (icsContent) console.log(`ICS_CREATED calendar_file=yes`);

    let emailSuccess = false;
    let emailError = null;
    try {
      await sendEmailWithRetry(
        base44,
        guest.email,
        `Du bist dabei – ${eventName}`,
        emailBody,
        pdfUrl,
        ticket.ticket_code,
        icsContent
      );
      emailSuccess = true;
      await base44.asServiceRole.entities.Ticket.update(ticket.id, { email_sent: true });
      await base44.asServiceRole.entities.Registration.update(guestId, {
        email_sent: true,
        last_email_error: null,
      });
    } catch (emailErr) {
      emailError = emailErr.message;
      console.error(`ERROR step=email error=${emailErr.message}`);
      await base44.asServiceRole.entities.Registration.update(guestId, {
        email_sent: false,
        last_email_error: emailErr.message,
      });
      // Ticket is ready but email failed — return partial success so UI can show resend option
      return Response.json({
        success: false,
        ticketReady: true,
        emailSuccess: false,
        emailError: emailErr.message,
        ticketCode: ticket.ticket_code,
        pdfUrl,
        error: `EMAIL_SEND_FAILED: ${emailErr.message}`,
      }, { status: 200 });
    }

    // ── STEP 7: Strict success response ─────────────────────────────────────
    return Response.json({
      success: true,
      ticketReady: true,
      emailSuccess: true,
      ticketCode: ticket.ticket_code,
      ticketId: ticket.id,
      pdfUrl,
      emailSentTo: guest.email,
      emailError: null,
    });

  } catch (error) {
    console.error(`ERROR step=unhandled error=${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});