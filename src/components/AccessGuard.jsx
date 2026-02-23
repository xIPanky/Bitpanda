import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

/**
 * Access Guard Component
 * Protects routes based on user role and account_type
 * Redirects guests to landing page, admins to /admin
 */
export default function AccessGuard({ children, requiredRole = 'organizer' }) {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to built-in login
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    // Guest account - no backend access
    if (user.account_type === 'guest') {
      navigate(createPageUrl('Landing'));
      return;
    }

    // Admin routes - require role=admin
    if (requiredRole === 'admin' && user.role !== 'admin') {
      navigate(createPageUrl('Landing'));
      return;
    }

    // Organizer routes - require role=user AND account_type=organizer, or role=admin
    if (requiredRole === 'organizer') {
      const isOrganizerOrAdmin = (user.role === 'user' && user.account_type === 'organizer') || user.role === 'admin';
      if (!isOrganizerOrAdmin) {
        navigate(createPageUrl('Landing'));
        return;
      }
    }
  }, [user, isLoading, navigate, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070707' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#beff00' }} />
      </div>
    );
  }

  if (!user || user.account_type === 'guest') {
    return null;
  }

  return children;
}