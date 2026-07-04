import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const LeavePage = lazy(() => import('./pages/LeavePage'))
const ReportsDashboard = lazy(() => import('./pages/reports/ReportsDashboard'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))

const loadingScreen = (
  <div className="grid min-h-screen place-items-center text-sm text-slate-500">
    Loading PeopleFlow…
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={loadingScreen}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/leave" element={<ProtectedRoute><LeavePage /></ProtectedRoute>} />
            <Route
              path="/reports"
              element={<ProtectedRoute allowedRoles={['hr', 'admin']}><ReportsDashboard /></ProtectedRoute>}
            />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route
              path="/unauthorized"
              element={
                <div className="grid min-h-screen place-items-center bg-gray-50 text-center">
                  <div><h1 className="text-4xl font-bold text-gray-900">Unauthorized</h1><p className="mt-2 text-gray-600">You do not have permission to access this page.</p></div>
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  )
}
