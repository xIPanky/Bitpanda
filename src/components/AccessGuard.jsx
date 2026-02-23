import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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

    // Not authenticated
    if (!user) {
      navigate('/');
      return;
    }

    // Guest account - no backend access
    if (user.account_type === 'guest') {
      navigate('/');
      return;
    }

    // Admin accessing organizer-only routes
    if (requiredRole === 'organizer' && user.role === 'admin') {
      navigate('/admin');
      return;
    }

    // Organizer accessing admin routes
    if (requiredRole === 'admin' && user.role !== 'admin') {
      navigate('/');
      return;
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