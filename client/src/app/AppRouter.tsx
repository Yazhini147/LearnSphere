import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { PageLoader } from '../components/feedback/PageLoader';

// ---- Lazy-loaded pages ----
// Public
const LandingPage = lazy(() => import('../pages/LandingPage'));
const SignInPage = lazy(() => import('../pages/auth/SignInPage'));
const SignUpPage = lazy(() => import('../pages/auth/SignUpPage'));
const ExplorePage = lazy(() => import('../pages/ExplorePage'));
const CourseDetailPage = lazy(() => import('../pages/CourseDetailPage'));

// Learner
const LearnerDashboard = lazy(() => import('../pages/learner/LearnerDashboard'));
const MyCoursesPage = lazy(() => import('../pages/learner/MyCoursesPage'));
const LearningPlayerPage = lazy(() => import('../pages/learner/LearningPlayerPage'));
const AchievementsPage = lazy(() => import('../pages/learner/AchievementsPage'));
const ProfilePage = lazy(() => import('../pages/learner/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/learner/SettingsPage'));

// Instructor
const InstructorDashboard = lazy(() => import('../pages/instructor/InstructorDashboard'));
const InstructorCoursesPage = lazy(() => import('../pages/instructor/InstructorCoursesPage'));
const CourseEditorPage = lazy(() => import('../pages/instructor/CourseEditorPage'));
const InstructorReportsPage = lazy(() => import('../pages/instructor/InstructorReportsPage'));
const InstructorSettingsPage = lazy(() => import('../pages/instructor/InstructorSettingsPage'));

// Admin
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminCoursesPage = lazy(() => import('../pages/admin/AdminCoursesPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));

// Static
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ---- Public ---- */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* ---- Dashboard redirect ---- */}
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* ---- Learner ---- */}
            <Route
              path="/learner"
              element={
                <ProtectedRoute requiredRole="learner">
                  <LearnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learner/my-courses"
              element={
                <ProtectedRoute requiredRole="learner">
                  <MyCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learner/courses/:courseId/learn"
              element={
                <ProtectedRoute requiredRole="learner">
                  <LearningPlayerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learner/achievements"
              element={
                <ProtectedRoute requiredRole="learner">
                  <AchievementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learner/profile"
              element={
                <ProtectedRoute requiredRole="learner">
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learner/settings"
              element={
                <ProtectedRoute requiredRole="learner">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* ---- Instructor ---- */}
            <Route
              path="/instructor"
              element={
                <ProtectedRoute requiredRole={['instructor', 'admin']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/courses"
              element={
                <ProtectedRoute requiredRole={['instructor', 'admin']}>
                  <InstructorCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/courses/:courseId/edit"
              element={
                <ProtectedRoute requiredRole={['instructor', 'admin']}>
                  <CourseEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/reports"
              element={
                <ProtectedRoute requiredRole={['instructor', 'admin']}>
                  <InstructorReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/settings"
              element={
                <ProtectedRoute requiredRole={['instructor', 'admin']}>
                  <InstructorSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* ---- Admin ---- */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* ---- 404 ---- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Role-aware dashboard redirect — must be inside AuthProvider so it can use useAuth
function DashboardRedirect() {
  return <DashboardRedirectInner />;
}

function DashboardRedirectInner() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/sign-in" replace />;

  const roleMap: Record<string, string> = {
    admin: '/admin',
    instructor: '/instructor',
    learner: '/learner',
  };

  return <Navigate to={roleMap[user.role] ?? '/learner'} replace />;
}
