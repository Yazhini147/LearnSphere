import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

export function PublicNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  function getDashboardLink() {
    if (!user) return '/sign-in';
    const map: Record<string, string> = {
      admin: '/admin',
      instructor: '/instructor',
      learner: '/learner',
    };
    return map[user.role] ?? '/learner';
  }

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-40">
      <div className="page-container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-text-deep font-bold text-lg hover:text-primary transition-colors"
          >
            <span className="text-xl" aria-hidden="true">🎓</span>
            <span>LearnSphere</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <Link
              to="/explore"
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text-deep hover:bg-soft rounded transition-colors"
            >
              Explore
            </Link>
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="btn-sm btn-ghost"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-sm btn-secondary"
                  type="button"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="btn-sm btn-ghost">
                  Sign in
                </Link>
                <Link to="/sign-up" className="btn-sm btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded hover:bg-soft transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav
            className="md:hidden border-t border-border py-3 space-y-1 animate-fade-in"
            aria-label="Mobile navigation"
          >
            <Link
              to="/explore"
              className="block px-3 py-2 text-sm text-text-muted hover:text-text-deep hover:bg-soft rounded"
              onClick={() => setMobileOpen(false)}
            >
              Explore
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="block px-3 py-2 text-sm text-primary font-medium hover:bg-primary-soft rounded"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="block w-full text-left px-3 py-2 text-sm text-text-muted hover:text-text-deep hover:bg-soft rounded"
                  type="button"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="block px-3 py-2 text-sm text-text-muted hover:text-text-deep hover:bg-soft rounded"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="block px-3 py-2 text-sm text-primary font-medium hover:bg-primary-soft rounded"
                  onClick={() => setMobileOpen(false)}
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
