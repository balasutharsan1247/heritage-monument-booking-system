import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PublicLayout } from './layouts/PublicLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoader } from './components/ui/Spinner';

// Route-level lazy loading (Code Splitting)
const Home = lazy(() => import('./pages/Home'));
const Monuments = lazy(() => import('./pages/Monuments'));
const MonumentDetails = lazy(() => import('./pages/MonumentDetails'));
const Booking = lazy(() => import('./pages/Booking'));
const TicketConfirmation = lazy(() => import('./pages/TicketConfirmation'));
const MyTickets = lazy(() => import('./pages/MyTickets'));
const Wallet = lazy(() => import('./pages/Wallet'));
const StaffQueue = lazy(() => import('./pages/StaffQueue'));
const StaffValidate = lazy(() => import('./pages/StaffValidate'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PublicQueue = lazy(() => import('./pages/PublicQueue'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader message="Loading National Heritage Portal..." />}>
            <Routes>
              
              {/* Standalone Kiosk Route (No layout header/footer for big-screen TVs) */}
              <Route path="queue/:id" element={<PublicQueue />} />

              {/* Standard Portal Routes with PublicLayout */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="monuments" element={<Monuments />} />
                <Route path="monuments/:id" element={<MonumentDetails />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />

                {/* Visitor-Only Routes */}
                <Route
                  path="book/:id"
                  element={
                    <ProtectedRoute roles={['visitor']}>
                      <Booking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="tickets/:id"
                  element={
                    <ProtectedRoute roles={['visitor']}>
                      <TicketConfirmation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-tickets"
                  element={
                    <ProtectedRoute roles={['visitor']}>
                      <MyTickets />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="wallet"
                  element={
                    <ProtectedRoute roles={['visitor', 'admin']}>
                      <Wallet />
                    </ProtectedRoute>
                  }
                />

                {/* Staff Routes */}
                <Route
                  path="staff"
                  element={<Navigate to="/staff/queue" replace />}
                />
                <Route
                  path="staff/queue"
                  element={
                    <ProtectedRoute roles={['staff', 'admin']}>
                      <StaffQueue />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="staff/validate"
                  element={
                    <ProtectedRoute roles={['staff', 'admin']}>
                      <StaffValidate />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="admin"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/monuments"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/treasury"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/queues"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/predictions"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/rbac"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Catch-All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>

            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;