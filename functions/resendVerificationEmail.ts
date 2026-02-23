import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const resend = {
  emails: {
    send: async (params) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      return response.json();
    }
  }
};

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Find user by email
    const users = await base44.asServiceRole.entities.User.filter({ email: email });
    if (users.length === 0) {
      return Response.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const user = users[0];

    // If already verified, return success silently
    if (user.email_verified) {
      return Response.json({ message: 'Email already verified' });
    }

    // Generate verification link
    const verificationLink = `${new URL(req.url).origin}/verified?token=${encodeURIComponent(user.id)}&email=${encodeURIComponent(email)}&type=${user.account_type || 'guest'}`;

    // Send verification email via Resend
    const emailResult = await resend.emails.send({
      from: 'noreply@synergy.events',
      to: email,
      subject: 'Bestätige deine E-Mail-Adresse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #070707;">Willkommen bei Synergy!</h1>
          <p>Hallo ${user.full_name || 'Benutzer'},</p>
          <p>um dein Konto zu aktivieren, klicke bitte auf den Link unten:</p>
          <p>
            <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #beff00; color: #070707; text-decoration: none; border-radius: 8px; font-weight: bold;">
              E-Mail bestätigen
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            Oder kopiere diesen Link in deine Adressleiste:<br/>
            ${verificationLink}
          </p>
          <p style="color: #888; margin-top: 32px; font-size: 12px;">Synergy Ticketing Platform</p>
        </div>
      `
    });

    if (!emailResult.id) {
      console.error('Resend error:', emailResult);
      return Response.json({ error: 'Fehler beim Versenden der E-Mail' }, { status: 500 });
    }

    return Response.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});