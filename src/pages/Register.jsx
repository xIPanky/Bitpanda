import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!email || !password || !passwordConfirm) {
      setError('Alle Felder erforderlich');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Ungültige E-Mail-Adresse');
      return;
    }

    setLoading(true);
    try {
      console.log('SIGNUP_FORM_SUBMIT email=', email);
      const response = await base44.functions.invoke('registerGuest', { email, password });
      
      console.log('SIGNUP_RESPONSE', response.data);
      
      if (response.data?.success) {
        console.log('SIGNUP_SUCCESS email=', email);
        setSuccess(true);
        // Store email in sessionStorage for verify page
        sessionStorage.setItem('signupEmail', email);
        sessionStorage.setItem('signupType', 'guest');
        setTimeout(() => {
          navigate(createPageUrl('Landing'));
        }, 1500);
      } else {
        const errorMsg = response.data?.error || 'Registrierung fehlgeschlagen';
        console.error('SIGNUP_FAILED error=', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('SIGNUP_ERROR', err);
      const errorMsg = err.response?.data?.error || err.message || 'Ein Fehler ist aufgetreten';
      console.error('SIGNUP_ERROR_FINAL=', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
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
          <h1 style={{ color: '#ffffff' }} className="mt-4 text-3xl font-bold">Registrieren</h1>
          <p style={{ color: '#888' }} className="mt-2 text-sm">Erstelle ein Gast-Konto</p>
        </div>

        {/* Form */}
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }} className="rounded-2xl p-8">
          {success && (
            <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ background: '#1a3a1a' }}>
              <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: '#beff00' }} />
              <div>
                <p style={{ color: '#beff00' }} className="font-medium">Erfolg!</p>
                <p style={{ color: '#888' }} className="text-sm">Bestätigungs-E-Mail versendet...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ background: '#3a1a1a' }}>
              <AlertCircle className="w-5 h-5 mt-0.5 text-red-500" />
              <div>
                <p className="font-medium text-red-500">Fehler</p>
                <p style={{ color: '#888' }} className="text-sm">{error}</p>
              </div>
            </div>
          )}

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
                placeholder="Mindestens 8 Zeichen"
                disabled={loading}
                style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
                className="w-full px-4 py-2.5 rounded-xl border text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all disabled:opacity-50"
              />
            </div>

            {/* Password Confirm */}
            <div>
              <label style={{ color: '#888' }} className="text-sm font-medium block mb-2">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Passwort erneut eingeben"
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
              {loading ? 'Wird erstellt...' : 'Konto erstellen'}
            </button>
          </form>

          {/* Link to Login */}
          <p style={{ color: '#666' }} className="text-center text-sm mt-6">
            Hast du schon ein Konto?{' '}
            <a href={createPageUrl('Login')} style={{ color: '#beff00' }} className="font-medium hover:underline">
              Anmelden
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}