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
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const NEON = [190, 255, 0];
  const BLACK = [7, 7, 7];
  const WHITE = [255, 255, 255];
  const GRAY = [120, 120, 120];
  const DARK = [12, 12, 12];
  const DARKGREEN = [13, 26, 0];

  const W = 210;
  const H = 297;

  // ── BACKGROUND
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, W, H, "F");

  // Neon Top Line
  doc.setFillColor(...NEON);
  doc.rect(0, 0, W, 3, "F");

  // ── EVENT TITLE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(...WHITE);
  doc.text((eventData?.name || "EVENT").toUpperCase(), W / 2, 32, {
    align: "center",
  });

  doc.setFontSize(9);
  doc.setTextColor(...NEON);
  doc.text("OFFICIAL EVENT TICKET", W / 2, 40, { align: "center" });

  // Divider
  doc.setDrawColor(...NEON);
  doc.setLineWidth(0.4);
  doc.line(25, 46, W - 25, 46);

  // ── GUEST NAME (BIG HERO)
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text((ticket.guest_name || "").toUpperCase(), W / 2, 62, {
    align: "center",
  });

  // CATEGORY PILL
  const cat = (ticket.category || "STANDARD").toUpperCase();
  doc.setFontSize(8);
  const cw = doc.getTextWidth(cat) + 14;
  doc.setFillColor(...NEON);
  doc.roundedRect((W - cw) / 2, 68, cw, 8, 3, 3, "F");
  doc.setTextColor(...BLACK);
  doc.text(cat, W / 2, 73.5, { align: "center" });

  // ─────────────────────────────────────────────
// EVENT DETAILS CARD (ULTRA MODERN STYLE)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// QR CARD (NEON FRAME RESTORED)
// ─────────────────────────────────────────────

// Background
doc.setFillColor(...DARKGREEN);
doc.roundedRect(20, 144, W - 40, 110, 4, 4, 'F');

// NEON FRAME (BACK LIKE BEFORE)
doc.setDrawColor(...NEON);
doc.setLineWidth(0.6);
doc.roundedRect(20, 144, W - 40, 110, 4, 4, 'S');

// ─────────────────────────────────────────────
// PRO EVENT DETAILS CARD (SYNERGY PREMIUM)
// ─────────────────────────────────────────────
const cardX = 22;
const cardY = 88;
const cardW = W - 44;
const cardH = 44;

// Card background
doc.setFillColor(...DARK);
doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, "F");

// Accent line (neon)
doc.setDrawColor(...NEON);
doc.setLineWidth(0.35);
doc.line(cardX + 12, cardY + 24, cardX + cardW - 12, cardY + 24);

// Parse date
let displayDay = "--";
let displayMon = "---";
let displayYear = "----";

try {
  if (eventData && eventData.date) {
    const d = new Date(eventData.date);

    if (!isNaN(d.getTime())) {
      displayDay = d.toLocaleDateString("de-DE", { day: "2-digit" });
      displayMon = d
        .toLocaleDateString("de-DE", { month: "short" })
        .toUpperCase();
      displayYear = d.getFullYear().toString();
    }
  }
} catch (e) {
  console.log("DATE_PARSE_FAILED", e.message);
}

// LEFT: Date big
doc.setFont("helvetica", "bold");
doc.setTextColor(...NEON);
doc.setFontSize(22);
doc.text(displayDay, cardX + 10, cardY + 16);

doc.setFontSize(10);
doc.text(displayMon, cardX + 10, cardY + 21);

doc.setFontSize(8);
doc.setTextColor(...GRAY);
doc.text(displayYear, cardX + 10, cardY + 27);

doc.setFontSize(6);
doc.text("DATE", cardX + 10, cardY + 34);

// RIGHT: Time
doc.setFont("helvetica", "bold");
doc.setTextColor(...WHITE);
doc.setFontSize(18);
doc.text(eventData?.time || "--:--", cardX + 60, cardY + 16);

doc.setFont("helvetica", "normal");
doc.setFontSize(6);
doc.setTextColor(...GRAY);
doc.text("DOORS OPEN", cardX + 60, cardY + 22);

// Bottom: Location
doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.setTextColor(...WHITE);
const loc = eventData?.location || "Location TBA";
const locLines = doc.splitTextToSize(`LOCATION: ${loc}`, cardW - 20);
doc.text(locLines || ["Location TBA"], cardX + 10, cardY + 38);


  // QR CODE (centered + bigger)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(ticket.ticket_code)}&bgcolor=0d1a00&color=beff00`;

  try {
    const qrResp = await fetch(qrUrl);
    if (qrResp.ok) {
      const qrBuf = await qrResp.arrayBuffer();
      const qrArr = new Uint8Array(qrBuf);
      let binary = "";
      for (let i = 0; i < qrArr.length; i++) {
        binary += String.fromCharCode(qrArr[i]);
      }
      const qrBase64 = btoa(binary);

      doc.addImage(
        `data:image/png;base64,${qrBase64}`,
        "PNG",
        W / 2 - 25,
        170,
        50,
        50
      );
    }
  } catch (_) {}

  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("SCAN FOR ENTRY", W / 2, 227, { align: "center" });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text(
    "Dieses Ticket ist personalisiert und nicht übertragbar.",
    W / 2,
    250,
    { align: "center" }
  );

  doc.setFillColor(...NEON);
  doc.rect(0, H - 3, W, 3, "F");

  // Export file
  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1];
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);

  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const filename = `ticket-${ticket.ticket_code}.pdf`;
  const file = new File([bytes], filename, { type: "application/pdf" });

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
            deine Registrierung wurde geprüft und freigegeben. Mach dich bereit für eine Nacht voller Energie, Musik und besonderer Momente. 
            Dein Ticket befindet sich im Anhang dieser E-Mail.

            Wir freuen uns auf die Party mit dir! 💚
          </p>
        </td></tr>
        
        <!-- Footer Message -->
        <tr><td style="padding:28px 40px;text-align:center;border-top:1px solid #141414;margin-top:8px;">
          <p style="margin:0;color:#666;font-size:12px;line-height:1.6;">
            Fragen?
            Schreib uns gerne eine Nachricht an yannik@panke-management.com .<br>
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

