import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

function generateTicketCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const pick = () => letters.charAt(Math.floor(Math.random() * letters.length));
  return `${pick()}${pick()}${pick()}-${Math.floor(100 + Math.random() * 900)}`;
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function generateTicketPDF(guest, ticket, eventData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const NEON = [190, 255, 0];
  const BLACK = [7, 7, 7];
  const WHITE = [255, 255, 255];
  const GRAY = [80, 80, 80];
  const DARK = [17, 17, 17];
  const W = 210;
  const H = 297;

  doc.setFillColor(...BLACK);
  doc.rect(0, 0, W, H, 'F');

  doc.setFillColor(...NEON);
  doc.rect(0, 0, W, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text((eventData?.name || 'EVENT').toUpperCase(), W / 2, 32, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(...NEON);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL TICKET · INVITE ONLY', W / 2, 42, { align: 'center' });

  doc.setDrawColor(...NEON);
  doc.setLineWidth(0.3);
  doc.line(20, 48, W - 20, 48);

  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.guest_name || '', W / 2, 62, { align: 'center' });

  const cat = (ticket.category || 'Standard').toUpperCase();
  doc.setFillColor(...NEON);
  const catW = doc.getTextWidth(cat) + 14;
  doc.roundedRect((W - catW) / 2, 67, catW, 8, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text(cat, W / 2, 73, { align: 'center' });

  doc.setFillColor(...DARK);
  doc.roundedRect(20, 84, W - 40, 40, 4, 4, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  let detailY = 96;
  if (eventData?.date) {
    const d = new Date(eventData.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text('DATUM', 30, detailY - 4);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(d + (eventData.time ? `  ·  ${eventData.time} Uhr` : ''), 30, detailY + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    detailY += 14;
  }
  if (eventData?.location) {
    doc.text('ORT', 30, detailY - 4);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(eventData.location, 30, detailY + 3);
  }

  doc.setFillColor(13, 26, 0);
  doc.roundedRect(20, 134, W - 40, 54, 4, 4, 'F');
  doc.setDrawColor(...NEON);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, 134, W - 40, 54, 4, 4, 'S');

  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('TICKET CODE', W / 2, 144, { align: 'center' });

  doc.setFontSize(26);
  doc.setTextColor(...NEON);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.ticket_code || '', W / 2, 160, { align: 'center' });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticket.ticket_code)}&bgcolor=0d1a00&color=beff00&format=png`;
  try {
    const qrResp = await fetch(qrUrl);
    const qrBuf = await qrResp.arrayBuffer();
    const qrBase64 = btoa(String.fromCharCode(...new Uint8Array(qrBuf)));
    doc.addImage(`data:image/png;base64,${qrBase64}`, 'PNG', W / 2 - 18, 166, 36, 36);
  } catch (_e) {
    // QR fetch failed — skip
  }

  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.3);
  doc.line(20, 212, W - 20, 212);

  doc.setFontSize(8);
  doc.setTextColor(42, 42, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${eventData?.name || ''} · powered by Synergy`, W / 2, 222, { align: 'center' });

  doc.setFillColor(...NEON);
  doc.rect(0, H - 3, W, 3, 'F');

  // Return as base64 data URL — arraybuffer cannot be passed directly to UploadFile
  const base64 = doc.output('datauristring');
  return base64;
}

function buildApprovalEmail(guest, ticket, eventData, pdfUrl) {
  const eventName = eventData?.name || 'Event';
  const eventDate = eventData?.date
    ? new Date(eventData.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const eventTime = eventData?.time || '';
  const eventLocation = eventData?.location || '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#070707;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070707;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:16px;overflow:hidden;">

        <!-- Top neon bar -->
        <tr><td style="background:#beff00;height:4px;font-size:0;">&nbsp;</td></tr>

        <!-- Header -->
        <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #161616;">
          <p style="margin:0 0 8px;color:#beff00;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">INVITE APPROVED</p>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.02em;">${eventName}</h1>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0 0 12px;color:#cccccc;font-size:15px;line-height:1.6;">Hallo ${guest.first_name},</p>
          <p style="margin:0;color:#888888;font-size:14px;line-height:1.7;">
            deine Registrierung wurde geprüft und freigegeben.<br>
            Dein persönliches Ticket ist unten als Download-Link verfügbar – zeige es beim Einlass vor.
          </p>
        </td></tr>

        <!-- Ticket code callout -->
        <tr><td style="padding:24px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 8px;color:#444444;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Ticket-Code</p>
              <p style="margin:0;color:#beff00;font-size:24px;font-weight:700;letter-spacing:6px;font-family:'Courier New',Courier,monospace;">${ticket.ticket_code}</p>
            </td></tr>
          </table>
        </td></tr>

        ${(eventDate || eventLocation) ? `
        <!-- Event details -->
        <tr><td style="padding:16px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;color:#444444;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Event-Details</p>
              ${eventDate ? `<p style="margin:0 0 6px;color:#888888;font-size:14px;">📅 ${eventDate}${eventTime ? ` · ${eventTime} Uhr` : ''}</p>` : ''}
              ${eventLocation ? `<p style="margin:0;color:#888888;font-size:14px;">📍 ${eventLocation}</p>` : ''}
            </td></tr>
          </table>
        </td></tr>` : ''}

        <!-- PDF download CTA -->
        ${pdfUrl ? `
        <tr><td style="padding:24px 40px 0;text-align:center;">
          <a href="${pdfUrl}" style="display:inline-block;background:#beff00;color:#070707;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
            ↓ Ticket als PDF herunterladen
          </a>
          <p style="margin:12px 0 0;color:#444444;font-size:12px;">Dein Ticket ist im Anhang als PDF verfügbar.</p>
        </td></tr>` : ''}

        <!-- Footer note -->
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0;color:#555555;font-size:13px;line-height:1.6;">
            Wir freuen uns auf dich! Bei Fragen antworte einfach auf diese E-Mail.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:32px 40px 24px;border-top:1px solid #141414;margin-top:32px;">
          <p style="margin:0;color:#2a2a2a;font-size:11px;text-align:center;">${eventName} · powered by Synergy</p>
        </td></tr>

        <!-- Bottom neon bar -->
        <tr><td style="background:#beff00;height:4px;font-size:0;">&nbsp;</td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildResendEmail(guest, ticket, eventData, pdfUrl) {
  const eventName = eventData?.name || 'Event';
  const eventDate = eventData?.date
    ? new Date(eventData.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const eventTime = eventData?.time || '';
  const eventLocation = eventData?.location || '';

  return `<!DOCTYPE html>
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

    // ── STEP 1: Load guest ──
    console.log('APPROVAL STARTED for guestId:', guestId);
    const registrations = await base44.asServiceRole.entities.Registration.list();
    const guest = registrations.find(r => r.id === guestId);
    if (!guest) {
      return Response.json({ error: 'Guest not found' }, { status: 404 });
    }

    // ── STEP 2: Verify guest email ──
    console.log('GUEST EMAIL FOUND:', guest.email);
    if (!guest.email || !isValidEmail(guest.email)) {
      return Response.json({ error: 'Guest has no valid email address' }, { status: 400 });
    }
    console.log('EMAIL TARGET =', guest.email);

    // ── STEP 3: Update status → approved ──
    await base44.asServiceRole.entities.Registration.update(guestId, {
      status: 'approved',
      approved_by: user.email,
    });
    console.log('STATUS UPDATED to approved for:', guest.email);

    // ── STEP 4: Ensure no duplicate ticket ──
    const allTickets = await base44.asServiceRole.entities.Ticket.list();
    let ticket = allTickets.find(t => t.registration_id === guestId);

    if (!ticket) {
      let tierName = null;
      let tierPrice = null;
      if (guest.ticket_tier_id) {
        const tiers = await base44.asServiceRole.entities.TicketTier.list();
        const tier = tiers.find(t => t.id === guest.ticket_tier_id);
        tierName = tier?.name || null;
        tierPrice = tier?.price ?? null;
      }

      ticket = await base44.asServiceRole.entities.Ticket.create({
        event_id: guest.event_id,
        registration_id: guestId,
        ticket_tier_id: guest.ticket_tier_id || null,
        ticket_code: generateTicketCode(),
        guest_name: `${guest.first_name} ${guest.last_name}`.trim(),
        guest_email: guest.email,
        category: guest.category || 'Standard',
        tier_name: tierName,
        tier_price: tierPrice,
        status: 'valid',
        email_sent: false,
      });
      console.log('TICKET CREATED:', ticket.ticket_code);
    } else {
      console.log('TICKET ALREADY EXISTS:', ticket.ticket_code, '— reusing');
    }

    // ── STEP 5: Fetch event data ──
    const events = await base44.asServiceRole.entities.Event.list();
    const eventData = events.find(e => e.id === guest.event_id);

    // ── STEP 6: Generate PDF ──
    console.log('PDF GENERATING for ticket:', ticket.ticket_code);
    const pdfDataUri = await generateTicketPDF(guest, ticket, eventData);

    // Convert data URI to Blob for upload
    const base64Data = pdfDataUri.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pdfFile = new File([bytes], `ticket-${ticket.ticket_code}.pdf`, { type: 'application/pdf' });

    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfFile });
    const pdfUrl = uploadResult?.file_url || null;
    if (!pdfUrl) throw new Error('PDF upload failed — no file_url returned');
    console.log('PDF READY at:', pdfUrl);

    // Save PDF url back to ticket
    await base44.asServiceRole.entities.Ticket.update(ticket.id, {
      pdf_url: pdfUrl,
      ticket_generated: true,
    });

    // ── STEP 7: Send approval email ──
    const emailBody = buildApprovalEmail(guest, ticket, eventData, pdfUrl);
    const eventName = eventData?.name || 'Event';

    console.log('EMAIL ATTEMPT to:', guest.email);
    let emailSuccess = false;
    let emailError = null;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: guest.email,
        subject: `Dein Ticket wurde bestätigt – ${eventName}`,
        body: emailBody,
      });
      emailSuccess = true;
      console.log('EMAIL SENT to:', guest.email);
      await base44.asServiceRole.entities.Ticket.update(ticket.id, { email_sent: true });
    } catch (err) {
      emailError = err.message;
      console.error('EMAIL ERROR:', err.message);
    }

    return Response.json({
      success: true,
      ticketCode: ticket.ticket_code,
      ticketId: ticket.id,
      pdfUrl,
      emailSentTo: guest.email,
      emailSuccess,
      emailError: emailError || null,
    });

  } catch (error) {
    console.error('APPROVAL ERROR:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});