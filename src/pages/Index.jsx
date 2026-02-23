import React from 'react';
import { createPageUrl } from '@/utils';

export default function Index() {
  React.useEffect(() => {
    window.location.replace(createPageUrl('Home'));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#070707' }}>
      <p style={{ color: '#666' }}>Weiterleitung…</p>
    </div>
  );
}