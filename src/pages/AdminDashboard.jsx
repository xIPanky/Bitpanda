import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import { Users, Calendar, UserCheck, Ticket, TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1e1e1e' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p style={{ color: '#666', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            {label}
          </p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <Icon style={{ color: '#beff00', width: '24px', height: '24px' }} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list(),
    initialData: [],
  });

  const { data: allEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['all-events'],
    queryFn: () => base44.asServiceRole.entities.Event.list(),
    initialData: [],
  });

  const { data: allRegistrations, isLoading: regsLoading } = useQuery({
    queryKey: ['all-registrations'],
    queryFn: () => base44.asServiceRole.entities.Registration.list(),
    initialData: [],
  });

  const { data: allTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['all-tickets'],
    queryFn: () => base44.asServiceRole.entities.Ticket.list(),
    initialData: [],
  });

  if (usersLoading || eventsLoading || regsLoading || ticketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070707' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#beff00' }} />
      </div>
    );
  }

  const organizers = allUsers.filter(u => u.role === 'organizer');
  const totalGuests = allRegistrations.length;
  const ticketsGenerated = allTickets.length;

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: '#070707' }}>
      {/* Admin Banner */}
      <div className="mb-8 p-4 rounded-lg" style={{ background: 'rgba(190, 255, 0, 0.1)', border: '1px solid #beff00' }}>
        <p style={{ color: '#beff00', fontSize: '14px', fontWeight: '600' }}>
          🔐 ADMIN MODUS AKTIV
        </p>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p style={{ color: '#666', marginTop: '4px' }}>Globale Plattformübersicht</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard label="Veranstalter" value={organizers.length} icon={Users} />
        <StatCard label="Events" value={allEvents.length} icon={Calendar} />
        <StatCard label="Gäste" value={totalGuests} icon={UserCheck} />
        <StatCard label="Tickets generiert" value={ticketsGenerated} icon={Ticket} />
      </div>

      {/* Organizers Table */}
      <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Veranstalter</h2>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#111111', borderBottom: '1px solid #1e1e1e' }}>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Name</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Email</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Events</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Gäste</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {organizers.map((org) => {
                  const orgEvents = allEvents.filter(e => e.organizer_id === org.id);
                  const orgGuests = allRegistrations.filter(r => r.organizer_id === org.id);
                  return (
                    <tr key={org.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                      <td className="px-6 py-4" style={{ color: '#fff' }}>{org.full_name}</td>
                      <td className="px-6 py-4" style={{ color: '#999' }}>{org.email}</td>
                      <td className="px-6 py-4" style={{ color: '#fff' }}>{orgEvents.length}</td>
                      <td className="px-6 py-4" style={{ color: '#fff' }}>{orgGuests.length}</td>
                      <td className="px-6 py-4" style={{ color: '#666' }}>
                        {format(new Date(org.created_date), 'd. MMM yyyy', { locale: de })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Events Table */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Events (Global)</h2>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#111111', borderBottom: '1px solid #1e1e1e' }}>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Event</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Veranstalter</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Datum</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Gäste</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map((event) => {
                  const eventRegs = allRegistrations.filter(r => r.event_id === event.id);
                  const organizer = allUsers.find(u => u.id === event.organizer_id);
                  return (
                    <tr key={event.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                      <td className="px-6 py-4" style={{ color: '#fff' }}>{event.name}</td>
                      <td className="px-6 py-4" style={{ color: '#999' }}>{organizer?.full_name || '–'}</td>
                      <td className="px-6 py-4" style={{ color: '#999' }}>
                        {event.date ? format(new Date(event.date), 'd. MMM yyyy', { locale: de }) : '–'}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#fff' }}>{eventRegs.length}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{
                          background: event.status === 'published' ? 'rgba(190, 255, 0, 0.1)' : 'rgba(100, 100, 100, 0.1)',
                          color: event.status === 'published' ? '#beff00' : '#999'
                        }}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guests Table */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Gäste (Global)</h2>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#111111', borderBottom: '1px solid #1e1e1e' }}>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Name</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Email</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Event</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Veranstalter</th>
                  <th className="px-6 py-3 text-left" style={{ color: '#beff00', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allRegistrations.slice(0, 50).map((guest) => {
                  const event = allEvents.find(e => e.id === guest.event_id);
                  const organizer = allUsers.find(u => u.id === guest.organizer_id);
                  return (
                    <tr key={guest.id} style={{ borderBottom: '1px solid #1e1e1e' }}>
                      <td className="px-6 py-4" style={{ color: '#fff' }}>{guest.first_name} {guest.last_name}</td>
                      <td className="px-6 py-4" style={{ color: '#999' }}>{guest.email}</td>
                      <td className="px-6 py-4" style={{ color: '#fff' }}>{event?.name || '–'}</td>
                      <td className="px-6 py-4" style={{ color: '#999' }}>{organizer?.full_name || '–'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{
                          background: guest.status === 'approved' ? 'rgba(190, 255, 0, 0.1)' : guest.status === 'pending' ? 'rgba(255, 200, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                          color: guest.status === 'approved' ? '#beff00' : guest.status === 'pending' ? '#ffc800' : '#ff4444'
                        }}>
                          {guest.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {allRegistrations.length > 50 && (
              <div className="px-6 py-4" style={{ color: '#666', textAlign: 'center', borderTop: '1px solid #1e1e1e' }}>
                +{allRegistrations.length - 50} weitere Gäste
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}