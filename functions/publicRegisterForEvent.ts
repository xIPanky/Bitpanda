import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email) => emailRegex.test(email);

const generateTicketCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const payload = await req.json();
    
    // Validate required fields
    if (!payload.event_id) {
      return Response.json({ error: 'event_id ist erforderlich' }, { status: 400 });
    }
    if (!payload.email || !validateEmail(payload.email)) {
      return Response.json({ error: 'Gültige E-Mail-Adresse erforderlich' }, { status: 400 });
    }
    if (!payload.first_name?.trim() || !payload.last_name?.trim()) {
      return Response.json({ error: 'Vor- und Nachname erforderlich' }, { status: 400 });
    }

    // Initialize Base44 as service role (no auth required)
    const base44 = createClientFromRequest(req);

    // Fetch event to verify it exists and is public
    const event = await base44.asServiceRole.entities.Event.get(payload.event_id);
    if (!event) {
      return Response.json({ error: 'Event nicht gefunden' }, { status: 404 });
    }
    if (!event.registration_open) {
      return Response.json({ error: 'Registrierung für dieses Event geschlossen' }, { status: 403 });
    }

    // Create registration record (public function, no auth needed)
    const registration = await base44.asServiceRole.entities.Registration.create({
      event_id: payload.event_id,
      ticket_tier_id: payload.ticket_tier_id || '',
      first_name: payload.first_name.trim(),
      last_name: payload.last_name.trim(),
      email: payload.email.toLowerCase(),
      phone: payload.phone || '',
      company: payload.company || '',
      category: payload.category || 'Standard',
      plus_one: payload.plus_one || false,
      plus_one_name: payload.plus_one_name || '',
      custom_answers: payload.custom_answers || [],
      invited_by: payload.invited_by || '',
      notes: payload.notes || '',
      status: 'pending',
      payment_status: 'not_required',
    });

    // Handle plus-one registration
    if (payload.plus_one && payload.plus_one_first_name && payload.plus_one_last_name) {
      await base44.asServiceRole.entities.Registration.create({
        event_id: payload.event_id,
        ticket_tier_id: payload.ticket_tier_id || '',
        first_name: payload.plus_one_first_name.trim(),
        last_name: payload.plus_one_last_name.trim(),
        email: payload.plus_one_email?.toLowerCase() || '',
        custom_answers: payload.custom_answers || [],
        category: payload.category || 'Standard',
        status: 'pending',
        payment_status: 'not_required',
      });
    }

    // Send confirmation email (use service role to invoke function)
    try {
      await base44.asServiceRole.functions.invoke('sendRegistrationConfirmation', {
        email: payload.email,
        first_name: payload.first_name,
        event_id: payload.event_id,
        event_name: event.name || '',
        event_date: event.date || '',
        event_time: event.time || '',
        event_location: event.location || '',
      });
    } catch (emailErr) {
      console.error('Email error:', emailErr);
      // Don't fail registration if email fails
    }

    // Return success with registration ID
    return Response.json({
      success: true,
      registration_id: registration.id,
      email: registration.email,
      message: 'Registrierung erhalten. Bitte überprüfe deine E-Mail.',
    });

  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ 
      error: error.message || 'Registrierung fehlgeschlagen. Bitte versuche es erneut.',
    }, { status: 500 });
  }
});