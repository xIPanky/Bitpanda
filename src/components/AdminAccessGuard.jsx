import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function AdminAccessGuard({ children }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      window.location.href = createPageUrl('Landing');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070707' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#beff00' }} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070707' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p style={{ color: '#999' }}>Du hast keine Admin-Berechtigung.</p>
        </div>
      </div>
    );
  }

  return children;
}