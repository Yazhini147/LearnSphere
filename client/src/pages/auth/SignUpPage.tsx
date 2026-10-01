import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { ApiClientError } from '../../services/api-client';
import { PasswordField } from '../../components/ui/PasswordField';

interface FormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors extends Partial<Record<keyof FormData, string>> {
  general?: string;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export default function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.displayName.trim()) errs.displayName = 'Display name is required';
    else if (form.displayName.trim().length < 2) errs.displayName = 'Must be at least 2 characters';

    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';

    const pwErr = validatePassword(form.password);
    if (!form.password) errs.password = 'Password is required';
    else if (pwErr) errs.password = pwErr;

    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';

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
      await register(form.email, form.password, form.displayName);
      navigate('/learner', { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === 'CONFLICT') {
          setErrors({ email: 'An account with this email already exists' });
        } else if (err.status === 429) {
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

  function getPasswordStrength(pw: string): { label: string; color: string; pct: number } {
    if (!pw) return { label: '', color: '', pct: 0 };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
      { label: '', color: '', pct: 0 },
      { label: 'Weak', color: 'bg-error', pct: 25 },
      { label: 'Fair', color: 'bg-warning', pct: 50 },
      { label: 'Good', color: 'bg-info', pct: 75 },
      { label: 'Strong', color: 'bg-success', pct: 100 },
    ];
    return map[score] ?? map[0];
  }

  const strength = getPasswordStrength(form.password);

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
            Start learning<br />for free today.
          </h2>
          <p className="text-text-muted text-lg">
            Join thousands of learners discovering new skills every day.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: '✅', text: 'Free account, no credit card needed' },
            { icon: '🎯', text: 'Structured courses with real progress tracking' },
            { icon: '📜', text: 'Complete courses and earn achievements' },
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
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
              <span className="text-2xl">🎓</span>
              LearnSphere
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-deep mb-1">Create your account</h1>
            <p className="text-text-muted text-sm">
              Already have an account?{' '}
              <Link to="/sign-in" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {errors.general && (
            <div role="alert" className="mb-4 px-4 py-3 bg-error-soft border border-error rounded text-sm text-error">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="displayName" className="label">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                className={`input ${errors.displayName ? 'input-error' : ''}`}
                placeholder="Your full name or username"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                aria-describedby={errors.displayName ? 'displayName-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.displayName && (
                <p id="displayName-error" className="error-text" role="alert">{errors.displayName}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="label">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-describedby={errors.email ? 'reg-email-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p id="reg-email-error" className="error-text" role="alert">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="label">
                Password
              </label>
              <PasswordField
                id="reg-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={!!errors.password}
                ariaDescribedBy="pw-strength reg-password-error"
              />
              {form.password && (
                <div id="pw-strength" className="mt-2 space-y-1" aria-live="polite">
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${strength.color}`}
                      style={{ width: `${strength.pct}%` }}
                    />
                  </div>
                  {strength.label && (
                    <p className="text-xs text-text-muted">
                      Password strength: <span className="font-medium">{strength.label}</span>
                    </p>
                  )}
                </div>
              )}
              {errors.password && (
                <p id="reg-password-error" className="error-text" role="alert">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm password
              </label>
              <PasswordField
                id="confirmPassword"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repeat your password"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={!!errors.confirmPassword}
                ariaDescribedBy={errors.confirmPassword ? 'confirm-error' : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="error-text" role="alert">{errors.confirmPassword}</p>
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-text-muted text-center">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="underline hover:text-text-deep">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline hover:text-text-deep">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
