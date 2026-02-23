import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    let migrated = 0;
    let errors = [];

    for (const u of allUsers) {
      try {
        // Only migrate if role is not admin or user
        if (u.role && u.role !== 'admin' && u.role !== 'user') {
          console.log(`Migrating user ${u.email}: role="${u.role}" → role="user"`);
          
          await base44.asServiceRole.entities.User.update(u.id, {
            role: 'user',
            account_type: u.account_type || 'guest'
          });
          migrated++;
        }
      } catch (err) {
        errors.push(`${u.email}: ${err.message}`);
      }
    }

    return Response.json({
      message: 'Migration complete',
      total_users: allUsers.length,
      migrated,
      errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});