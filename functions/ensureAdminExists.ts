import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const ADMIN_EMAIL = 'yannik@panke-management.com';
    
    // Check if admin already exists
    const existingUsers = await base44.asServiceRole.entities.User.list();
    const adminExists = existingUsers.some(u => u.email === ADMIN_EMAIL && u.role === 'admin');
    
    if (adminExists) {
      return Response.json({
        success: true,
        message: 'Admin account already exists',
        email: ADMIN_EMAIL
      });
    }
    
    // Invite admin user
    await base44.users.inviteUser(ADMIN_EMAIL, 'admin');
    
    return Response.json({
      success: true,
      message: 'Admin invitation sent',
      email: ADMIN_EMAIL
    });
  } catch (error) {
    console.error('Error ensuring admin exists:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});