import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2, AlertCircle } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Redirect to built-in login page
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      await base44.functions.invoke('resendVerificationEmail', { email });
      setError('');
      setUnverifiedEmail(false);
      setTimeout(() => {
        setResendingEmail(false);
      }, 1000);
    } catch (err) {
      console.error('RESEND_ERROR', err);
      setError('Fehler beim Versenden der E-Mail');
      setResendingEmail(false);
    }
  };

  return (
    <div style={{ background: '#070707', minHeight: '100vh' }} className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg" style={{ background: '#beff00' }}>
            <span style={{ color: '#070707' }} className="font-bold text-lg">⚡</span>
          </div>
          <h1 style={{ color: '#ffffff' }} className="mt-4 text-3xl font-bold">Anmelden</h1>
          <p style={{ color: '#888' }} className="mt-2 text-sm">Melde dich bei deinem Konto an</p>
        </div>

        {/* Form */}
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }} className="rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ background: '#3a1a1a' }}>
              <AlertCircle className="w-5 h-5 mt-0.5 text-red-500" />
              <div>
                <p className="font-medium text-red-500">Fehler</p>
                <p style={{ color: '#888' }} className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {unverifiedEmail && (
            <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ background: '#1a3a1a' }}>
              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: '#ffc800' }} />
              <div>
                <p style={{ color: '#ffc800' }} className="font-medium text-sm">E-Mail-Bestätigung erforderlich</p>
                <p style={{ color: '#888' }} className="text-xs mt-1">Bitte bestätige zuerst deine E-Mail über den Link in deiner Bestätigungs-Mail.</p>
              </div>
            </div>
          )}

          {!unverifiedEmail ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label style={{ color: '#888' }} className="text-sm font-medium block mb-2">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  disabled={loading}
                  style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
                  className="w-full px-4 py-2.5 rounded-xl border text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ color: '#888' }} className="text-sm font-medium block mb-2">
                  Passwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dein Passwort"
                  disabled={loading}
                  style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
                  className="w-full px-4 py-2.5 rounded-xl border text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all disabled:opacity-50"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{ background: '#beff00' }}
                className="w-full py-2.5 rounded-xl font-bold text-black text-sm uppercase tracking-wide transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Wird angemeldet...' : 'Anmelden'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={resendingEmail}
                style={{ background: '#beff00' }}
                className="w-full py-2.5 rounded-xl font-bold text-black text-sm uppercase tracking-wide transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resendingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
                {resendingEmail ? 'Wird versendet...' : 'Bestätigungs-Mail erneut senden'}
              </button>
            </div>
          )}

          {/* Link to Register */}
          <div className="mt-8 pt-8" style={{ borderTop: '1px solid #1a1a1a' }}>
            <p style={{ color: '#666' }} className="text-center text-sm mb-4">
              Du hast noch keinen Account?
            </p>
            <a
              href={createPageUrl('Register')}
              style={{
                background: 'rgba(190, 255, 0, 0.1)',
                color: '#beff00',
                border: '1px solid #beff00'
              }}
              className="block w-full px-4 py-2.5 rounded-xl font-bold text-sm text-center transition-all hover:bg-yellow-400 hover:text-black"
            >
              Jetzt registrieren
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}