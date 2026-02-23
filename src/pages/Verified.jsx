import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function Verified() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');

        if (!userId) {
          setError('Ungültiger Verifikationslink');
          setLoading(false);
          return;
        }

        console.log('VERIFIED_START userId=', userId);
        const response = await base44.functions.invoke('verifyEmail', { userId });

        if (response.data?.success) {
          console.log('VERIFIED_SUCCESS');
          setSuccess(true);
          setTimeout(() => {
            navigate(createPageUrl('Login'));
          }, 2000);
        } else {
          setError(response.data?.error || 'Verifikation fehlgeschlagen');
        }
      } catch (err) {
        console.error('VERIFIED_ERROR', err.message);
        setError(err.message || 'Ein Fehler ist aufgetreten');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div style={{ background: '#070707', minHeight: '100vh' }} className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="mb-8 text-center">
          {loading ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: '#1a1a1a' }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#beff00' }} />
            </div>
          ) : success ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: '#1a3a1a' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: '#beff00' }} />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: '#3a1a1a' }}>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          )}

          <h1 style={{ color: '#ffffff' }} className="mt-6 text-3xl font-bold">
            {loading ? 'Wird veryfiziert...' : success ? 'E-Mail bestätigt!' : 'Fehler'}
          </h1>
          <p style={{ color: '#888' }} className="mt-2 text-sm">
            {loading
              ? 'Deine E-Mail wird gerade bestätigt...'
              : success
              ? 'Deine E-Mail wurde erfolgreich bestätigt. Du kannst dich jetzt anmelden.'
              : error}
          </p>
        </div>

        {/* Card */}
        {!loading && (
          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }} className="rounded-2xl p-8">
            {success ? (
              <>
                <p style={{ color: '#cccccc' }} className="text-center text-sm mb-6">
                  Du wirst in Kürze zur Anmeldung weitergeleitet...
                </p>
                <button
                  onClick={() => navigate(createPageUrl('Login'))}
                  style={{ background: '#beff00', color: '#070707' }}
                  className="w-full py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide hover:brightness-110"
                >
                  Jetzt anmelden
                </button>
              </>
            ) : (
              <>
                <p style={{ color: '#cccccc' }} className="text-center text-sm mb-6">
                  {error}
                </p>
                <button
                  onClick={() => navigate(createPageUrl('Verify'))}
                  style={{ background: '#beff00', color: '#070707' }}
                  className="w-full py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide hover:brightness-110"
                >
                  Zurück zu Bestätigung
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}