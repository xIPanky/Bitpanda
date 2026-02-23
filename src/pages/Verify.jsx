import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Verify() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, error
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setError('Der Bestätigungslink ist ungültig oder abgelaufen.');
        setStatus('error');
        return;
      }

      try {
        const response = await base44.functions.invoke('verifyEmail', { token });
        if (response.data?.success) {
          setTimeout(() => {
            navigate(createPageUrl('Verified'));
          }, 1000);
        } else {
          setError(response.data?.error || 'Bestätigung fehlgeschlagen');
          setStatus('error');
        }
      } catch (err) {
        setError(err.message || 'Der Bestätigungslink ist ungültig oder abgelaufen.');
        setStatus('error');
      }
    };

    verifyToken();
  }, [navigate]);

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
            <div className="flex justify-center mb-8">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#beff00' }} />
            </div>
            <p className="text-sm" style={{ color: '#888' }}>
              Bitte warten…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#ff6b6b' }} />
            <h1 className="text-2xl font-bold text-white mb-4">Bestätigung fehlgeschlagen</h1>
            <p className="text-sm mb-8" style={{ color: '#888' }}>
              {error}
            </p>
            <a
              href={createPageUrl('Landing')}
              className="inline-block px-6 py-3 rounded-lg font-bold text-sm transition-all"
              style={{
                background: '#beff00',
                color: '#070707',
                textDecoration: 'none',
              }}
            >
              Zur Startseite
            </a>
          </>
        )}
      </div>
    </div>
  );
}