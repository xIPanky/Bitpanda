import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'userId erforderlich' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    console.log(`VERIFY_START userId=${userId}`);

    // Get user
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    const user = users?.[0];

    if (!user) {
      console.error(`VERIFY_USER_NOT_FOUND userId=${userId}`);
      return Response.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    if (user.email_verified) {
      console.log(`VERIFY_ALREADY_VERIFIED userId=${userId}`);
      return Response.json({ success: true, message: 'E-Mail bereits bestätigt' });
    }

    // Mark as verified
    await base44.asServiceRole.entities.User.update(userId, {
      email_verified: true,
      email_verified_at: new Date().toISOString()
    });

    console.log(`VERIFY_SUCCESS userId=${userId} email=${user.email}`);

    return Response.json({
      success: true,
      email: user.email,
      message: 'E-Mail erfolgreich bestätigt'
    });

  } catch (error) {
    console.error(`VERIFY_ERROR error=${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});