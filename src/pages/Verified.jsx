import React, { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Verified() {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      setStatus('success');
      // Redirect after 2 seconds to built-in login
      setTimeout(() => {
        base44.auth.redirectToLogin();
      }, 2000);
    };

    verify();
  }, []);

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
            <h1 className="text-2xl font-bold text-white mb-4">🎉 E-Mail bestätigt!</h1>
            <p className="text-sm mb-8" style={{ color: '#888' }}>
              Dein Konto wurde erfolgreich aktiviert. Du wirst zur Anmeldung weitergeleitet…
            </p>
            <div className="flex justify-center mb-8">
              <CheckCircle2 className="w-12 h-12" style={{ color: '#beff00' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}