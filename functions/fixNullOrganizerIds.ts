import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all events
    const allEvents = await base44.asServiceRole.entities.Event.list();
    const adminUser = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const adminId = adminUser.length > 0 ? adminUser[0].id : null;

    if (!adminId) {
      return Response.json({ error: 'No admin user found' }, { status: 400 });
    }

    let fixed = 0;
    let errors = [];

    for (const event of allEvents) {
      try {
        // Fix events with null organizer_id
        if (!event.organizer_id) {
          console.log(`Fixing event ${event.id} (${event.name}): assigning to admin`);
          
          await base44.asServiceRole.entities.Event.update(event.id, {
            organizer_id: adminId
          });
          fixed++;
        }
      } catch (err) {
        errors.push(`${event.name}: ${err.message}`);
      }
    }

    return Response.json({
      message: 'Fix complete',
      total_events: allEvents.length,
      fixed,
      errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});