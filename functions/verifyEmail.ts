import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { email, token, type } = await req.json();

    if (!email) {
      return Response.json({ error: 'email erforderlich' }, { status: 400 });
    }

    console.log(`VERIFY_START email=${email} type=${type}`);

    const base44 = createClientFromRequest(req);

    // Update user with email verification and account type
    const account_type = type === 'organizer' ? 'organizer' : 'guest';
    
    // Get the user by email from all users (using service role)
    const allUsers = await base44.asServiceRole.entities.User.list();
    const user = allUsers.find(u => u.email === email);

    if (!user) {
      return Response.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Update user with email verification and account type
    await base44.asServiceRole.entities.User.update(user.id, {
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      account_type: account_type
    });

    console.log(`VERIFY_SUCCESS email=${email} account_type=${account_type}`);
    
    return Response.json({
      success: true,
      email,
      account_type,
      message: 'E-Mail erfolgreich bestätigt'
    });

  } catch (error) {
    console.error(`VERIFY_ERROR error=${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});