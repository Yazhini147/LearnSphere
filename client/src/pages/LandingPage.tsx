import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { PublicNavbar } from '../components/ui/PublicNavbar';
import { CourseCard } from '../components/courses/CourseCard';
import { courseApi, type CourseListItem } from '../services/course.service';

const FEATURES = [
  {
    icon: '📚',
    title: 'Structured Learning',
    desc: 'Follow carefully ordered lessons across video, documents, and interactive quizzes.',
  },
  {
    icon: '📊',
    title: 'Real Progress Tracking',
    desc: 'Every lesson you complete is saved. Resume exactly where you left off.',
  },
  {
    icon: '🏆',
    title: 'Earn as You Learn',
    desc: 'Collect points, unlock achievements, and maintain daily learning streaks.',
  },
  {
    icon: '🎯',
    title: 'Quizzes & Assessment',
    desc: 'Test your understanding with scored quizzes and review your answers.',
  },
  {
    icon: '👩‍🏫',
    title: 'Expert Instructors',
    desc: 'Learn from instructors who manage their own course content and track learner progress.',
  },
  {
    icon: '📱',
    title: 'Learn Anywhere',
    desc: 'Fully responsive design so you can learn on desktop, tablet, or mobile.',
  },
];

const LEVELS = [
  { label: 'Beginner', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: 'No prior experience needed' },
  { label: 'Intermediate', color: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'Some familiarity expected' },
  { label: 'Advanced', color: 'bg-purple-50 text-purple-700 border-purple-200', desc: 'Deep dive for experienced learners' },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState<CourseListItem[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    courseApi
      .getCourses({ pageSize: 3, sortBy: 'popular' })
      .then((res) => setFeaturedCourses(res.data))
      .catch(() => {})
      .finally(() => setIsLoadingCourses(false));
  }, []);

  const ctaHref = isAuthenticated
    ? user?.role === 'admin' ? '/admin' : user?.role === 'instructor' ? '/instructor' : '/learner'
    : '/sign-up';
  const ctaLabel = isAuthenticated ? 'Go to dashboard' : 'Start learning — it\'s free';

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* ---- Hero ---- */}
      <section className="page-container py-20 sm:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary-soft text-primary text-xs font-semibold rounded-full mb-6 border border-primary/20">
            <span aria-hidden="true">🎓</span>
            Production-Grade Educational Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-deep leading-[1.15] mb-6 tracking-tight">
            Master software skills with<br />
            <span className="text-primary">verifiable engineering depth</span>.
          </h1>
          <p className="text-lg text-text-muted mb-8 max-w-xl leading-relaxed">
            Real PostgreSQL persistence, structured curriculum, instant quiz validation, and transparent progress tracking built from the ground up.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to={ctaHref} className="btn-lg btn-primary">
              {ctaLabel}
            </Link>
            <Link to="/explore" className="btn-lg btn-secondary">
              Browse course catalog →
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-text-muted">
            <span className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Free enrollment</span>
            <span className="flex items-center gap-2"><span className="text-success font-bold">✓</span> No credit card required</span>
            <span className="flex items-center gap-2"><span className="text-success font-bold">✓</span> Real interactive player</span>
          </div>
        </div>
      </section>

      {/* ---- Featured Courses Section ---- */}
      <section className="border-t border-border bg-surface py-16 sm:py-20">
        <div className="page-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                Featured Curriculum
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-deep">
                Top Rated Courses
              </h2>
            </div>
            <Link to="/explore" className="text-sm font-semibold text-primary hover:underline">
              View all courses ({featuredCourses.length > 0 ? '6 available' : '→'})
            </Link>
          </div>

          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface rounded-xl border border-border h-80 animate-pulse p-4 flex flex-col justify-between">
                  <div className="bg-soft h-40 rounded-lg mb-4" />
                  <div className="space-y-2">
                    <div className="bg-soft h-4 w-3/4 rounded" />
                    <div className="bg-soft h-3 w-1/2 rounded" />
                  </div>
                  <div className="bg-soft h-6 w-1/3 rounded mt-4" />
                </div>
              ))}
            </div>
          ) : featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ---- What you get ---- */}
      <section className="border-t border-border bg-soft">
        <div className="page-container py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-deep mb-3">
              Everything you need to learn effectively
            </h2>
            <p className="text-text-muted max-w-lg mx-auto">
              A focused platform built for real learning — with real progress and authentic challenges.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-surface rounded-xl border border-border p-6 hover:shadow-md transition-shadow duration-200">
                <div className="text-3xl mb-4" aria-hidden="true">{f.icon}</div>
                <h3 className="text-base font-bold text-text-deep mb-2">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Course levels ---- */}
      <section className="page-container py-16 sm:py-20">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-deep mb-3">
            Courses for every level
          </h2>
          <p className="text-text-muted">
            Whether you're just starting out or looking to deepen expertise, there's a curated path for you.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {LEVELS.map((l) => (
            <div key={l.label} className="bg-surface rounded-xl border border-border p-6 text-center hover:border-primary/50 transition-colors">
              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border mb-3 capitalize ${l.color}`}>
                {l.label}
              </span>
              <p className="text-sm text-text-muted">{l.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- CTA banner ---- */}
      <section className="bg-primary text-white">
        <div className="page-container py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
            Ready to start learning?
          </h2>
          <p className="text-primary-soft text-lg mb-8 max-w-xl mx-auto">
            Join LearnSphere today and take the first step toward mastering production software engineering.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={ctaHref} className="btn-lg bg-white text-primary hover:bg-white/90 font-semibold shadow-md">
              {ctaLabel}
            </Link>
            <Link to="/explore" className="btn-lg border-2 border-white text-white hover:bg-white/10 font-semibold">
              Explore all courses
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border bg-surface">
        <div className="page-container py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-text-deep font-bold text-base">
              <span aria-hidden="true">🎓</span>
              LearnSphere
            </div>
            <nav className="flex gap-6 text-sm text-text-muted" aria-label="Footer navigation">
              <Link to="/explore" className="hover:text-text-deep transition-colors">Explore</Link>
              <Link to="/privacy" className="hover:text-text-deep transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-text-deep transition-colors">Terms</Link>
            </nav>
            <p className="text-xs text-text-muted">
              © {new Date().getFullYear()} LearnSphere. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
