import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

/**
 * Frontend route guard — UX layer only.
 * Server authorization is the actual security boundary.
 *
 * - Unauthenticated → redirect to /sign-in with ?redirect= param
 * - Authenticated but wrong role → render UnauthorizedPage
 */
export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/sign-in',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`${redirectTo}?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return <UnauthorizedPage requiredRoles={roles} userRole={user.role} />;
    }
  }

  return <>{children}</>;
}

// ---- Unauthorized page rendered for wrong-role access ----

function UnauthorizedPage({
  requiredRoles,
  userRole,
}: {
  requiredRoles: UserRole[];
  userRole: UserRole;
}) {
  const roleLinks: Record<UserRole, string> = {
    learner: '/learner',
    instructor: '/instructor',
    admin: '/admin',
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-text-deep mb-2">Access Restricted</h1>
        <p className="text-text-muted mb-2">
          This area requires {requiredRoles.join(' or ')} access.
        </p>
        <p className="text-text-muted text-sm mb-6">
          You are signed in as a <span className="font-medium capitalize">{userRole}</span>.
        </p>
        <a
          href={roleLinks[userRole]}
          className="btn-md btn-primary"
        >
          Go to my dashboard
        </a>
      </div>
    </div>
  );
}
