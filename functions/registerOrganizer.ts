import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const { email, full_name, password, company } = await req.json();

    // Validation
    if (!email || !full_name || !password) {
      return Response.json({ error: 'Email, Name und Passwort erforderlich' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 });
    }

    console.log(`ORGANIZER_SIGNUP_START email=${email}`);

    const base44 = createClientFromRequest(req);

    // Create user account via public signup
    let signupResult;
    try {
      signupResult = await base44.auth.signUp(email, password || Math.random().toString(36).slice(-16));
      console.log(`ORGANIZER_USER_CREATED email=${email} user_id=${signupResult.id}`);
    } catch (signupError) {
      console.error(`ORGANIZER_SIGNUP_ERROR error=${signupError.message}`);
      if (signupError.message?.includes('already')) {
        return Response.json({ error: 'E-Mail-Adresse ist bereits registriert' }, { status: 409 });
      }
      throw signupError;
    }

    // Update user with role and account_type
    try {
      await base44.asServiceRole.entities.User.update(signupResult.id, {
        role: 'user',
        account_type: 'organizer',
        full_name: full_name
      });
      console.log(`ORGANIZER_USER_UPDATED email=${email} account_type=organizer`);
    } catch (updateError) {
      console.error(`ORGANIZER_UPDATE_ERROR error=${updateError.message}`);
      throw updateError;
    }

    // Use signup result ID as verification token
    const verificationLink = `${new URL(req.url).origin}/verified?token=${encodeURIComponent(signupResult.id)}&email=${encodeURIComponent(email)}&type=organizer`;

    // Send verification email
    console.log(`ORGANIZER_EMAIL_SENDING email=${email}`);
    const { error: emailError } = await resend.emails.send({
      from: 'Synergy <ticket@eventpass.panke-management.com>',
      to: email,
      subject: 'Bestätige deine E-Mail-Adresse - Veranstalter Account',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#070707;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070707;padding:20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:20px;overflow:hidden;">
        <tr><td style="background:#beff00;height:6px;"></td></tr>
        <tr><td style="padding:48px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:900;">E-Mail bestätigen</h1>
          <p style="margin:12px 0 0;color:#888;font-size:14px;">Willkommen bei Synergy, ${full_name}!</p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;text-align:center;">
          <p style="margin:0 0 24px;color:#cccccc;font-size:14px;line-height:1.6;">
            Bestätige deine E-Mail-Adresse, um deinen Veranstalter-Account zu aktivieren.
          </p>
          <a href="${verificationLink}" style="display:inline-block;background:#beff00;color:#070707;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:1px;">
            E-Mail bestätigen
          </a>
        </td></tr>
        <tr><td style="padding:0 40px 24px;text-align:center;">
          <p style="margin:0;color:#666;font-size:12px;">
            Falls dieser Link nicht funktioniert, kopiere folgende Adresse in deinen Browser:<br>
            <code style="color:#888;font-size:11px;">${verificationLink}</code>
          </p>
        </td></tr>
        <tr><td style="background:#beff00;height:6px;"></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    });

    if (emailError) {
      console.error(`ORGANIZER_EMAIL_ERROR error=${emailError.message}`);
      return Response.json({ error: 'Bestätigungs-E-Mail konnte nicht versendet werden' }, { status: 500 });
    }

    console.log(`ORGANIZER_EMAIL_SENT email=${email}`);

    return Response.json({
      success: true,
      email,
      full_name,
      company,
      message: 'Bestätigungs-E-Mail versendet'
    });

  } catch (error) {
    console.error(`ORGANIZER_ERROR error=${error.message}`);
    return Response.json({ error: error.response?.data?.message || error.message || 'Registrierung fehlgeschlagen' }, { status: 500 });
  }
});