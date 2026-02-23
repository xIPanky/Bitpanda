import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Mail, Loader2, AlertCircle } from 'lucide-react';

export default function Verify() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem('signupEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      setError('E-Mail erforderlich');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('resendVerificationEmail', { email });
      if (response.data?.success) {
        setSuccess(true);
        setResendCooldown(30);
        let countdown = 30;
        const interval = setInterval(() => {
          countdown--;
          setResendCooldown(countdown);
          if (countdown <= 0) clearInterval(interval);
        }, 1000);
      } else {
        setError(response.data?.error || 'Fehler beim Versenden');
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Versenden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#070707', minHeight: '100vh' }} className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: '#1a3a1a' }}>
            <Mail className="w-8 h-8" style={{ color: '#beff00' }} />
          </div>

          <h1 style={{ color: '#ffffff' }} className="mt-6 text-3xl font-bold">Überprüfe deine E-Mail</h1>
          <p style={{ color: '#888' }} className="mt-2 text-sm">
            Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte überprüfe deinen Posteingang.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }} className="rounded-2xl p-8 space-y-6">
          {/* Step Message */}
          <div className="text-center">
            <p style={{ color: '#cccccc' }} className="text-sm leading-relaxed">
              Klicke auf den Link in der E-Mail, um deine E-Mail-Adresse zu bestätigen. Danach kannst du dich anmelden.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="p-4 rounded-lg" style={{ background: '#1a3a1a' }}>
              <p style={{ color: '#beff00' }} className="text-sm font-medium">
                ✓ E-Mail erneut versendet
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: '#3a1a1a' }}>
              <AlertCircle className="w-5 h-5 mt-0.5 text-red-500" />
              <p style={{ color: '#ff6b6b' }} className="text-sm">{error}</p>
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResendEmail}
            disabled={loading || resendCooldown > 0}
            style={{
              background: resendCooldown > 0 ? '#1a1a1a' : '#beff00',
              color: resendCooldown > 0 ? '#666' : '#070707'
            }}
            className="w-full py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {resendCooldown > 0
              ? `Erneut in ${resendCooldown}s`
              : 'E-Mail erneut versendet'}
          </button>

          {/* Help Text */}
          <div className="p-4 rounded-lg" style={{ background: '#111111', borderColor: '#1e1e1e', border: '1px solid' }}>
            <p style={{ color: '#888' }} className="text-xs leading-relaxed">
              <strong style={{ color: '#beff00' }}>Tipp:</strong> Überprüfe auch deinen Spam-Ordner, falls du die E-Mail nicht siehst.
            </p>
          </div>

          {/* Login Link */}
          <div className="text-center pt-4" style={{ borderTop: '1px solid #1a1a1a' }}>
            <p style={{ color: '#666' }} className="text-sm">
              Hast du bereits bestätigt?{' '}
              <Link to={createPageUrl('Login')} style={{ color: '#beff00' }} className="font-medium hover:underline">
                Anmelden
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}