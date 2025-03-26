import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedUserTypes?: ('seller' | 'collector' | 'both')[];
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedUserTypes
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Redirect to login if authentication is required but user is not logged in
        router.push('/auth/signin');
      } else if (user && allowedUserTypes && !allowedUserTypes.includes(user.user_type!)) {
        // Redirect to home if user type is not allowed
        router.push('/');
      }
    }
  }, [loading, requireAuth, router, user, allowedUserTypes]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If authentication is required and user is not logged in, don't render children
  if (requireAuth && !user) {
    return null;
  }

  // If user type is restricted and current user's type is not allowed, don't render children
  if (user && allowedUserTypes && !allowedUserTypes.includes(user.user_type!)) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
} 