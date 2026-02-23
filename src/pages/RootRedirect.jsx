import React, { useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

/**
 * Root Redirect Page
 * Handles "/" route and redirects to "/home"
 */
export default function RootRedirect() {
  useEffect(() => {
    // Redirect to home page
    window.location.replace(createPageUrl('Home'));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-4" style={{ background: '#070707' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#beff00' }} />
      <p className="text-sm" style={{ color: '#666' }}>Weiterleitung…</p>
    </div>
  );
}