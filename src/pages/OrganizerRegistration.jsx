import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Zap, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OrganizerRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    company: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    if (!formData.email || !formData.full_name || !formData.password) {
      toast.error('Bitte fülle alle erforderlichen Felder aus');
      setLoading(false);
      return;
    }

    try {
      const response = await base44.functions.invoke('registerOrganizer', {
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        company: formData.company,
      });

      if (response.data?.success) {
        toast.success('Bestätigungs-E-Mail versendet!');
        sessionStorage.setItem('signupEmail', formData.email);
        sessionStorage.setItem('signupType', 'organizer');
        sessionStorage.setItem('signupFullName', formData.full_name);
        setTimeout(() => navigate(createPageUrl('Landing')), 1500);
      } else {
        toast.error(response.data?.error || 'Registrierung fehlgeschlagen');
        setLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registrierung fehlgeschlagen');
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#070707', minHeight: '100vh' }} className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#beff00' }}>
            <Zap className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-lg text-white tracking-widest uppercase">Synergy</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8 mb-6" style={{ background: '#0a0a0a', border: '1px solid #1e1e1e' }}>
          <h1 className="text-2xl font-black text-white mb-2">Veranstalter Account</h1>
          <p className="text-gray-400 text-sm mb-6">Registriere dich als Veranstalter und verkaufe deine Tickets professionell.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border text-white"
                style={{ background: '#111', border: '1px solid #1e1e1e' }}
                placeholder="Dein Name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">E-Mail</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border text-white"
                style={{ background: '#111', border: '1px solid #1e1e1e' }}
                placeholder="deine@email.de"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Passwort</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border text-white"
                style={{ background: '#111', border: '1px solid #1e1e1e' }}
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Mindestens 8 Zeichen</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Unternehmen / Event-Name (optional)</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border text-white"
                style={{ background: '#111', border: '1px solid #1e1e1e' }}
                placeholder="z.B. SYN Club"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all"
              style={{ background: '#beff00', color: '#070707' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrierung läuft...
                </>
              ) : (
                <>
                  Veranstalter-Account erstellen
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 pt-8 text-center" style={{ borderTop: '1px solid #1a1a1a' }}>
          <p style={{ color: '#666' }} className="text-sm mb-4">
            Du hast bereits einen Account?
          </p>
          <a
            href={createPageUrl('SignIn')}
            style={{
              background: 'rgba(190, 255, 0, 0.1)',
              color: '#beff00',
              border: '1px solid #beff00'
            }}
            className="inline-block px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-yellow-400 hover:text-black"
          >
            Jetzt anmelden
          </a>
        </div>
      </div>
    </div>
  );
}