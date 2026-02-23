import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AccessGuard from '@/components/AccessGuard.jsx';
import { Users, Zap, Ticket, TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AdminDashboard() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !userLoading && user?.role === 'admin',
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['all-events-admin'],
    queryFn: () => base44.entities.Event.list(),
    enabled: !userLoading && user?.role === 'admin',
  });

  const { data: allTickets = [] } = useQuery({
    queryKey: ['all-tickets-admin'],
    queryFn: () => base44.entities.Ticket.list(),
    enabled: !userLoading && user?.role === 'admin',
  });

  const { data: allRegistrations = [] } = useQuery({
    queryKey: ['all-registrations-admin'],
    queryFn: () => base44.entities.Registration.list(),
    enabled: !userLoading && user?.role === 'admin',
  });

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070707' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#beff00' }} />
      </div>
    );
  }

  // Filter organizers only
  const organizers = allUsers.filter((u) => u.role === 'organizer');
  const organizerStats = organizers.map((org) => ({
    organizer: org,
    events: allEvents.filter((e) => e.organizer_id === org.id).length,
    tickets: allTickets.filter((t) => t.organizer_id === org.id).length,
    guests: allRegistrations.filter((r) => r.organizer_id === org.id).length,
  }));

  const stats = [
    { label: 'Veranstalter', value: organizers.length, icon: Users, color: '#beff00' },
    { label: 'Events insgesamt', value: allEvents.length, icon: Zap, color: '#beff00' },
    { label: 'Tickets verkauft', value: allTickets.length, icon: Ticket, color: '#beff00' },
    { label: 'Gäste registriert', value: allRegistrations.length, icon: TrendingUp, color: '#beff00' },
  ];

  return (
    <AccessGuard requiredRole="admin">
    <div className="min-h-screen p-5 md:p-8" style={{ background: '#070707' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">Plattformübersicht und Veranstalter-Management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border p-6"
                style={{ background: '#0a0a0a', border: '1px solid #1e1e1e' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Organizers Table */}
        <div className="rounded-xl border" style={{ background: '#0a0a0a', border: '1px solid #1e1e1e' }}>
          <div className="p-6 border-b" style={{ borderColor: '#1a1a1a' }}>
            <h2 className="text-xl font-bold text-white">Veranstalter</h2>
            <p className="text-sm text-gray-400 mt-1">Liste aller Veranstalter und ihre Aktivitäten</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#111', borderBottom: '1px solid #1a1a1a' }}>
                  <th className="px-6 py-3 text-left font-semibold text-white">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">E-Mail</th>
                  <th className="px-6 py-3 text-center font-semibold text-white">Events</th>
                  <th className="px-6 py-3 text-center font-semibold text-white">Gäste</th>
                  <th className="px-6 py-3 text-center font-semibold text-white">Tickets</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">Registriert</th>
                </tr>
              </thead>
              <tbody>
                {organizerStats.map((stat, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1a1a1a' }} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white font-semibold">{stat.organizer.full_name}</td>
                    <td className="px-6 py-4 text-gray-400">{stat.organizer.email}</td>
                    <td className="px-6 py-4 text-center text-white font-semibold" style={{ color: '#beff00' }}>
                      {stat.events}
                    </td>
                    <td className="px-6 py-4 text-center text-white font-semibold">{stat.guests}</td>
                    <td className="px-6 py-4 text-center text-white font-semibold">{stat.tickets}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {format(new Date(stat.organizer.created_date), 'dd. MMM yyyy', { locale: de })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </AccessGuard>
  );
}