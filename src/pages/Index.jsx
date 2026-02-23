import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (user?.role === 'admin') {
        window.location.href = createPageUrl('AdminDashboard');
      } else if (user?.role === 'organizer') {
        window.location.href = createPageUrl('Home');
      } else {
        window.location.href = createPageUrl('Landing');
      }
    }
  }, [user, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#070707' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#beff00' }} />
    </div>
  );
}