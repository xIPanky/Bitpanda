import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Verified() {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const email = urlParams.get('email');
  const type = urlParams.get('type');

  useEffect(() => {
    const verify = async () => {
      if (!token || !email) {
        setStatus('error');
        setError('Ungültiger Verifikationslink');
        return;
      }

      try {
        // Call backend function to verify email
        const result = await base44.functions.invoke('verifyEmail', {
          user_id: token,
          email: email,
          type: type
        });

        setStatus('success');
        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.replace(createPageUrl('Login'));
        }, 3000);
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setError(err.response?.data?.error || 'Fehler bei der Verifikation');
      }
    };

    verify();
  }, [token, email, type]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#070707' }}>
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#beff00' }}>
            <span className="text-black font-bold text-lg">⚡</span>
          </div>
          <div className="text-left">
            <p className="font-bold text-white">Synergy</p>
            <p className="text-xs" style={{ color: '#666' }}>Ticketing Platform</p>
          </div>
        </div>

        {status === 'verifying' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-4">E-Mail wird bestätigt</h1>
            <p className="text-sm mb-8" style={{ color: '#888' }}>Bitte warte einen Moment…</p>
            <div className="flex justify-center mb-8">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#beff00' }} />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-4">E-Mail bestätigt!</h1>
            <p className="text-sm mb-8" style={{ color: '#888' }}>
              Dein Konto wurde erfolgreich aktiviert. Du wirst in Kürze weitergeleitet…
            </p>
            <div className="flex justify-center mb-8">
              <CheckCircle2 className="w-12 h-12" style={{ color: '#beff00' }} />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-4">Fehler bei der Bestätigung</h1>
            <p className="text-sm mb-8" style={{ color: '#ff6b6b' }}>{error}</p>
            <div className="flex justify-center mb-8">
              <AlertCircle className="w-12 h-12" style={{ color: '#ff6b6b' }} />
            </div>
            <a
              href={createPageUrl('Login')}
              className="inline-block px-6 py-3 rounded-lg font-bold text-sm transition-all"
              style={{
                background: '#beff00',
                color: '#070707',
                textDecoration: 'none',
              }}
            >
              Zur Anmeldung
            </a>
          </>
        )}
      </div>
    </div>
  );
}