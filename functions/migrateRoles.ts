import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Migration function to fix invalid roles and ensure admin exists
 * - Sets any role="guest" to role="user" with account_type="guest"
 * - Sets any role="organizer" to role="user" with account_type="organizer"
 * - Ensures admin user exists and is set to email_verified=true
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run this
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('MIGRATION_START');

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`MIGRATION_USERS_FOUND count=${allUsers.length}`);

    let migrated = 0;
    let errors = [];

    // Fix invalid roles
    for (const u of allUsers) {
      try {
        let needsUpdate = false;
        const updateData = {};

        // Fix invalid roles
        if (u.role === 'guest') {
          updateData.role = 'user';
          updateData.account_type = 'guest';
          needsUpdate = true;
        } else if (u.role === 'organizer') {
          updateData.role = 'user';
          updateData.account_type = 'organizer';
          needsUpdate = true;
        }

        // Ensure admin is verified
        if (u.role === 'admin' && !u.email_verified) {
          updateData.email_verified = true;
          updateData.email_verified_at = new Date().toISOString();
          needsUpdate = true;
        }

        if (needsUpdate) {
          await base44.asServiceRole.entities.User.update(u.id, updateData);
          migrated++;
          console.log(`MIGRATION_FIXED user_id=${u.id} email=${u.email} new_role=${updateData.role || u.role}`);
        }
      } catch (err) {
        errors.push(`Failed to migrate user ${u.email}: ${err.message}`);
        console.error(`MIGRATION_ERROR user_id=${u.id} error=${err.message}`);
      }
    }

    // Ensure primary admin has verified email
    const primaryAdminEmail = 'yannik@panke-management.com';
    const primaryAdmin = allUsers.find(u => u.email === primaryAdminEmail && u.role === 'admin');
    
    if (primaryAdmin && !primaryAdmin.email_verified) {
      try {
        await base44.asServiceRole.entities.User.update(primaryAdmin.id, {
          email_verified: true,
          email_verified_at: new Date().toISOString()
        });
        migrated++;
        console.log(`MIGRATION_ADMIN_VERIFIED email=${primaryAdminEmail}`);
      } catch (err) {
        errors.push(`Failed to verify admin: ${err.message}`);
        console.error(`MIGRATION_ADMIN_VERIFY_ERROR error=${err.message}`);
      }
    }

    return Response.json({
      success: true,
      migrated,
      errors,
      message: `Migration complete. Fixed ${migrated} users.`
    });

  } catch (error) {
    console.error(`MIGRATION_FATAL error=${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});