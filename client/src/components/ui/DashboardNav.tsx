import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

interface NavItem {
  label: string;
  href: string;
}

export function DashboardNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isInstructor = user?.role === 'instructor';
  const isAdmin = user?.role === 'admin';

  const learnerNav: NavItem[] = [
    { label: 'My Learning', href: '/learner' },
    { label: 'My Courses', href: '/learner/my-courses' },
    { label: 'Achievements', href: '/learner/achievements' },
    { label: 'Explore Catalog', href: '/explore' },
  ];

  const instructorNav: NavItem[] = [
    { label: 'Dashboard', href: '/instructor' },
    { label: 'My Courses', href: '/instructor/courses' },
    { label: 'Reports', href: '/instructor/reports' },
    { label: 'Explore Site', href: '/explore' },
  ];

  const adminNav: NavItem[] = [
    { label: 'Overview', href: '/admin' },
    { label: 'Course Management', href: '/admin/courses' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Reports', href: '/admin/reports' },
    { label: 'Explore Site', href: '/explore' },
  ];

  const navItems = isAdmin ? adminNav : isInstructor ? instructorNav : learnerNav;

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Workspace Label */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-text-deep font-bold text-lg hover:text-primary transition-colors"
            >
              <span className="text-2xl" aria-hidden="true">🎓</span>
              <span>LearnSphere</span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-primary/20">
              {isAdmin ? 'Admin Console' : isInstructor ? 'Instructor Studio' : 'Learner Portal'}
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-muted hover:text-text-deep hover:bg-soft'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-text-deep leading-none">
                  {user?.displayName || user?.email}
                </div>
                <div className="text-[10px] text-text-muted capitalize mt-0.5">
                  {user?.role}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn-sm btn-secondary text-xs"
              type="button"
            >
              Sign out
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md hover:bg-soft text-text-muted hover:text-text-deep"
            type="button"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="md:hidden border-t border-border py-3 space-y-1">
            <div className="px-3 py-2 border-b border-border mb-2">
              <div className="font-semibold text-sm text-text-deep">{user?.displayName || user?.email}</div>
              <div className="text-xs text-text-muted capitalize">{user?.role}</div>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === item.href
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:text-text-deep hover:bg-soft'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error-soft rounded-md mt-2 font-medium"
              type="button"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
