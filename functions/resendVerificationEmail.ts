import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'E-Mail erforderlich' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    console.log(`RESEND_START email=${email}`);

    // Get user
    const users = await base44.asServiceRole.entities.User.filter({ email });
    const user = users?.[0];

    if (!user) {
      console.error(`RESEND_USER_NOT_FOUND email=${email}`);
      return Response.json({ error: 'E-Mail-Adresse nicht registriert' }, { status: 404 });
    }

    if (user.email_verified) {
      console.log(`RESEND_ALREADY_VERIFIED email=${email}`);
      return Response.json({ success: true, message: 'E-Mail bereits bestätigt' });
    }

    // Build verification link
    const verificationLink = `${new URL(req.url).origin}/verified?userId=${user.id}`;

    // Send verification email
    console.log(`RESEND_EMAIL_SENDING email=${email}`);
    const { error: emailError } = await resend.emails.send({
      from: 'Synergy <ticket@eventpass.panke-management.com>',
      to: email,
      subject: 'Bestätige deine E-Mail-Adresse',
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
          <p style="margin:12px 0 0;color:#888;font-size:14px;">Bestätige deine E-Mail-Adresse</p>
        </td></tr>
        <tr><td style="padding:0 40px 32px;text-align:center;">
          <p style="margin:0 0 24px;color:#cccccc;font-size:14px;line-height:1.6;">
            Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.
          </p>
          <a href="${verificationLink}" style="display:inline-block;background:#beff00;color:#070707;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:1px;">
            E-Mail bestätigen
          </a>
        </td></tr>
        <tr><td style="background:#beff00;height:6px;"></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    });

    if (emailError) {
      console.error(`RESEND_EMAIL_ERROR error=${emailError.message}`);
      return Response.json({ error: 'E-Mail konnte nicht versendet werden' }, { status: 500 });
    }

    console.log(`RESEND_EMAIL_SENT email=${email}`);

    return Response.json({
      success: true,
      message: 'Bestätigungs-E-Mail erneut versendet'
    });

  } catch (error) {
    console.error(`RESEND_ERROR error=${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});