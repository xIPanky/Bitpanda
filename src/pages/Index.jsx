import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Index() {
  const [redirectFailed, setRedirectFailed] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        console.log('User not authenticated (expected for public users)');
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      try {
        // Route based on user role and account_type
        if (user?.role === 'admin') {
          window.location.replace(createPageUrl('AdminDashboard'));
        } else if (user?.role === 'user' && user?.account_type === 'organizer') {
          window.location.replace(createPageUrl('Home'));
        } else {
          // Default to Landing for guests and unauthenticated users
          window.location.replace(createPageUrl('Landing'));
        }
      } catch (err) {
        console.error('Redirect failed:', err);
        setRedirectFailed(true);
      }
    }
  }, [user, isLoading]);

  // Fallback UI if redirect fails
  if (redirectFailed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4" style={{ background: '#070707' }}>
        <div className="text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#ff6b6b' }} />
          <h1 className="text-xl font-bold text-white mb-2">Weiterleitung fehlgeschlagen</h1>
          <p className="text-sm" style={{ color: '#888' }}>Bitte klicke unten auf den Button.</p>
        </div>
        <a
          href={createPageUrl('Landing')}
          className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{ 
            background: '#beff00', 
            color: '#070707',
            textDecoration: 'none',
            display: 'inline-block'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 24px rgba(190,255,0,0.4)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          Zur Landingpage
        </a>
      </div>
    );
  }

  // Loading state during redirect
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: '#070707' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#beff00' }} />
      <p className="text-sm" style={{ color: '#666' }}>Weiterleitung…</p>
    </div>
  );
}