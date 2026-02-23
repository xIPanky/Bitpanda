import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Fix events with missing organizer_id
 * Assign events without organizer_id to admin user (yannik.panke@googlemail.com)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can run this
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('FIX_EVENTS_START');

    // Get all users to find admin
    const allUsers = await base44.asServiceRole.entities.User.list();
    const adminUser = allUsers.find(u => u.role === 'admin');

    if (!adminUser) {
      return Response.json({ error: 'Admin user not found' }, { status: 400 });
    }

    console.log(`FIX_EVENTS_ADMIN_FOUND user_id=${adminUser.id}`);

    // Get all events
    const allEvents = await base44.asServiceRole.entities.Event.list();
    console.log(`FIX_EVENTS_FOUND count=${allEvents.length}`);

    let fixed = 0;
    let errors = [];

    // Fix events without organizer_id
    for (const evt of allEvents) {
      try {
        if (!evt.organizer_id) {
          await base44.asServiceRole.entities.Event.update(evt.id, {
            organizer_id: adminUser.id
          });
          fixed++;
          console.log(`FIX_EVENTS_FIXED event_id=${evt.id} event_name=${evt.name}`);
        }
      } catch (err) {
        errors.push(`Failed to fix event ${evt.name}: ${err.message}`);
        console.error(`FIX_EVENTS_ERROR event_id=${evt.id} error=${err.message}`);
      }
    }

    return Response.json({
      success: true,
      fixed,
      errors,
      message: `Fixed ${fixed} events.`
    });

  } catch (error) {
    console.error(`FIX_EVENTS_FATAL error=${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});