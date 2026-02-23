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

  // Background
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, W, H, 'F');

  // Top neon bar
  doc.setFillColor(...NEON);
  doc.rect(0, 0, W, 3, 'F');

  // Event name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text((eventData?.name || 'EVENT').toUpperCase(), W / 2, 30, { align: 'center' });

  // Subtitle/label
  doc.setFontSize(9);
  doc.setTextColor(...NEON);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL TICKET · INVITE ONLY', W / 2, 40, { align: 'center' });

  // Divider
  doc.setDrawColor(...NEON);
  doc.setLineWidth(0.3);
  doc.line(20, 46, W - 20, 46);

  // Guest name
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.guest_name || '', W / 2, 60, { align: 'center' });

  // Category badge
  doc.setFillColor(...NEON);
  const cat = (ticket.category || 'Standard').toUpperCase();
  const catW = doc.getTextWidth(cat) + 14;
  doc.roundedRect((W - catW) / 2, 65, catW, 8, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.text(cat, W / 2, 71, { align: 'center' });

  // Event details box
  doc.setFillColor(...DARK);
  doc.roundedRect(20, 82, W - 40, 40, 4, 4, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  let detailY = 94;
  if (eventData?.date) {
    const d = new Date(eventData.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`DATUM`, 30, detailY - 4);
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
    doc.text(`ORT`, 30, detailY - 4);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(eventData.location, 30, detailY + 3);
  }

  // Ticket code section
  doc.setFillColor(13, 26, 0);
  doc.roundedRect(20, 132, W - 40, 52, 4, 4, 'F');
  doc.setDrawColor(...NEON);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, 132, W - 40, 52, 4, 4, 'S');

  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('TICKET CODE', W / 2, 142, { align: 'center' });

  doc.setFontSize(26);
  doc.setTextColor(...NEON);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.ticket_code || '', W / 2, 158, { align: 'center' });

  // QR code (using external API url as image)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticket.ticket_code)}&bgcolor=0d1a00&color=beff00&format=png`;
  try {
    const qrResp = await fetch(qrUrl);
    const qrBuf = await qrResp.arrayBuffer();
    const qrBase64 = btoa(String.fromCharCode(...new Uint8Array(qrBuf)));
    doc.addImage(`data:image/png;base64,${qrBase64}`, 'PNG', W / 2 - 18, 164, 36, 36);
  } catch (_e) {
    // QR fetch failed — skip silently
  }

  // Bottom divider
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.3);
  doc.line(20, 210, W - 20, 210);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(42, 42, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${eventData?.name || ''} · powered by Synergy`, W / 2, 220, { align: 'center' });

  // Bottom neon bar
  doc.setFillColor(...NEON);
  doc.rect(0, H - 3, W, 3, 'F');

  return doc.output('arraybuffer');
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

    // ── STEP 1: Fetch guest ──
    console.log('APPROVAL STARTED for guestId:', guestId);
    const registrations = await base44.asServiceRole.entities.Registration.list();
    const guest = registrations.find(r => r.id === guestId);
    if (!guest) {
      return Response.json({ error: 'Guest not found' }, { status: 404 });
    }

    // Email validation
    if (!guest.email || !isValidEmail(guest.email)) {
      return Response.json({ error: 'Guest has no valid email address' }, { status: 400 });
    }

    // ── STEP 2: Update status → approved ──
    await base44.asServiceRole.entities.Registration.update(guestId, {
      status: 'approved',
      approved_by: user.email,
    });
    console.log('STATUS UPDATED to approved for:', guest.email);

    // ── STEP 3: Ensure no duplicate ticket ──
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

    // ── STEP 4: Verify ticket persisted ──
    const verifyList = await base44.asServiceRole.entities.Ticket.list();
    const verifiedTicket = verifyList.find(t => t.id === ticket.id);
    if (!verifiedTicket) {
      throw new Error('Ticket could not be verified after creation');
    }

    // ── STEP 5: Fetch event data ──
    const events = await base44.asServiceRole.entities.Event.list();
    const eventData = events.find(e => e.id === guest.event_id);

    // ── STEP 6: Generate PDF ──
    console.log('PDF GENERATED for ticket:', verifiedTicket.ticket_code);
    const pdfBytes = await generateTicketPDF(guest, verifiedTicket, eventData);

    // Upload PDF
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfBlob });
    const pdfUrl = uploadResult?.file_url;
    console.log('PDF FILE READY at:', pdfUrl);

    // Update ticket with PDF url
    await base44.asServiceRole.entities.Ticket.update(verifiedTicket.id, {
      pdf_url: pdfUrl,
    });

    // ── STEP 7: Send approval email ──
    const eventName = eventData?.name || 'Event';
    const eventDate = eventData?.date
      ? new Date(eventData.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const eventTime = eventData?.time || '';
    const eventLocation = eventData?.location || '';

    const emailBody = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#070707;color:#ffffff;">
      <div style="text-align:center;padding:32px 0;border-bottom:1px solid #1a1a1a;margin-bottom:32px;">
        <p style="color:#beff00;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">INVITE APPROVED</p>
        <h1 style="font-size:28px;font-weight:800;color:#fff;margin:0;letter-spacing:-0.02em;">${eventName}</h1>
      </div>
      <p style="color:#888;line-height:1.7;font-size:15px;">Hallo ${guest.first_name},</p>
      <p style="color:#888;line-height:1.7;font-size:15px;">
        deine Registrierung wurde geprüft und freigegeben.<br/>
        Im Anhang findest du dein persönliches Ticket als PDF – zeige es beim Einlass vor.
      </p>
      <div style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;padding:20px 24px;margin:24px 0;">
        <p style="font-size:10px;color:#444;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Ticket-Code</p>
        <p style="font-size:22px;font-weight:700;color:#beff00;letter-spacing:4px;font-family:monospace;margin:0;">${verifiedTicket.ticket_code}</p>
      </div>
      ${(eventDate || eventLocation) ? `
      <div style="background:#111111;border:1px solid #1e1e1e;border-radius:12px;padding:20px 24px;margin:24px 0;">
        <p style="font-size:10px;color:#444;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Event-Details</p>
        ${eventDate ? `<p style="color:#888;font-size:14px;margin:4px 0;">📅 ${eventDate}${eventTime ? ` · ${eventTime} Uhr` : ''}</p>` : ''}
        ${eventLocation ? `<p style="color:#888;font-size:14px;margin:4px 0;">📍 ${eventLocation}</p>` : ''}
      </div>` : ''}
      <p style="color:#555;font-size:13px;line-height:1.6;margin-top:28px;">
        Dein Ticket ist im Anhang dieser E-Mail als PDF beigefügt.<br/>
        Wir freuen uns auf dich!
      </p>
      <p style="color:#2a2a2a;font-size:11px;margin-top:40px;border-top:1px solid #141414;padding-top:20px;text-align:center;">
        ${eventName} · powered by Synergy
      </p>
    </div>`;

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
      console.log('EMAIL SUCCESS to:', guest.email);
      await base44.asServiceRole.entities.Ticket.update(verifiedTicket.id, { email_sent: true });
    } catch (err) {
      emailError = err.message;
      console.error('EMAIL ERROR:', err.message);
      // Guest remains approved — resend is available
    }

    return Response.json({
      success: true,
      ticketCode: verifiedTicket.ticket_code,
      ticketId: verifiedTicket.id,
      emailSentTo: guest.email,
      emailSuccess,
      emailError: emailError || null,
    });

  } catch (error) {
    console.error('APPROVAL ERROR:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});