import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { ApiClientError } from '../../services/api-client';
import { PasswordField } from '../../components/ui/PasswordField';

export default function SignInPage() {
  const { login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';
  const isExpired = sessionExpired || searchParams.get('expired') === 'true';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<typeof form & { general: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errs: typeof errors = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const loggedInUser = await login(form.email, form.password);
      if (redirectTo && redirectTo !== '/dashboard') {
        const safe = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
        navigate(safe, { replace: true });
      } else {
        const roleMap: Record<string, string> = {
          admin: '/admin',
          instructor: '/instructor',
          learner: '/learner',
        };
        navigate(roleMap[loggedInUser.role] || '/learner', { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 429) {
          setErrors({ general: 'Too many attempts. Please wait a few minutes.' });
        } else {
          setErrors({ general: err.message });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-soft flex-col justify-between p-12">
        <div>
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
            <span className="text-2xl">🎓</span>
            LearnSphere
          </Link>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-text-deep mb-4 leading-snug">
            Continue your<br />learning journey.
          </h2>
          <p className="text-text-muted text-lg">
            Thousands of courses, structured progress, real achievement.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: '📚', text: 'Access all enrolled courses instantly' },
            { icon: '📊', text: 'Track your progress and streaks' },
            { icon: '🏆', text: 'Earn points and achievements' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="text-lg" aria-hidden="true">{item.icon}</span>
              <span className="text-sm text-text-muted">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
              <span className="text-2xl">🎓</span>
              LearnSphere
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-deep mb-1">Sign in</h1>
            <p className="text-text-muted text-sm">
              Don't have an account?{' '}
              <Link to="/sign-up" className="text-primary font-medium hover:underline">
                Create one free
              </Link>
            </p>
          </div>

          {isExpired && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 bg-amber-50 border border-amber-300 rounded-md text-sm text-amber-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4 shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {errors.general && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 bg-error-soft border border-error rounded text-sm text-error"
            >
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p id="email-error" className="error-text" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <PasswordField
                id="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Your password"
                autoComplete="current-password"
                disabled={isSubmitting}
                error={!!errors.password}
                ariaDescribedBy={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="error-text" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-lg btn-primary w-full"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-text-muted text-center">
            By continuing you agree to our{' '}
            <Link to="/terms" className="underline hover:text-text-deep">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline hover:text-text-deep">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
