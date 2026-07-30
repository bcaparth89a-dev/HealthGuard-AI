import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import useAuth from '../hooks/useAuth';

// Lazy loading features pages to minimize initial bundle loading
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const SymptomCheckerPage = lazy(() => import('../features/symptom-checker/SymptomCheckerPage'));
const MlPredictorPage = lazy(() => import('../features/ml-predictor/MlPredictorPage'));
const MedicalRecordsPage = lazy(() => import('../features/medical-records/MedicalRecordsPage'));
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const HealthAssessmentPage = lazy(() => import('../features/health-assessment/HealthAssessmentPage'));
const PatientRecordsPage = lazy(() => import('../features/patient-records/PatientRecordsPage'));
const PatientProfilePage = lazy(() => import('../features/patient-records/PatientProfilePage'));
const MedicalReportsPage = lazy(() => import('../features/patient-records/MedicalReportsPage'));
const AnalyticsPage = lazy(() => import('../features/patient-records/AnalyticsPage'));
const SettingsPage = lazy(() => import('../features/patient-records/SettingsPage'));
const TeamProfile = lazy(() => import('../pages/TeamProfile'));

// Route guard requiring authenticated user contexts
const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
          <p className="text-xs font-semibold text-slate-500 tracking-wider">Validating Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route guard preventing authenticated users from visiting guest-only routes
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
          <p className="text-xs font-semibold text-slate-500 tracking-wider">Validating Session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Fallback loader during route transitions
const PageLoader = () => (
  <div className="flex h-full min-h-[300px] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-100 border-t-brand-500" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'family-members',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'family-members/:patientId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PatientProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MedicalReportsPage />
          </Suspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AnalyticsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: 'symptoms',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SymptomCheckerPage />
          </Suspense>
        ),
      },
      {
        path: 'predict',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MlPredictorPage />
          </Suspense>
        ),
      },
      {
        path: 'records',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MedicalRecordsPage />
          </Suspense>
        ),
      },
      {
        path: 'assessment',
        element: (
          <Suspense fallback={<PageLoader />}>
            <HealthAssessmentPage />
          </Suspense>
        ),
      },
      {
        path: 'patient-records',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'patient-records/:patientId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PatientProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'team/:developerId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TeamProfile />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
