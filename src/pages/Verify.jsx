import React, { useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Verify() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const [status, setStatus] = React.useState('waiting'); // waiting, success, error

  useEffect(() => {
    // Check if verification was successful
    const timer = setTimeout(() => {
      // User should be on this page after signup, waiting for email click
      // When they click email link, they go to /verified
    }, 1000);

    return () => clearTimeout(timer);
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

        <h1 className="text-2xl font-bold text-white mb-4">E-Mail-Bestätigung</h1>
        <p className="text-sm mb-8" style={{ color: '#888' }}>
          Wir haben einen Bestätigungslink an <strong style={{ color: '#beff00' }}>{email}</strong> gesendet.
        </p>

        {/* Animation */}
        <div className="flex justify-center mb-8">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#beff00' }} />
        </div>

        <p className="text-sm mb-6" style={{ color: '#888' }}>
          Klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.
        </p>

        {/* Back to landing */}
        <a
          href={createPageUrl('Landing')}
          className="inline-block px-6 py-3 rounded-lg font-bold text-sm transition-all"
          style={{
            background: 'rgba(190, 255, 0, 0.1)',
            color: '#beff00',
            border: '1px solid #beff00',
            textDecoration: 'none',
          }}
        >
          Zur Startseite
        </a>
      </div>
    </div>
  );
}