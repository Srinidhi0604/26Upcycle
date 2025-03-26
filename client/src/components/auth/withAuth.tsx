import { ComponentType } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

interface WithAuthOptions {
  requireAuth?: boolean;
  allowedUserTypes?: ('seller' | 'collector' | 'both')[];
}

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = { requireAuth: true }
) {
  return function WithAuthComponent(props: P) {
    return (
      <ProtectedRoute requireAuth={options.requireAuth} allowedUserTypes={options.allowedUserTypes}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
} 