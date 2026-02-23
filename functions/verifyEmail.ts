import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Get user by ID (token is the user ID)
    let user;
    try {
      user = await base44.asServiceRole.entities.User.get(token);
      if (!user) {
        return Response.json({ error: 'Der Bestätigungslink ist ungültig oder abgelaufen.' }, { status: 404 });
      }
    } catch (err) {
      console.error('User fetch error:', err);
      return Response.json({ error: 'Der Bestätigungslink ist ungültig oder abgelaufen.' }, { status: 404 });
    }

    // Update user - mark email as verified
    try {
      await base44.asServiceRole.entities.User.update(token, {
        email_verified: true,
        email_verified_at: new Date().toISOString()
      });
      console.log(`Email verified for user: ${token} (${user.email})`);
    } catch (updateError) {
      console.error('Update error:', updateError);
      return Response.json({ error: 'Fehler bei der Bestätigung' }, { status: 500 });
    }

    return Response.json({ 
      success: true,
      message: 'E-Mail erfolgreich bestätigt',
      email: user.email
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});