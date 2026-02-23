import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { user_id, email, type } = await req.json();

    if (!user_id || !email) {
      return Response.json({ error: 'Missing user_id or email' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Verify user exists
    try {
      const user = await base44.asServiceRole.entities.User.get(user_id);
      if (!user) {
        return Response.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
      }
    } catch (err) {
      console.error('User fetch error:', err);
      return Response.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Update user - mark email as verified
    try {
      await base44.asServiceRole.entities.User.update(user_id, {
        email_verified: true,
        email_verified_at: new Date().toISOString()
      });
      console.log(`Email verified for user: ${user_id} (${email})`);
    } catch (updateError) {
      console.error('Update error:', updateError);
      return Response.json({ error: 'Fehler bei der Bestätigung' }, { status: 500 });
    }

    return Response.json({ 
      message: 'Email verified successfully',
      email: email
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});