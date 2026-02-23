import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const adminEmail = 'yannik@panke-management.com';
    const adminPassword = 'test1234';

    // Check if admin already exists
    const existingAdmins = await base44.asServiceRole.entities.User.filter({ email: adminEmail });

    if (existingAdmins.length > 0) {
      console.log(`Admin already exists: ${adminEmail}`);
      return Response.json({ 
        message: 'Admin already exists',
        email: adminEmail 
      });
    }

    // Create admin account via auth
    let adminUser;
    try {
      adminUser = await base44.auth.signUp(adminEmail, adminPassword);
      console.log(`Admin created: ${adminEmail} (user_id=${adminUser.id})`);
    } catch (signupError) {
      console.error(`Signup error: ${signupError.message}`);
      throw signupError;
    }

    // Update user to have admin role and email verified
    try {
      await base44.asServiceRole.entities.User.update(adminUser.id, {
        role: 'admin',
        email_verified: true,
        email_verified_at: new Date().toISOString()
      });
      console.log(`Admin updated with admin role and email verified`);
    } catch (updateError) {
      console.error(`Update error: ${updateError.message}`);
      throw updateError;
    }

    return Response.json({ 
      message: 'Admin account created successfully',
      email: adminEmail,
      id: adminUser.id
    });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});