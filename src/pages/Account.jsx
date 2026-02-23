import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { LogOut, User, Mail, Calendar, Ticket } from 'lucide-react';

export default function Account() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Check auth
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        return null;
      }
    },
  });

  // Check email verified
  useEffect(() => {
    if (!userLoading && (!user || !user.email_verified)) {
      navigate(createPageUrl('Login'));
    }
  }, [user, userLoading, navigate]);

  // Fetch guest registrations
  const { data: registrations, isLoading: regsLoading } = useQuery({
    queryKey: ['myRegistrations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const regs = await base44.entities.Registration.filter({ email: user.email });
        return regs || [];
      } catch (err) {
        console.error('Failed to fetch registrations', err);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  // Fetch guest tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['myTickets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const tix = await base44.entities.Ticket.filter({ guest_email: user.email });
        return tix || [];
      } catch (err) {
        console.error('Failed to fetch tickets', err);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Landing'));
  };

  if (userLoading) {
    return (
      <div style={{ background: '#070707', minHeight: '100vh' }} className="flex items-center justify-center">
        <div style={{ color: '#beff00' }}>Wird geladen...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#070707', minHeight: '100vh' }} className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ color: '#ffffff' }} className="text-4xl font-bold mb-2">
            Mein Konto
          </h1>
          <p style={{ color: '#888' }}>Willkommen, {user?.full_name || user?.email}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ background: '#3a1a1a' }}>
            <p style={{ color: '#ff6b6b' }} className="text-sm">{error}</p>
          </div>
        )}

        {/* User Info Card */}
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }} className="rounded-2xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg" style={{ background: '#1a1a1a' }}>
                <User className="w-6 h-6" style={{ color: '#beff00' }} />
              </div>
              <div>
                <p style={{ color: '#888' }} className="text-xs uppercase">Profil</p>
                <p style={{ color: '#ffffff' }} className="text-lg font-bold">
                  {user?.full_name || 'Gast'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-6" style={{ borderTop: '1px solid #1a1a1a' }}>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" style={{ color: '#888' }} />
              <div>
                <p style={{ color: '#888' }} className="text-xs">E-Mail</p>
                <p style={{ color: '#ffffff' }} className="text-sm">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4" style={{ color: '#888' }} />
              <div>
                <p style={{ color: '#888' }} className="text-xs">Mitglied seit</p>
                <p style={{ color: '#ffffff' }} className="text-sm">
                  {user?.created_date ? new Date(user.created_date).toLocaleDateString('de-DE') : '-'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{ color: '#beff00' }}
            className="mt-6 flex items-center gap-2 font-medium hover:underline"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>

        {/* Registrations */}
        <div className="mb-8">
          <h2 style={{ color: '#ffffff' }} className="text-2xl font-bold mb-4">
            Meine Registrierungen
          </h2>

          {regsLoading ? (
            <div style={{ color: '#888' }}>Wird geladen...</div>
          ) : registrations && registrations.length > 0 ? (
            <div className="grid gap-4">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
                  className="rounded-xl p-6"
                >
                  <p style={{ color: '#cccccc' }} className="font-medium">
                    {reg.first_name} {reg.last_name}
                  </p>
                  <p style={{ color: '#888' }} className="text-sm">
                    Kategorie: {reg.category || 'Standard'} • Status: {reg.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }} className="rounded-xl p-6">
              <p style={{ color: '#888' }}>Keine Registrierungen vorhanden</p>
            </div>
          )}
        </div>

        {/* Tickets */}
        <div>
          <h2 style={{ color: '#ffffff' }} className="text-2xl font-bold mb-4">
            Meine Tickets
          </h2>

          {ticketsLoading ? (
            <div style={{ color: '#888' }}>Wird geladen...</div>
          ) : tickets && tickets.length > 0 ? (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
                  className="rounded-xl p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p style={{ color: '#cccccc' }} className="font-medium">
                        {ticket.tier_name || 'Ticket'}
                      </p>
                      <p style={{ color: '#888' }} className="text-sm">
                        Code: {ticket.ticket_code}
                      </p>
                    </div>
                    <span
                      style={{
                        background: ticket.status === 'valid' ? '#1a3a1a' : '#1a1a1a',
                        color: ticket.status === 'valid' ? '#beff00' : '#888'
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {ticket.status === 'valid' ? 'Gültig' : ticket.status}
                    </span>
                  </div>
                  {ticket.pdf_url && (
                    <a
                      href={ticket.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#beff00' }}
                      className="text-sm font-medium hover:underline mt-3 inline-block"
                    >
                      Ticket-PDF herunterladen
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }} className="rounded-xl p-6">
              <p style={{ color: '#888' }}>Keine Tickets vorhanden</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}