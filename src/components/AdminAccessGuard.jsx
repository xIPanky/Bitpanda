import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Admin Access Guard Component
 * Protects routes that require admin role
 */
export default function AdminAccessGuard({ children }) {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!user) {
      navigate(createPageUrl('Login'));
      return;
    }

    // Not admin - redirect to landing
    if (user.role !== 'admin') {
      navigate(createPageUrl('Landing'));
      return;
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070707' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#beff00' }} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return children;
}